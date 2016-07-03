/**
 * @module tasks
 *
 * Contains tasks that are shared between multiple sub generators.
 */

'use strict';

const constants                   = require('./constants');
const utils                       = require('./utils');


function injectDefaultConstructor(generator) {

    /**
     * Map of available generators.
     * @type {Array}
     */
    generator.available = [];

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
 * Validates input for --host option.
 */
function validateHost(generator) {
  return () => {
    if (typeof generator.options.host === 'undefined') {
      generator.env.error(`Please provide the name of the host generator by appending --host=<generator-name>`);
    }

    generator.hostBaseName = generator.options.host;
    generator.hostFullName = 'generator-' + generator.options.host;
  }
}


/**
 * Caches installed npm packages in class variable.
 */
function cacheInstalledPackages(generator) {
  return () => {
    const pkgQ = utils.getInstalledPackages();

    if (pkgQ.hasError) {
      generator.env.error(`Retrieving a list of installed packages failed. Error: ${pkgQ.error}`);
    }

    generator.pkgList = pkgQ.results;
  }
}


/**
 * Validates that the required host generator exists in the installed packages.
 *
 * @depends
 */
function validateHostgenExists(generator) {
  return () => {
    if (!utils.checkPkgExists(generator.hostFullName, generator.pkgList.dependencies)) {
      generator.env.error(`Couldn't verify that host generator ${generator.hostFullName} is installed.`);
    }
  }
}


/**
 * Scans package for installed subgens.
 */
function scan() {
  const extgens = utils.findExternalSubgens(constants.SUBGEN_PREFIX_PATTERNS, this.hostBaseName, this.pkgList.dependencies);

  if (extgens.hasError) {
    this.env.error(`The npm list command threw an error and we can't proceed. :( Error: ${extgens.error}`);
  }

  this.available = extgens.results;
}


/**
 * Adds activation state information to the list of available external subgens.
 */
function checkActivationState(generator) {
  return () => {
    generator.available.forEach(subgen => {
      const check = utils.checkActivationState(generator.hostFullName, subgen.basename, generator.pkgList.dependencies);

      if (check.hasError) {
        generator.env.error(`Checking the activation state for ${subgen.basename} failed. Error: ${check.error}`);
      }

      subgen.isActivated = utils.checkActivationState(generator.hostFullName, subgen.basename).result;
    });
  };
}


/**
 * Adds information whether found subgens are declared to be compatible with the hostgen version.
 */
function validateCompatibility() {
  return() => {
    // TODO validate compatibility between subgen and hostgen.
  }
}


module.exports = {
  cacheInstalledPackages,
  checkActivationState,
  injectDefaultConstructor,
  scan,
  validateCompatibility,
  validateHost,
  validateHostgenExists
};
