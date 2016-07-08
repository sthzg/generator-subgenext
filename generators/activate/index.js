'use strict';

const generators                  = require('yeoman-generator');
const tasks                       = require('../../utils/tasks');


class Generator extends generators.Base {

  constructor(...args) {
    super(...args);

    tasks.injectDefaultConstructor(this);
    tasks.makeSubgenAware(this);
  }


  get initializing() {
    return {
      loadSubgenConfig() {
        tasks.loadSubgenConfig(this)
      },
      validateHostName() {
        tasks.validateHostName(this);
      },
      validateSubgenName() {
        tasks.validateSubgenName(this);
      },
      cacheInstalledPackages() {
        tasks.cacheInstalledPackages(this);
      },
      populateHostgenPkg() {
        tasks.populateHostgenPkg(this);
      }
    };
  }


  get default() {
    return {
      scanForInstalledSubgens() {
        tasks.scanForInstalledSubgens(this);
      },
      checkActivationState() {
        tasks.checkActivationState(this);
      },
      populateSubgenPkg() {
        tasks.populateSubgenPkg(this);
      },
      validateCompatibility() {
        tasks.validateCompatibility(this);
      },
      setSubgenSrcPath() {
        tasks.setSubgenSrcPath(this)
      },
      setSubgenDestPath() {
        tasks.setSubgenDestPath(this)
      }
    };
  }


  get writing() {
    return {

      /**
       * Copies the subgen to the host generator's directory.
       */
      copySubgen() {
        this.fs.copy(this.subgenSrc, this.subgenDest);
      }

    }
  }

  get end() {
    return {
      output() {
        this.log.ok(`Activated ${this.subgenName}!`);
      }
    }
  }

}

module.exports = Generator;
