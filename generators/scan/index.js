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
      validateHostName                 () { tasks.validateHostName(this);                },
      cacheInstalledPackages           () { tasks.cacheInstalledPackages(this);          },
      validateHostgenExists            () { tasks.validateHostgenExists(this);           }
    };
  }


  get default() {
    return {
      scanForInstalledSubgens          () { tasks.scanForInstalledSubgens(this);         },
      validateCompatibility            () { tasks.validateCompatibility();               },
      checkActivationState             () { tasks.checkActivationState(this);            }
    };
  }


  get end() {
    return {
      output() {
        this.log(`Found ${this.availableExtgens.length} ${(this.availableExtgens.length === 1) ? 'sub generator' : 'sub generators'}`);

        this.availableExtgens.forEach((gen, idx) => {
          const dispActive = (gen.isActivated) ? '(activated)' : '(not activated)';
          this.log(`(${idx + 1}) ${gen.name}\t\t${dispActive}`);
        });
      }
    }

  }

}


module.exports = Generator;
