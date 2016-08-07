'use strict';

const before                      = require('mocha').before;
const describe                    = require('mocha').describe;
const it                          = require('mocha').it;
const assert                      = require('yeoman-assert');
const chai                        = require('chai').assert;
const fs                          = require('fs-extra');
const helpers                     = require('yeoman-test');
const path                        = require('path');
const tHelpers                    = require('../../_helpers');


describe('subgenext:activate bbq --host=yoburger', () => {

  describe('when invoked with existing subgen', function () {
    before(function (done) {
      helpers
        .run(tHelpers.genPath('activate'))
        .withGenerators([path.join(tHelpers.nodeModDir, 'generator-yoburger')])
        .inTmpDir(function (dir) {
          tHelpers.moveDefaultFiles(dir);
        })
        .withArguments(['bbq'])
        .withOptions({ host: 'yoburger' })
        .toPromise()
        .then(dir => { this.tmpDir = dir; done(); });
    });

    it('copies subgen files', function () {
      assert.file([path.join(this.tmpDir, 'node_modules/generator-yoburger/generators/bbq/index.js')]);
    });
  });

  describe('when invoked with non-existing subgen', function () {
    before(function (done) {
      const self = this;
      helpers
        .run(tHelpers.genPath('activate'))
        .withGenerators([path.join(tHelpers.nodeModDir, 'generator-yoburger')])
        .inTmpDir(function (dir) { tHelpers.moveDefaultFiles(dir); })
        .withArguments(['nonExistent'])
        .withOptions({ host: 'yoburger' })
        .on('error', function(err) { self.generr = err; done() });
    });

    it('notifies the user w/ an error', function () {
      chai.equal(
        this.generr.message,
        `Couldn't verify that subgen nonExistent is installed.`,
        `Doesn't notify user w/ expected error output`
      );
    });
  });

  describe('when invoked with unresolved subgen dependency', function () {
    before(function (done) {
      const self = this;
      helpers
        .run(tHelpers.genPath('activate'))
        .withGenerators([path.join(tHelpers.nodeModDir, 'generator-yoburger')])
        .inTmpDir(function (dir) {
          tHelpers.moveDefaultFiles(dir, false);
          tHelpers.invalidatePeerDependency(dir);
        })
        .withArguments(['bbq'])
        .withOptions({ host: 'yoburger' })
        .on('error', function(err) { self.generr = err; done() });
    });

    it('notifies the user w/ an error', function () {
      chai.equal(
        this.generr.message,
        'Couldn\'t verify that host generator generator-yoburger satisfies the sub generators dependency.\nFound 0.0.3, required >9000.0.0'
      );
    });
  });

});
