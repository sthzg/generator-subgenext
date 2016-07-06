'use strict';

var existsSync                    = require('fs').existsSync;
var globby                        = require('globby');
var lodash                        = require('lodash');
var path                          = require('path');
var StringDecoder                 = require('string_decoder').StringDecoder;


/**
 * Builds a default error object.
 * @param err   string or object providing error information
 * @returns {{hasError: boolean, error: *}}
 */
function buildError(err = null) {
  return {
    hasError : true,
    error    : err
  };
}


/**
 * Builds a default success object.
 * @param data    an object that will be merged into the return body.
 * @returns {*}
 */
function buildSuccess(data) {
  return Object.assign({}, { hasError: false }, data);
}


/**
 * Returns UTF-8 decoded and JSON-parsed representation of `buffer`.
 * @param buffer
 */
function getDecodedAsJson(buffer) {
  return JSON.parse(getDecodedAsString(buffer));
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
  return lodash.flattenDeep(
    lodash
      .filter(
        searchPaths,
        root => typeof root !== 'undefined' && root !== null
      ).map(
        root => globby
          .sync(['*'], { cwd: root })
          .map(match => path.join(root, match))
      )
  );
}


/**
 * Returns a list of package info objects based on their local paths.
 * @param pkgPaths
 * @returns {*|{}|Array}
 */
function populatePkgStoreFromPaths(pkgPaths) {
  // TODO refactor to ImmutableJS Record
  return pkgPaths.map(x => {
    return {
      path: x,
      pjson: null,
      version: null,
      basename: null,
      name: null
    }
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

  const pkg = lodash.find(
    installed, pkg => (exact)
      ? path.basename(pkg.path) === pkgName
      : path.basename(pkg.path).indexOf(pkgName) !== -1
  );

  if (pkg !== undefined) {
    const pjson = loadPkgJsonFromPkgPath(pkg.path);

    pkg.pjson = pjson;
    pkg.version = pjson.version;
    pkg.name = pjson.name;

    return buildSuccess({ pkg: pkg });

  } else {
    buildError(`${pkgName} not found in installed packages.`);
  }
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
  return buildSuccess({
    result: existsSync(path.join(hostPkg.path, 'generators', subgenBaseName))
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
  return lodash.some(installed, pkg => regex.exec(path.basename(pkg.path)) !== null);
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

  const pkgs = lodash.filter(installed, pkg => {
    return lodash.some(regexps.filter(regex => regex.exec(path.basename(pkg.path)) !== null));
  });

  return buildSuccess({
    results: pkgs.map(pkg => {
      const pjson = loadPkgJsonFromPkgPath(pkg.path);

      pkg.basename = getSubgenBaseName(host, prefixes, pjson.name);
      pkg.name = pjson.name;
      pkg.pjson = pjson;
      pkg.version = pjson.version;

      return pkg;
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
