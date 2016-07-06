'use strict';

const fs                          = require('fs-extra');
const test                        = require('tape');
const path                        = require('path');
const assert                      = require('yeoman-assert');
const helpers                     = require('yeoman-test');


test('subgenext:app', function(t) {
  t.plan(1);
  
  helpers
    .run(path.join(__dirname, '../generators/app'))
    .on('error', function(gen) {
      t.pass('Scanning without host parameter throws error.');
    });
});

test('subgenext:scan --host yoburger', function(t) {
  t.plan(1);

  helpers
    .run(path.join(__dirname, '../generators/scan'))
    .inTmpDir(function (dir) {
      fs.copySync(path.join(__dirname, 'package.json'), path.join(dir, 'package.json'));
      fs.copySync(path.join(__dirname, '../node_modules/generator-yoburger'), path.join(dir, '/node_modules/generator-yoburger'));
      fs.copySync(path.join(__dirname, '../node_modules/contrib-subgen-yoburger-bbq'), path.join(dir, '/node_modules/contrib-subgen-yoburger-bbq'));
    })
    .withOptions({
      host: 'yoburger'
    })
    .on('error', function() {
      t.fail('Failed scanning the host generator');
    })
    .on('end', function() {
      t.pass('Found host generator');
    });
});

test('subgenext:activate bbq --host yoburger', function(t) {
  t.plan(2);

  helpers
    .run(path.join(__dirname, '../generators/activate'))
    .inTmpDir(function (dir) {
      fs.copySync(path.join(__dirname, 'package.json'), path.join(dir, 'package.json'));
      fs.copySync(path.join(__dirname, '../node_modules/generator-yoburger'), path.join(dir, '/node_modules/generator-yoburger'));
      fs.copySync(path.join(__dirname, '../node_modules/contrib-subgen-yoburger-bbq'), path.join(dir, '/node_modules/contrib-subgen-yoburger-bbq'));
    })
    .withArguments(['bbq'])
    .withOptions({
      host: 'yoburger'
    })
    .on('error', function() {
      t.fail('Failed activating the sub generator');
    })
    .on('end', function() {
      t.pass('Activated the sub generator');

      try {
        assert.file(['node_modules/generator-yoburger/generators/bbq/index.js']);
        t.pass('Copies sub generator files');
      }
      catch(e) {
        t.fail('Did not copy sub generator files');
      }
    });
});

test('subgenext:activate nonExistent --host yoburger', function(t) {
  t.plan(1);

  helpers
    .run(path.join(__dirname, '../generators/activate'))
    .inTmpDir(function (dir) {
      fs.copySync(path.join(__dirname, 'package.json'), path.join(dir, 'package.json'));
      fs.copySync(path.join(__dirname, '../node_modules/generator-yoburger'), path.join(dir, '/node_modules/generator-yoburger'));
      fs.copySync(path.join(__dirname, '../node_modules/contrib-subgen-yoburger-bbq'), path.join(dir, '/node_modules/contrib-subgen-yoburger-bbq'));
    })
    .withArguments(['nonExistent'])
    .withOptions({
      host: 'yoburger'
    })
    .on('error', function() {
      t.pass('Throws error on missing sub generator');
    })
    .on('end', function() {
      t.fail('Does not recognize missing sub generator');
    });
});

test('subgenext:deactivate bbq --host yoburger', function(t) {
  t.plan(1);

  helpers
    .run(path.join(__dirname, '../generators/deactivate'))
    .inTmpDir(function (dir) {
      fs.copySync(path.join(__dirname, 'package.json'), path.join(dir, 'package.json'));
      fs.copySync(path.join(__dirname, '../node_modules/generator-yoburger'), path.join(dir, '/node_modules/generator-yoburger'));
      fs.copySync(path.join(__dirname, '../node_modules/contrib-subgen-yoburger-bbq'), path.join(dir, '/node_modules/contrib-subgen-yoburger-bbq'));
    })
    .withArguments(['bbq'])
    .withOptions({
      host: 'yoburger'
    })
    .on('error', function() {
      t.fail('Failed deactivating the sub generator');
    })
    .on('end', function() {
      t.pass('Deactivated the sub generator');
    });
});

test('subgenext:deactivate nonExistent --host yoburger', function(t) {
  t.plan(1);

  helpers
    .run(path.join(__dirname, '../generators/deactivate'))
    .inTmpDir(function (dir) {
      fs.copySync(path.join(__dirname, 'package.json'), path.join(dir, 'package.json'));
      fs.copySync(path.join(__dirname, '../node_modules/generator-yoburger'), path.join(dir, '/node_modules/generator-yoburger'));
      fs.copySync(path.join(__dirname, '../node_modules/contrib-subgen-yoburger-bbq'), path.join(dir, '/node_modules/contrib-subgen-yoburger-bbq'));
    })
    .withArguments(['nonExistent'])
    .withOptions({
      host: 'yoburger'
    })
    .on('error', function() {
      t.pass('Throws error on missing sub generator');
    })
    .on('end', function() {
      t.fail('Does not recognize missing sub generator');
    });
});
