'use strict';

var readFileSync                  = require('fs').readFileSync;
var existsSync                    = require('fs').existsSync;
var globby                        = require('globby');
var Immutable                     = require('immutable');
var Map                           = require('immutable').Map;
var path                          = require('path');
var semver                        = require('semver');

var records                       = require('./records.js');

/**
 * Builds a default error object.
 *
 * @param err   string or object providing error information
 * @returns     Msg Record
 */
function buildError(err = null) {
  return records.ErrorMsg(err);
}


/**
 * Builds a default success object.
 *
 * @param data  an object that will be merged into the return body.
 * @returns     Msg Record
 */
function buildSuccess(data = {}) {
  return records.SuccessMsg(data);
}

/**
 * Returns the namespace with appended {@code sep} if {@code subgenNamespace} is not empty.
 *
 * @param {String} subgenNamespace
 * @param {String} sep
 * @return {string}
 */
function buildSubgenNamespaceWithSeparator(subgenNamespace, sep = '-') {
  return (subgenNamespace === '') ? '' : subgenNamespace + sep;
}


/**
 * Returns a list of all depth=0 directory paths inside `searchPaths`.
 *
 * @param searchPaths   an array of paths to list root dirs (usually from env.getNpmSearchPaths())
 * @returns {*}
 */
function getInstalledPkgPaths(searchPaths) {
  return searchPaths
    // don't act on nonsensical data
    .filter(root => typeof root !== 'undefined' && root !== null && root !== '')
    // collect first level directory in all directories
    .map(root => globby
      .sync(['*'], { cwd: root })
      .map(match => path.join(root, match)))
    // flatten and only store unique values
    .reduce((prev, curr) => { curr.forEach(x => { if (prev.indexOf(x) === -1) { prev.push(x) } }); return prev }, []);
}


/**
 * Returns a list of package info objects based on their local paths.
 *
 * @param pkgPaths
 * @returns {*|{}|Array}
 */
function populatePkgStoreFromPaths(pkgPaths) {
  return pkgPaths.map(path => {
    return records.HostGenPkg({ path: path });
  });
}


/**
 * Returns package info for `pkgName` if found in `installed`.
 *
 * @param pkgName   name of the package to query info for
 * @param haystack  list of npm packages to search for {@code pkgName}
 * @param exact     flag indicating whether match has to be exact, defaults to true
 * @returns {*}
 */
function getPkgInfo(pkgName, haystack, exact=true) {
  var pkg = haystack.find(
    pkg => (exact)
      ? path.basename(pkg.get('path')) === pkgName
      : path.basename(pkg.get('path')).indexOf(pkgName) !== -1
  );

  if (pkg !== undefined) {
    const pjson = loadPkgJsonFromPkgPath(pkg.get('path'));

    pkg = pkg.merge({
      pjson: pjson,
      version: pjson.version,
      name: pjson.name
    });

    return buildSuccess({ pkg: pkg });
  }

  return buildError(`${pkgName} not found in installed packages.`);
}


/**
 * Returns an array of regexp instances for external subgen naming patterns.
 *
 * @param patterns    array of string patterns
 * @param host        name of the host generator
 * @returns {Iterable<K, RegExp>|*|Array|{}}
 */
function buildPrefixRegexps(patterns, host) {
  return patterns.map(prefix => new RegExp(`^${prefix}${host}-`));
}


/**
 * Returns the basename of a subgen (i.e the name without the package prefixes).
 *
 * @param host        name of the host generator
 * @param patterns    array of string patterns
 * @param pkgName     name of the package to infer the basename from
 * @returns {string|void|XML|*}
 */
function getSubgenBaseName(host, patterns, pkgName) {
  // TODO gh_issue 13, return Success or Error record
  const sorted  = sortCharArrByLength(patterns);
  const regexps = buildPrefixRegexps(sorted, host);
  const prefix  = regexps.find(regex => regex.exec(pkgName) !== null);

  return pkgName.replace(prefix, '');
}


/**
 * Returns whether `subgen` is activated on the host generator.
 *
 * @param {Object} hostPkg     package object for host generator
 * @param {String} basename    basename for subgen
 * @param {String} namespace   basename for subgen
 * @returns {String}
 */
function checkActivationState(hostPkg, basename, namespace = '') {
  const hostPath = hostPkg.get('path');
  return buildSuccess({
    result: existsSync(path.join(hostPath, 'generators', `${buildSubgenNamespaceWithSeparator(namespace)}${basename}`))
  });
}


/**
 * Checks if `pkgName` exists in installed npm packages.
 *
 * @param pkgName   name of the package to query info for
 * @param installed Json object of installed npm packages
 * @param exact     flag indicating whether `pkgName` needs to match exactly
 * @returns {boolean}
 */
