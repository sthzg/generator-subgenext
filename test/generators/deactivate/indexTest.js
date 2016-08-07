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


describe('subgenext:deactivate bbq --host=yoburger', () => {

  describe('when invoked with deactivate subgen', function () {
    before(function (done) {
      helpers
        .run(tHelpers.genPath('deactivate'))
        .withGenerators([path.join(tHelpers.nodeModDir, 'generator-yoburger')])
        .inTmpDir(function (dir) {
          tHelpers.moveDefaultFiles(dir, false, false);
        })
        .withArguments(['bbq'])
        .withOptions({ host: 'yoburger' })
        .toPromise()
        .then(dir => { this.tmpDir = dir; done(); });
    });

    it('subgen is removed from hostgen\'s generators dir', function () {
      assert.noFile([path.join(this.tmpDir, 'node_modules/generator-yoburger/generators/bbq')]);
    });
  });

  describe('when invoked with non-existing subgen', function () {
    before(function (done) {
      const self = this;
      helpers
        .run(tHelpers.genPath('deactivate'))
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

});
