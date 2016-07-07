'use strict';

var existsSync                    = require('fs').existsSync;
var globby                        = require('globby');
var path                          = require('path');
var StringDecoder                 = require('string_decoder').StringDecoder;
var records                       = require('./records.js');

/**
 * Builds a default error object.
 * @param err   string or object providing error information
 * @returns     Message Record
 */
function buildError(err = null) {
  return records.ErrorMsg({data: err});
}


/**
 * Builds a default success object.
 * @param data  an object that will be merged into the return body.
 * @returns     Message Record
 */
function buildSuccess(data = {}) {
  return records.SuccessMsg(data);
}


/**
 * Returns UTF-8 decoded string representation of `buffer`.
 * @param buffer
 */
function getDecodedAsString(buffer) {
  var decoder = new StringDecoder('utf-8');
  return decoder.write(buffer);
}


/**
 * Returns a list of all depth=0 directory paths inside `searchPaths`.
 * @param searchPaths   an array of paths to list root dirs (usually from env.getNpmSearchPaths())
 * @returns {*}
 */
function getInstalledPkgPaths(searchPaths) {
  return searchPaths
    .filter(root => typeof root !== 'undefined' && root !== null && root !== '')
    .map(root => globby
      .sync(['*'], { cwd: root })
      .map(match => path.join(root, match)))
    .reduce((prev, curr) => { curr.forEach(x => prev.push(x)); return prev }, []);
}


/**
 * Returns a list of package info objects based on their local paths.
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
 * @param pkgName   name of the package to query info for
 * @param installed Json object of installed npm packages
 * @param exact     flag indicating whether match has to be exact, defaults to true
 * @returns {*}
 */
function getPkgInfo(pkgName, installed, exact=true) {
  var pkg = installed.find(
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
 * @param patterns    array of string patterns
 * @param host        name of the host generator
 * @returns {Iterable<K, RegExp>|*|Array|{}}
 */
function buildPrefixRegexps(patterns, host) {
  return patterns.map(prefix => new RegExp(`^${prefix}${host}-`));
}


/**
 * Returns the basename of a subgen (i.e the name without the package prefixes).
 * @param host        name of the host generator
 * @param patterns    array of string patterns
 * @param pkgName     name of the package to infer the basename from
 * @returns {string|void|XML|*}
 */
function getSubgenBaseName(host, patterns, pkgName) {
  const sorted  = sortCharArrByLength(patterns);
  const regexps = buildPrefixRegexps(sorted, host);
  const prefix  = regexps.find(regex => regex.exec(pkgName) !== null);

  return pkgName.replace(prefix, '');
}


/**
 * Returns whether `subgen` is activated on the host generator.
 * @param hostPkg           package object for host generator
 * @param subgenBaseName    basename for subgen
 * @returns {*}
 */
function checkActivationState(hostPkg, subgenBaseName) {
  const hostPath = hostPkg.get('path');
  return buildSuccess({
    result: existsSync(path.join(hostPath, 'generators', subgenBaseName))
  });
}


/**
 * Checks if `pkgName` exists in installed npm packages.
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

  const pkgs = installed.filter(pkg =>
    regexps.some(regexp => regexp.exec(path.basename(pkg.get('path'))) !== null)
  );

  return buildSuccess({
    results: pkgs.map(pkg => {
      const pjson = loadPkgJsonFromPkgPath(pkg.get('path'));
      var subGenPkg = records.SubGenPkg();
      var subGenPkg = subGenPkg.merge(pkg);
      subGenPkg = subGenPkg.merge({
        basename: getSubgenBaseName(host, prefixes, pjson.name),
        name: pjson.name,
        pjson: pjson,
        version: pjson.version
      });

      return subGenPkg;
    })
  });
}


/**
 * Returns package.json from a package's install path
 * @param dir     base path of the installed package
 * @returns {*}
 */
function loadPkgJsonFromPkgPath(dir) {
  return require(path.join(dir, 'package.json'));
}


/**
 * Sorts strings inside `arr` based on char length.
 * @param arr     array to sort
 * @param desc    flag that indicates whether to sort in descending or ascending order
 * @returns {Array.<T>|*|Iterable<K, V>}
 */
function sortCharArrByLength(arr, desc=true) {
  return arr.sort((a, b) => {
    return (desc) ? b.length - a.length : a.length - b.length;
  });
}


module.exports = {
  checkActivationState,
  checkPkgExists,
  getPkgInfo,
  getInstalledPkgPaths,
  findExternalSubgens,
  populatePkgStoreFromPaths
};
