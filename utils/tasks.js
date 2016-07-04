/**
 * @module tasks
 *
 * Contains tasks that are shared between multiple sub generators.
 */

'use strict';

const constants                   = require('./constants');
const Immutable                   = require('immutable');
const path                        = require('path');
const utils                       = require('./utils');


/**
 * Sets default properties relevant for multiple subgens on the generator object.
 * @param generator   instance of yeoman base generator
 */
function injectDefaultConstructor(generator) {

  /**
   * Map of availableExtgens generators.
   * @type {Array}
   */
  generator.availableExtgens = [];

  /**
   * Basename of the host generator.
   * @type String
   */
  generator.hostBaseName = null;

  /**
   * Fully qualified package name of the host generator.
   * @type {?String}
   */
  generator.hostFullName = null;

  /**
   * Package entry from npm list as Json.
   * @type {?Json}
   */
  generator.hostPkg = null;

  /**
   * Json representation of all installed packages in depth=0
   * We cache this value in a variable since invoking the shell command is expensive and slow.
   *
   * @type {?Json}
   */
  generator.pkgList = null;

  /**
   * Map with configuration data for subgenext (loaded from subgenext.json if exists)
   * @type {Immutable.Map}
   */
  generator.subgenConfig = Immutable.Map();

  generator.option('host', {
    desc: 'Name of the host generator',
    type: 'String',
    required: true
  });

}


/**
 * Injects property and configuration for positional `subgen` argument.
 * @param generator
 */
function makeSubgenAware(generator) {

  /**
   * Name of the subgen to apply operation on.
   * @type {?String}
   */
  generator.subgenName = null;

  /**
   * Package entry from npm list as Json.
   * @type {?Json}
   */
  generator.subgenPkg = null;

  /**
   * Source directory of installed subgen.
   * @type {?string}
   */
  generator.subgenSrc = null;

  /**
   * Destination directory of subgen in host generator.
   * @type {null}
   */
  generator.subgenDest = null;

  generator.argument('subgen', {
    type: String,
    required: true
  });
}


function loadSubgenConfig(generator) {
  const cfgPath = path.join(generator.env.cwd, 'subgenext.json');
  if (generator.fs.exists(cfgPath)) {
    generator.subgenConfig = generator.subgenConfig.mergeDeep(Immutable.fromJS(require(cfgPath)));
  }
}

/**
 * Validates input for --host option.
 */
function validateHostName(generator) {
  if (typeof generator.options.host === 'undefined' && !generator.subgenConfig.get('defaultHost', false)) {
    generator.env.error(`Please provide the name of the host generator by appending --host=<generator-name>`);
  }

  generator.hostBaseName = generator.subgenConfig.get('defaultHost', generator.options.host);
  generator.hostFullName = 'generator-' + generator.hostBaseName;
}


/**
 * Validates input for the positional `subgen` argument
 */
function validateSubgenName(generator) {
  generator.subgenName = generator.subgen;
}


/**
 * Caches installed npm packages in class variable.
 */
function cacheInstalledPackages(generator) {
  const pkgQ = utils.getInstalledPackages();

  if (pkgQ.hasError) {
    generator.env.error(`Retrieving a list of installed packages failed. Error: ${pkgQ.error}`);
  }

  generator.pkgList = pkgQ.results;
}


/**
 * Validates that the required host generator exists in the installed packages.
 *
 * @depends
 */
function validateHostgenExists(generator) {
  if (!utils.checkPkgExists(generator.hostFullName, generator.pkgList.dependencies)) {
    generator.env.error(`Couldn't verify that host generator ${generator.hostFullName} is installed.`);
  }
}


function populateHostgenPkg(generator) {
  generator.hostPkg = utils.getPkgInfo(generator.hostFullName, generator.pkgList.dependencies);
}


/**
 * Validates that the required sub generator exists in the installed packages.
 *
 * @depends
 */
function validateSubgenExists(generator) {
  // TODO Fix ambiguity problems with subgen validation check.
  // Currently all we do is matching `subgenName` as a substring, which has two problems:
  // 1. ambiguous when multiple subgens share a token, e.g. subgen-helloworld, subgen-helloworld-evening
  // 2. ambiguous on vendor and contrib subgens with same name (e.g. subgen-controller and contrib-subgen-controller)
  if (!utils.checkPkgExists(generator.subgenName, generator.availableExtgens, false)) {
    generator.env.error(`Couldn't verify that subgen ${generator.subgenName} is installed.`);
  }
}


/**
 * Scans package for installed subgens.
 */
function scanForInstalledSubgens(generator) {
  const extgens = utils.findExternalSubgens(
    constants.SUBGEN_PREFIX_PATTERNS,
    generator.hostBaseName,
    generator.pkgList.dependencies
  );

  if (extgens.hasError) {
    generator.env.error(`The npm list command threw an error and we can't proceed. :( Error: ${extgens.error}`);
  }

  generator.availableExtgens = extgens.results;
}


/**
 * Adds activation state information to the list of availableExtgens external subgens.
 */
function checkActivationState(generator) {
  generator.availableExtgens.forEach(subgen => {
    subgen.isActivated = utils.checkActivationState(generator.hostPkg, subgen.basename).result;
  });
}


/**
 * Populates class member with subgen package information.
 * @param generator
 */
function getSubgenPkg(generator) {
  const subgen = utils.getPkgInfo(generator.subgenName, generator.availableExtgens, false);

  if (subgen.hasError) {
    generator.env.error(`Unable to find package entry fro ${generator.subgenName}. Error: ${subgen.error}`);
  }

  generator.subgenPkg = subgen;
}


/**
 * Populates class member with subgen source path.
 */
function getSubgenSrcPath(generator) {
  const pkg = generator.subgenPkg;
  generator.subgenSrc = path.join(pkg.path, 'generators', generator.subgenName);
}


/**
 * Populates class member with subgen destination path.
 */
function getSubgenDestPath(generator) {
  const pkg = generator.hostPkg;
  generator.subgenDest = path.join(pkg.path, 'extgens', generator.subgenName);
}


/**
 * Adds information whether found subgens are declared to be compatible with the hostgen version.
 */
function validateCompatibility() {
  // TODO validate compatibility between subgen and hostgen.
}


module.exports = {
  cacheInstalledPackages,
  checkActivationState,
  getSubgenDestPath,
  getSubgenPkg,
  getSubgenSrcPath,
  injectDefaultConstructor,
  loadSubgenConfig,
  makeSubgenAware,
  populateHostgenPkg,
  scanForInstalledSubgens,
  validateCompatibility,
  validateHostgenExists,
  validateHostName,
  validateSubgenExists,
  validateSubgenName
};
