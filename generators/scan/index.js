'use strict';

var generators                    = require('yeoman-generator');
var tasks                         = require('../../utils/tasks');
var utils                         = require('../../utils/utils');


module.exports = generators.Base.extend({

  constructor: function () {
    generators.Base.apply(this, arguments);
    tasks.injectDefaultConstructor(this);
  },


  initializing: {
    validateHostName              : function() { tasks.validateHostName(this)(); },
    cacheInstalledPackages        : function() { tasks.cacheInstalledPackages(this)(); },
    validateHostgenExists         : function() { tasks.validateHostgenExists(this)(); }
  },


  default: {
    scanForInstalledSubgens       : function() { tasks.scanForInstalledSubgens(this)(); },
    validateCompatibility         : function() { tasks.validateCompatibility()(); },
    checkActivationState          : function() { tasks.checkActivationState(this)(); }
  },


  end: {

    /**
     * Prints results of the scan command to the screen.
     */
    output: function() {
      this.log(`Found ${this.availableExtgens.length} ${(this.availableExtgens.length === 1) ? 'sub generator' : 'sub generators'}`);

      this.availableExtgens.forEach((gen, idx) => {
        const dispActive = (gen.isActivated) ? '(activated)' : '(not activated)';
        this.log(`(${idx + 1}) ${gen.name}\t\t${dispActive}`);
      });
    }

  }

});
