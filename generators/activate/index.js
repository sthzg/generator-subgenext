'use strict';

const generators                  = require('yeoman-generator');
const tasks                       = require('../../utils/tasks');
const utils                       = require('../../utils/utils');


module.exports = generators.Base.extend({

  constructor: function () {
    generators.Base.apply(this, arguments);
    tasks.injectDefaultConstructor(this);
    tasks.injectSubgenArg(this);
  },


  initializing: {
    validateHostName              : function() { tasks.validateHostName(this)(); },
    validateSubgenName            : function() { tasks.validateSubgenName(this)(); },
    cacheInstalledPackages        : function() { tasks.cacheInstalledPackages(this)(); },
    validateHostgenExists         : function() { tasks.validateHostgenExists(this)(); },
    validateSubgenExists          : function() { tasks.validateSubgenExists(this)(); }
  },


  default: {
    scanForInstalledSubgens       : function() { tasks.scanForInstalledSubgens(this)(); },
    validateCompatibility         : function() { tasks.validateCompatibility()(); },
    checkActivationState          : function() { tasks.checkActivationState(this)(); }
  }

});
