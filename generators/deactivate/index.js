'use strict';

const generators                  = require('yeoman-generator');
const tasks                       = require('../../utils/tasks');


/**
 * Deactivates an external subgenerator.
 */
class Generator extends generators.Base {

  constructor(...args) {
    super(...args);

    tasks.injectDefaultConstructor(this);
    tasks.makeSubgenAware(this);
  }

  initializing() {
    tasks.loadSubgenConfig(this);
    tasks.validateHostName(this);
    tasks.validateSubgenName(this);
    tasks.cacheInstalledPkgs(this);
    tasks.populateHostgenPkg(this);
  }

  defaultTasks() {
    tasks.scanForInstalledSubgens(this);
    tasks.checkActivationState(this);
    tasks.populateSubgenPkg(this);
    tasks.setSubgenNamespace(this);
    tasks.setSubgenSrcPath(this);
    tasks.setSubgenDestPath(this);
  }

  writing() {
    tasks.deactivateSubgen(this);
  }

  end() {
    if (this.genData.deactivation.get('hasError')) {
      this.log.error(this.genData.deactivation.getIn(['data', 'err']));
    } else {
      this.log.ok(`Deactivated ${this.subgenName}!`);
    }
  }
}

module.exports = Generator;
