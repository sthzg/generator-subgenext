'use strict';

var generators                    = require('yeoman-generator');
var tasks                         = require('../../utils/tasks');
var utils                         = require('../../utils/utils');



class Generator extends generators.Base {

  constructor(...args) {
    super(...args);

    tasks.injectDefaultConstructor(this);
  }


  get initializing() {
    return {
      loadSubgenConfig() {
        tasks.loadSubgenConfig(this)
      },
      validateHostName() {
        tasks.validateHostName(this);
      },
      cacheInstalledPackages() {
        tasks.cacheInstalledPackages(this);
      },
      validateHostgenExists() {
        tasks.validateHostgenExists(this);
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
      validateCompatibility() {
        tasks.validateCompatibility();
      },
      checkActivationState() {
        tasks.checkActivationState(this);
      }
    };
  }


  get end() {
    return {
      output() {
        this.log.ok(`Found ${this.availableExtgens.length} ${(this.availableExtgens.length === 1) ? 'sub generator' : 'sub generators'}`);
        this.log(this.log.table(this.availableExtgens.map((gen, idx) => [
          '',
          idx + 1,
          gen.name,
          (gen.isActivated) ? '(activated)' : '(not activated)'
        ])));
      }
    }

  }

}


module.exports = Generator;
