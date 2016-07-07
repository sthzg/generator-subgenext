'use strict';

const fs                          = require('fs-extra');
const path                        = require('path');

const nodeModDir = path.join(__dirname, '../../node_modules');
const resourcesDir = path.join(__dirname, '../_resources');


function genPath(gen) {
  return path.join(__dirname, '../../generators', gen);
}


function moveDefaultFiles(dir, includeSubgenextJson = false, includeExtgen = false) {
  fs.copySync(
    path.join(resourcesDir, '.package.json'),
    path.join(dir, 'package.json')
  );
  fs.copySync(
    path.join(nodeModDir, 'generator-yoburger'),
    path.join(dir, '/node_modules/generator-yoburger')
  );
  fs.copySync(
    path.join(nodeModDir, 'contrib-subgen-yoburger-bbq'),
    path.join(dir, '/node_modules/contrib-subgen-yoburger-bbq')
  );

  if (includeSubgenextJson) {
    fs.copySync(
      path.join(resourcesDir, '.subgenext.json'),
      path.join(dir, 'subgenext.json')
    );
  }

  if (includeExtgen) {
    fs.copySync(
      path.join(nodeModDir, 'contrib-subgen-yoburger-bbq/generators/bbq'),
      path.join(dir, '/node_modules/generator-yoburger/generators/bbq')
    );
  }
}


module.exports = {
  genPath,
  nodeModDir,
  resourcesDir,
  moveDefaultFiles
};
