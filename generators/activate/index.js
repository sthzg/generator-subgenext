'use strict';

const generators                  = require('yeoman-generator');
const tasks                       = require('../../utils/tasks');


/**
 * Activates an external subgenerator.
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
    tasks.validateCompatibility(this);
    tasks.setSubgenNamespace(this);
    tasks.setSubgenSrcPath(this);
    tasks.setSubgenDestPath(this);
  }

  writing() {
    tasks.activateSubgen(this);
  }

  end() {
    if (this.genData.activation.get('hasError')) {
      this.log.error(this.genData.activation.getIn(['data', 'err']));
    } else {
      this.log.ok(`Activated ${this.subgenName}!`);
    }
  }
}

module.exports = Generator;
