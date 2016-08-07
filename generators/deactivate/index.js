'use strict';

var existsSync                    = require('fs').existsSync;
const fs                          = require('fs');
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
      setSubgenNamespace() {
        tasks.setSubgenNamespace(this);
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
      deactivateSubgen() {
        tasks.deactivateSubgen(this);
      }
    }
  }

  get end() {
    return {
      output() {
        if (this.genData.deactivation.get('hasError')) {
          this.log.error(this.genData.deactivation.getIn(['data', 'err']));
        } else {
          this.log.ok(`Deactivated ${this.subgenName}!`);
        }
      }
    }
  }
}

module.exports = Generator;
