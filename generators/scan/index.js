'use strict';

var generators                    = require('yeoman-generator');
var tasks                         = require('../../utils/tasks');
var utils                         = require('../../utils/utils');


/**
 * Scan npm path for available sub generators and output availability and activation status.
 */
class Generator extends generators.Base {

  constructor(...args) {
    super(...args);

    tasks.injectDefaultConstructor(this);
  }

  initializing() {
    tasks.loadSubgenConfig(this);
    tasks.validateHostName(this);
    tasks.cacheInstalledPkgs(this);
    tasks.populateHostgenPkg(this);
  }

  defaultTasks() {
    tasks.scanForInstalledSubgens(this);
    tasks.checkActivationState(this);
  }

  end() {
    const hostName = this.hostPkg.name;
    const hostVersion = this.hostPkg.version;
    const table = utils.getScanResultTable(this);
    const tableHeader = utils.getScanResultTableHeader(hostName, hostVersion, table.length);

    this.log.ok(tableHeader);
    this.log(this.log.table(table));
  }
}


module.exports = Generator;
