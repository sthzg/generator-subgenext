'use strict';

const constants                   = require('../../utils/constants');

var generators                    = require('yeoman-generator');
var utils                         = require('../../utils/utils');


module.exports = generators.Base.extend({

  constructor: function () {
    generators.Base.apply(this, arguments);

    // Mute unresolved function or method warnings
    this.option  = this.option  || null;
    this.options = this.options || null;
    this.env     = this.env     || null;
    this.log     = this.log     || null;

    /**
     * Map of available generators.
     * @type {Array}
     */
    this.available = [];

    /**
     * Basename of the host generator.
     * @type String
     */
    this.hostBaseName = null;

    /**
     * Fully qualified package name of the host generator.
     * @type {null}
     */
    this.hostFullName = null;

    /**
     * Json representation of all installed packages in depth=0
     * We cache this value in a variable since invoking the shell command is expensive and slow.
     *
     * @type {null}
     */
    this.pkgList = null;

    this.option('host', {
      desc     : 'Name of the host generator',
      type     : 'String',
      required : true
    });

  },


  initializing: {

    /**
     * Validates input for --host option.
     */
    validateHost: function() {

      if (typeof this.options.host === 'undefined') {
        this.env.error(`Please provide the name of the host generator by appending --host=<generator-name>`);
      }

      this.hostBaseName = this.options.host;
      this.hostFullName = 'generator-' + this.options.host;
    },


    /**
     * Caches installed npm packages in class variable.
     */
    cacheInstalledPackages: function() {
      const pkgQ = utils.getInstalledPackages();

      if (pkgQ.hasError) {
        this.env.error(`Retrieving a list of installed packages failed. Error: ${pkgQ.error}`);
      }

      this.pkgList = pkgQ.results;
    },


    /**
     * Validates that the required host generator exists in the installed packages.
     */
    validateHostgenExists: function() {
      if (!utils.checkPkgExists(this.hostFullName, this.pkgList.dependencies)) {
        this.env.error(`Couldn't verify that host generator ${this.hostFullName} is installed.`);
      }
    }
  },


  default: {

    /**
     * Scans package for installed subgens.
     */
    scan: function() {
      const extgens = utils.findExternalSubgens(constants.subgenPrefixPatterns, this.hostBaseName, this.pkgList.dependencies);

      if (extgens.hasError) {
        this.env.error(`The npm list command threw an error and we can't proceed. :( Error: ${extgens.error}`);
      }

      this.available = extgens.results;
    },


    /**
     * Adds information whether found subgens are declared to be compatible with the hostgen version.
     */
    validateCompatibility: function() {
      // TODO validate compatibility between subgen and hostgen.
    },


    /**
     * Adds activation state information to the list of available external subgens.
     */
    checkActivationState: function() {
      this.available.forEach(subgen => {
        const check = utils.checkActivationState(this.hostFullName, subgen.basename, this.pkgList.dependencies);

        if (check.hasError) {
          this.env.error(`Checking the activation state for ${subgen.basename} failed. Error: ${check.error}`);
        }

        subgen.isActivated = utils.checkActivationState(this.hostFullName, subgen.basename).result;
      });
    }

  },


  end: {

    /**
     * Prints results of the scan command to the screen.
     */
    output: function() {
      this.log(`Found ${this.available.length} ${(this.available.length === 1) ? 'sub generator' : 'sub generators'}`);

      this.available.forEach((gen, idx) => {
        const dispActive = (gen.isActivated) ? '(activated)' : '(not activated)';
        this.log(`(${idx + 1}) ${gen.name}\t\t${dispActive}`);
      });
    }

  }

});
