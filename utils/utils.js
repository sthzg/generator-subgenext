'use strict';

var execSync                      = require('child_process').execSync;
var existsSync                    = require('fs').existsSync;
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
  var decoder = new StringDecoder('utf8');
  return JSON.parse(decoder.write(buffer));
}


/**
 * Invokes npm on the shell to get a list of installed packages.
 * @returns {*}
 */
function getModuleList() {
  try {
    const results = execSync("npm la --depth=0 --json");
    return buildSuccess({ results: results });
  } catch (err) {
    return buildError(err);
  }
}


/**
 * Invokes npm on the shell to get info about `pkgName`.
 * @param pkgName   name of the package to query info for
 * @returns {*}
 */
function getPkgInfo(pkgName) {
  try {
    const results = getDecodedAsJson(execSync(`npm la ${pkgName} --json`));

    if (results.hasError) {
      return buildError(results.error);
    }

    if (typeof results.dependencies[pkgName] === 'undefined') {
      return buildError(`${pkgName} doesn't seem to be available as dependency.`);
    }

    let result = results.dependencies[pkgName];

    return buildSuccess({
      path    : result.path,
      name    : result.name,
      version : result.version
    });

  } catch (err) {
    return buildError(err);
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
 * @param host        name of the host generator
 * @param subgen      name of the sub generator
 * @returns {*}
 */
function checkActivationState(host, subgen) {
  var hostPkg = getPkgInfo(host);

  if (hostPkg.hasError) {
    return buildError(`Couldn't get information for package ${host}. Error: ${hostPkg.error}`);
  }

  return buildSuccess({
    result: existsSync(path.join(hostPkg.path, 'generators', subgen))
  });

}


/**
 * Scans current package for installed subgens.
 *
 * Subgens are installed as regular npm packages and follow a naming convention by which they can be determined.
 *
 * @param prefixes    an array of prefixes for package names that are considered to be subgens
 * @param host        name of the host generator
 * @returns {*}
 */
function findExternalSubgens(prefixes, host) {
  const mods = getModuleList();

  if (mods.hasError) { return mods; }

  var results = getDecodedAsJson(mods.results);
  var regexps = buildPrefixRegexps(prefixes, host);

  const matches = lodash.filter(results.dependencies, dep => {
    return lodash.some(regexps.filter(regex => regex.exec(dep.name) !== null));
  });

  return buildSuccess({
    results: matches.map(match => {
      return {
        'basename' : getSubgenBaseName(host, prefixes, match.name),
        'name'     : match.name,
        'path'     : match.path,
        'version'  : match.version
      }
    })
  });

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
  findExternalSubgens
};
