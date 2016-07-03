'use strict';

const generators                  = require('yeoman-generator');
const tasks                       = require('../../utils/tasks');
const utils                       = require('../../utils/utils');


module.exports = generators.Base.extend({

  constructor: function () {
    generators.Base.apply(this, arguments);
    tasks.injectDefaultConstructor(this);
  },


  initializing: {
    validateHost                  : function() { tasks.validateHost(this)(); },
    cacheInstalledPackages        : function() { tasks.cacheInstalledPackages(this)(); },
    validateHostgenExists         : function() { tasks.validateHostgenExists(this)(); }
  },


  default: {
    scan: tasks.scan,
    validateCompatibility         : function() { tasks.validateCompatibility()(); },
    checkActivationState          : function() { tasks.checkActivationState(this)(); }
  }

});
