'use strict';

const generators                  = require('yeoman-generator');


class Generator extends generators.Base {

  constructor(...args) {
    super(...args);
  }

  initializing() {
    this.composeWith('subgenext:scan', { options: this.options, args: this.args });
  }

}

module.exports = Generator;
