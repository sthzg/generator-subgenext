/**
 * @module tasks
 *
 * Contains tasks that are shared between multiple sub generators.
 */

'use strict';

const fs                          = require('fs');
const Immutable                   = require('immutable');

const constants                   = require('./constants');
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
   * Free to use message object on the generator.
   * Generators may use this pojo to store arbitrary data on the generator (e.g. to pass data to another priority).
   * @type {{}}
   */
  generator.genData = {};

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
    type: 'String'
  });

  generator.option('yes', {
    desc: 'Confirm all yesnos with yes',
    type: 'Boolean'
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


/**
 * Activates an external subgen by linking inside the hostgen.
 * @param generator
 */
function activateSubgen(generator) {
  if (!fs.existsSync(generator.subgenDest)) {
    var done = generator.async();

    const run = (shouldProceed) => {

      if (!shouldProceed) {
        generator.env.error('Operation cancelled by user.');
        done();
      }

      fs.symlinkSync(generator.subgenSrc, generator.subgenDest);
      generator.genData.activation = utils.buildSuccess({});

      done();
    };

    if (utils.shouldAutoConfirmYesnos(generator.options.yes)) {
      run(true);
    } else {
      generator.prompt({
        type: 'confirm',
        name: 'proceed',
        message: `I will create a symlink\nfrom =>\t${generator.subgenSrc}\nin =>\t${generator.subgenDest}\nConfirm to proceed:`
      })
      .then(
        answers => run(answers.proceed)
      );
    }

  } else {
    const err = 'Subgen with name ' + generator.subgenName + ' is already activated. If you want to update it, make ' +
      'sure to deactivate it first. This is a NOOP.';
    generator.genData.activation = utils.buildError(err);
  }
}


/**
 * Activates an external subgen by unlinking it from the hostgen.
 * @param generator
 */
function deactivateSubgen(generator) {
  if (fs.existsSync(generator.subgenDest)) {
    var done = generator.async();

    const run = (shouldProceed) => {

      if (!shouldProceed) {
        generator.env.error('Operation cancelled by user.');
        done();
      }

      fs.unlinkSync(generator.subgenDest);
      generator.genData.deactivation = utils.buildSuccess({});

      done();
    };

    if (utils.shouldAutoConfirmYesnos(generator.options.yes)) {
      run(true);
    } else {
      generator.prompt({
        type: 'confirm',
        name: 'proceed',
        message: `I will remove this symlink\n=> ${generator.subgenDest}\nConfirm to proceed:`
      })
        .then(
          answers => run(answers.proceed)
        );
    }
  } else {
    const err = `Subgen with name "${generator.subgenName}" doesn't seem to be activated. This is a NOOP.`;
    generator.genData.deactivation = utils.buildError(err);
  }
}


/**
 * Saves an immutable version of the subgenerator configuration in {@code generator.subgenConfig}.
 * @param {Object} generator
 */
function loadSubgenConfig(generator) {
  generator.subgenConfig = Immutable.fromJS(generator.config.getAll());
}

/**
 * Validates input for --host option.
 */
function validateHostName(generator) {
  const defaultHost = generator.subgenConfig.get('defaultHost', false);

  if (typeof generator.options.host === 'undefined' && !defaultHost) {
    generator.env.error('Please provide the name of the host generator by appending --host=<generator-name>');
  }

  generator.hostBaseName = generator.options.host || defaultHost;
  generator.hostFullName = 'generator-' + generator.hostBaseName;
}


/**
 * Validates input for the positional `subgen` argument
 */
function validateSubgenName(generator) {
  generator.subgenName = generator.subgen;
}


/**
 * Caches root paths to installed npm packages into class member.
 */
function cacheInstalledPackages(generator) {
  generator.pkgList = utils.populatePkgStoreFromPaths(
    utils.getInstalledPkgPaths(generator.env.getNpmPaths())
  );
}


/**
 * Validates that Yeoman can resolve the host generator.
 */
function validateHostgenExists(generator) {
  if (!generator.env.getGeneratorNames().some(name => name === generator.hostBaseName)) {
    generator.env.error(`Couldn't verify that host generator ${generator.hostFullName} is installed.`);
  }
}


/**
 * Populates `hostPkg` class member with package information from the host generator.
 * @param generator
 */
function populateHostgenPkg(generator) {
  validateHostgenExists(generator);
  const pkgQ = utils.getPkgInfo(generator.hostFullName, generator.pkgList);
  generator.hostPkg = pkgQ.data.get('pkg');
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
  const prefix = constants.SUBGEN_PREFIX_PATTERNS;
  const hostName = generator.hostBaseName;
  const pkgList = generator.pkgList;
  const extgens = utils.findExternalSubgens(prefix, hostName, pkgList);

  generator.availableExtgens = extgens.data.get('results');
}


/**
 * Adds activation state information to the list of availableExtgens external subgens.
 */
function checkActivationState(generator) {
  const hostPkg = generator.hostPkg
  generator.availableExtgens = generator.availableExtgens.map((subgen) => {
    const subgenBaseName = subgen.get('basename');
    const activationState = utils.checkActivationState(hostPkg, subgenBaseName).data.get('result');

    return subgen.set('isActivated', activationState);
  });
}


/**
 * Populates class member with subgen package information.
 * @param generator
 */
function setSubgenPkg(generator) {
  const subgen = utils.getPkgInfo(generator.subgenName, generator.availableExtgens, false);
  generator.subgenPkg = subgen.data.get('pkg');
}


/**
 * Populates class member with subgen source path.
 */
function setSubgenSrcPath(generator) {
  const pkg = generator.subgenPkg;
  generator.subgenSrc = path.join(pkg.get('path'), 'generators', generator.subgenName);
}


/**
 * Validates the existence of a subgen and populates it.
 */
function populateSubgenPkg(generator) {
  validateSubgenExists(generator);
  setSubgenPkg(generator);
}


/**
 * Populates class member with subgen destination path.
 */
function setSubgenDestPath(generator) {
  const pkg = generator.hostPkg;
  generator.subgenDest = path.join(pkg.get('path'), 'generators', generator.subgenName);
}


/**
 * Adds information whether found subgens are declared to be compatible with the hostgen version.
 */
function validateCompatibility(generator) {
  const hostPkg = generator.hostPkg;
  const subgenPkg = generator.subgenPkg;

  const dependency = utils.checkHostgenDependency(hostPkg, subgenPkg);
  if(dependency.hasError) {
    const available = dependency.data.get('err').get('available');
    const required = dependency.data.get('err').get('required');

    generator.env.error(`Couldn't verify that host generator ${generator.hostFullName} satisfies the sub generators dependency.\nFound ${
      available}, required ${required}`);
  }
}


module.exports = {
  activateSubgen,
  cacheInstalledPackages,
  checkActivationState,
  deactivateSubgen,
  setSubgenDestPath,
  setSubgenSrcPath,
  injectDefaultConstructor,
  loadSubgenConfig,
  makeSubgenAware,
  populateHostgenPkg,
  populateSubgenPkg,
  scanForInstalledSubgens,
  validateCompatibility,
  validateHostName,
  validateSubgenName
};
