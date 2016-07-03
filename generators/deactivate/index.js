'use strict';

const generators                  = require('yeoman-generator');
const rimraf                      = require('rimraf');
const tasks                       = require('../../utils/tasks');
const utils                       = require('../../utils/utils');


class Generator extends generators.Base {

  constructor(...args) {
    super(...args);

    tasks.injectDefaultConstructor(this);
    tasks.makeSubgenAware(this);
  }


  get initializing() {
    return {
      validateHostName                 () { tasks.validateHostName(this);                },
      validateSubgenName               () { tasks.validateSubgenName(this);              },
      cacheInstalledPackages           () { tasks.cacheInstalledPackages(this);          },
      validateHostgenExists            () { tasks.validateHostgenExists(this);           },
      populateHostgenPkg               () { tasks.populateHostgenPkg(this);              }
    };
  }


  get default() {

    return {
      scanForInstalledSubgens          () { tasks.scanForInstalledSubgens(this);         },
      validateCompatibility            () { tasks.validateCompatibility();               },
      checkActivationState             () { tasks.checkActivationState(this);            },
      validateSubgenExists             () { tasks.validateSubgenExists(this);            },
      getSubgenPkg                     () { tasks.getSubgenPkg(this)                     },
      getSubgenSrcPath                 () { tasks.getSubgenSrcPath(this)                 },
      getSubgenDestPath                () { tasks.getSubgenDestPath(this)                }
    };
  }


  get writing() {
    return {

      /**
       * Removes the subgen from the hostgen directory.
       */
      deleteSubgen() {
        rimraf.sync(this.subgenDest);
      }

    }
  }

}

module.exports = Generator;