function checkPkgExists(pkgName, installed, exact=true) {
  const regex   = new RegExp( (exact) ? `^${pkgName}$` : pkgName );
  return installed.some(pkg => regex.exec(path.basename(pkg.get('path'))) !== null);
}


/**
 * Checks if the host dependency of the sub generator is satisfied.
 *
 * @param hostPkg   Json object of the host package
 * @param subgenPkg Json object of the subgen package
 * @returns {Msg}
 */
function checkHostgenDependency(hostPkg, subgenPkg) {
  const hostVersion = hostPkg.version;
  const hostName = hostPkg.name;
  const requiredVersion = subgenPkg.get('peerDependencies').get(hostName);

  if (semver.satisfies(hostVersion, requiredVersion)) {
    return buildSuccess({
      required: requiredVersion,
      available: hostVersion
    });
  }

  return buildError({
    required: requiredVersion,
    available: hostVersion
  });
}


/**
 * Scans current package for installed subgens.
 *
 * Subgens are installed as regular npm packages and follow a naming convention by which they can be determined.
 *
 * @param prefixes    an array of prefixes for package names that are considered to be subgens
 * @param host        name of the host generator
 * @param installed   Json object of currently installed npm packages
 * @returns {*}
 */
function findExternalSubgens(prefixes, host, installed) {
  var regexps = buildPrefixRegexps(prefixes, host);

  const bname = (x) => path.basename(x.get('path'));

  const pkgs = installed
    // Filter all packages that don't match a subgen naming pattern
    .filter(pkg => regexps.some(regexp => regexp.exec(bname(pkg)) !== null))
    // Only add the first match of each node package (FIFO)
    .reduce((prev, curr) => { if (prev.every(x => bname(x) !== bname(curr))) { prev.push(curr); } return prev; }, []);

  return buildSuccess({
    results: pkgs.map(pkg => {
      const pjson = loadPkgJsonFromPkgPath(pkg.get('path'));

      const authorCfg = typeof pjson["generator-subgenext"] === 'undefined'
        ? new Map()
        : Immutable.fromJS(pjson["generator-subgenext"])
        ;

      return records.SubGenPkg()
        .merge(pkg)
        .merge({
          authorCfg,
          pjson,
          basename: getSubgenBaseName(host, prefixes, pjson.name),
          name: pjson.name,
          version: pjson.version,
          peerDependencies: pjson.peerDependencies
        });
    })
  });
}


/**
 * Returns indicator whether yesno prompts should be automatically confirmed.
 *
 * @param {boolean} bool
 * @return {boolean}
 */
function shouldAutoConfirmYesnos(bool) {
  return bool || false;
}


/**
 * Returns package.json from a package's install path
 *
 * @param dir     base path of the installed package
 * @returns {*}
 */
function loadPkgJsonFromPkgPath(dir) {
  return JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'));
}


/**
 * Sorts strings inside `arr` based on char length.
 *
 * @param arr     array to sort
 * @param desc    flag that indicates whether to sort in descending or ascending order
 * @returns {Array.<T>|*|Iterable<K, V>}
 */
function sortCharArrByLength(arr, desc=true) {
  return arr.sort((a, b) => {
    return (desc) ? b.length - a.length : a.length - b.length;
  });
}


function getScanResultTable(generator) {
  return (generator.availableExtgens.map((gen, idx) => {
    const id = idx + 1;
    const name = gen.get('name');
    const version = gen.get('version');
    const activated = (gen.get('isActivated')) ? '(activated)' : '(not activated)';
    const dependency = this.checkHostgenDependency(generator.hostPkg, gen);

    var satisfied = `Host dependency satisfied: ${dependency.data.get('required')}`;
    if(dependency.hasError) {
      satisfied= `Host dependency failed: ${dependency.data.get('err').get('required')}`;
    }

    return ['', id, name, version, satisfied, activated];
  })).toArray()

}

function getScanResultTableHeader(name, version, count) {
  return `Found ${count} ${(count === 1) ? 'sub generator' : 'sub generators'} for ${name} (${version})`;
}


module.exports = {
  buildError,
  buildPrefixRegexps,
  buildSubgenNamespaceWithSeparator,
  buildSuccess,
  checkActivationState,
  checkPkgExists,
  checkHostgenDependency,
  getPkgInfo,
  getInstalledPkgPaths,
  getScanResultTable,
  getScanResultTableHeader,
  getSubgenBaseName,
  findExternalSubgens,
  populatePkgStoreFromPaths,
  shouldAutoConfirmYesnos,
  sortCharArrByLength
};
