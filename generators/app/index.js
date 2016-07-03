'use strict';

const generators                  = require('yeoman-generator');


class Generator extends generators.Base {

  constructor(...args) {
    super(...args);
    this.vargs = args[0];
    this.opts  = args[1];
  }

  initializing() {
    this.composeWith('subgenext:scan', { options: this.opts, args: this.vargs });
  }

}

module.exports = Generator;
