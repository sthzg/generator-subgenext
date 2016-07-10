'use strict';

const before                      = require('mocha').before;
const describe                    = require('mocha').describe;
const it                          = require('mocha').it;
const chai                        = require('chai').assert;
const helpers                     = require('yeoman-test');
const path                        = require('path');
const tHelpers                    = require('../../_helpers');


describe('subgenext:scan', () => {

  describe('when invoked without a host', function () {
    before(function (done) {
      helpers
        .run(tHelpers.genPath('scan'))
        .on('error', (err) => { this.generr = err; done() });
    });

    it('fails with an error that --host is not set', function () {
      chai.isOk(
        this.generr.message.indexOf(`Please provide the name of the host generator by appending --host=<generator-name>`) !== -1,
        `expected error message not contained in: ${this.generr.message}`
      );
    });
  });

  describe('when invoked with --host yoburger', function() {
    before(function (done) {
      const self = this;
      helpers
        .run(tHelpers.genPath('scan'))
        .withGenerators([path.join(tHelpers.nodeModDir, 'generator-yoburger')])
        .inTmpDir(function (dir) { tHelpers.moveDefaultFiles(dir); })
        .withOptions({ host: 'yoburger' })
        .on('end', function() { self.generator = this.generator; done() });
    });

    it('finds bbq subgen as available extgen', function () {
      chai(this.generator.availableExtgens.some(x => x.get('basename') === 'bbq'), 'No extgen w/ name bbq found');
    });

    it('reports bbq subgen to be not activated', function () {
      chai(this.generator.availableExtgens.every(x => x.get('isActivated') === false));
    });
  });


  describe('when invoked with --host invalid', function() {
    before(function (done) {
      const self = this;
      helpers
        .run(tHelpers.genPath('scan'))
        .withGenerators([path.join(tHelpers.nodeModDir, 'generator-yoburger')])
        .inTmpDir(function (dir) { tHelpers.moveDefaultFiles(dir); })
        .withOptions({ host: 'invalid' })
        .on('error', function(err) { self.generr = err; done() });
    });

    it('notifies the user w/ an error', function () {
      chai.equal(
        this.generr.message,
        'Couldn\'t verify that host generator generator-invalid is installed.'
      );
    });
  });


  describe('when invoked with --host yoburger', function() {
    before(function (done) {
      const self = this;
      helpers
        .run(tHelpers.genPath('scan'))
        .withGenerators([path.join(tHelpers.nodeModDir, 'generator-yoburger')])
        .inTmpDir(function (dir) { tHelpers.moveDefaultFiles(dir); })
        .withOptions({ host: 'yoburger' })
        .on('end', function() { self.generator = this.generator; done() });
    });

    it('finds bbq subgen has host dependency satisfied', function () {
      const utils = require('../../../utils/utils');
      const resQ = utils.getScanResultTable(this.generator);
      const result = resQ[0][4];
      chai.equal(result, 'Host dependency satisfied: >0.0.0')
    });

    it('finds bbq subgen has host dependency not satisfied', function () {
      const utils = require('../../../utils/utils');
      this.generator.availableExtgens = this.generator.availableExtgens.map((gen) => {
        return gen.setIn(['peerDependencies', 'generator-yoburger'], '>9000.0.0');
      });

      const resQ = utils.getScanResultTable(this.generator);
      chai.equal(resQ[0][4], 'Host dependency failed: >9000.0.0');
    });
  });

  describe('when having extgens inside node_modules', function() {
    before(function (done) {
      const self = this;
      helpers
        .run(tHelpers.genPath('scan'))
        .withGenerators([path.join(tHelpers.nodeModDir, 'generator-yoburger')])
        .inTmpDir(function (dir) { tHelpers.moveDefaultFiles(dir, false, true); })
        .withOptions({ host: 'yoburger' })
        .on('end', function() { self.generator = this.generator; done() });
    });

    it('reports bbq subgen to be activated', function () {
      chai(this.generator.availableExtgens.some(x => x.get('isActivated') === true));
    });
  });

  describe('when invoked wo/ --host and defaultHost is set in config', function() {
    before(function (done) {
      const self = this;
      helpers
        .run(tHelpers.genPath('scan'))
        .withGenerators([path.join(tHelpers.nodeModDir, 'generator-yoburger')])
        .inTmpDir(function (dir) { tHelpers.moveDefaultFiles(dir, true); })
        .on('error', function(err) { self.generator = this.generator ; self.generr = err; done() });
    });

    it('falls back to defaultHost set in config', function () {
      chai.isOk(this.generator.hostBaseName, 'wombat');
    });
  });

  describe('when invoked w/ --host and defaultHost is set in config', function() {
    before(function (done) {
      const self = this;
      helpers
        .run(tHelpers.genPath('scan'))
        .withGenerators([path.join(tHelpers.nodeModDir, 'generator-yoburger')])
        .inTmpDir(function (dir) { tHelpers.moveDefaultFiles(dir, true); })
        .withOptions({ host: 'foobar' })
        .on('error', function(err) { self.generator = this.generator ; self.generr = err; done() });
    });

    it('prioritizes the --host value passed the the CLI over defaultHost', function () {
      chai.isOk(this.generator.hostBaseName, 'foobar');
    });
  });

});
