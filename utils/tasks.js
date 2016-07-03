/**
 * @module tasks
 *
 * Contains tasks that are shared between multiple sub generators.
 */

'use strict';

const constants                   = require('./constants');
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
     * Json representation of all installed packages in depth=0
     * We cache this value in a variable since invoking the shell command is expensive and slow.
     *
     * @type {?Json}
     */
    generator.pkgList = null;

    generator.option('host', {
      desc     : 'Name of the host generator',
      type     : 'String',
      required : true
    });

}


/**
 * Injects property and configuration for positional `subgen` argument.
 * @param generator
 */
function injectSubgenArg(generator) {

  /**
   * Name of the subgen to apply operation on.
   * @type {?String}
   */
  generator.subgenName = null;

  generator.argument('subgen', {
    type: String,
    required: true
  });
}


/**
 * Validates input for --host option.
 */
function validateHostName(generator) {
  if (typeof generator.options.host === 'undefined') {
    generator.env.error(`Please provide the name of the host generator by appending --host=<generator-name>`);
  }

  generator.hostBaseName = generator.options.host;
  generator.hostFullName = 'generator-' + generator.options.host;
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
  if (!utils.checkPkgExists(generator.subgenName, generator.pkgList.dependencies, false)) {
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
    const check = utils.checkActivationState(generator.hostFullName, subgen.basename, generator.pkgList.dependencies);

    if (check.hasError) {
      generator.env.error(`Checking the activation state for ${subgen.basename} failed. Error: ${check.error}`);
    }

    subgen.isActivated = utils.checkActivationState(generator.hostFullName, subgen.basename).result;
  });
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
  injectDefaultConstructor,
  injectSubgenArg,
  scanForInstalledSubgens,
  validateCompatibility,
  validateHostgenExists,
  validateHostName,
  validateSubgenExists,
  validateSubgenName
};
