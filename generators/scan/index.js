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
      }
    };
  }


  get end() {
    return {
      output() {
        const hostName = this.hostPkg.name;
        const hostVersion = this.hostPkg.version;
        const table = utils.getScanResultTable(this);
        const tableHeader = utils.getScanResultTableHeader(hostName, hostVersion, table.length);

        this.log.ok(tableHeader);
        this.log(this.log.table(table));
      }
    }

  }

}


module.exports = Generator;
