'use strict';

const generators                  = require('yeoman-generator');
const tasks                       = require('../../utils/tasks');
const utils                       = require('../../utils/utils');


class Generator extends generators.Base {

  constructor(...args) {
    super(...args);
    
    tasks.injectDefaultConstructor(this);
    tasks.injectSubgenArg(this);
  }

  get initializing() {
    return {
      validateHostName                 () { tasks.validateHostName(this);                },
      validateSubgenName               () { tasks.validateSubgenName(this);              },
      cacheInstalledPackages           () { tasks.cacheInstalledPackages(this);          },
      validateHostgenExists            () { tasks.validateHostgenExists(this);           },
      validateSubgenExists             () { tasks.validateSubgenExists(this);            }
    };
  }

  get default() {
    return {
      scanForInstalledSubgens          () { tasks.scanForInstalledSubgens(this);         },
      validateCompatibility            () { tasks.validateCompatibility();               },
      checkActivationState             () { tasks.checkActivationState(this);            }
    };
  }
}

module.exports = Generator;
