'use strict';

const fs                          = require('fs-extra');
const path                        = require('path');

const nodeModDir = path.join(__dirname, '../../node_modules');
const resourcesDir = path.join(__dirname, '../_resources');


function genPath(gen) {
  return path.join(__dirname, '../../generators', gen);
}

function invalidatePeerDependency(dir) {
  const packagePath = path.join(dir, '/node_modules/contrib-subgen-yoburger-bbq/package.json');
  var content = fs.readFileSync(packagePath).toString();
  content = content.replace(/"generator-yoburger": ">0.0.0"/g, '"generator-yoburger": ">9000.0.0"');
  fs.writeFileSync(packagePath, content);
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


const buildPkgJson = (name='', version='1.0.0') => { return {name, version} };


const mockedDirsForSearchPaths = {
  structure: {
    '/tmp/searchPath1': {
      'sp1dir1': {
        'generators': {
          'hello': {}
        },
        'package.json': JSON.stringify(buildPkgJson('sp1dir1', '1.0.0'))
      },
      'sp1dir2': {},
      'sp1dir3': {}
    },
    '/tmp/searchPath2': {
      'contrib-subgen-sp1dir-hello': {
        'package.json': JSON.stringify(buildPkgJson('hello'))
      },
      'contrib-subgen-sp1dir-bye': {
        'package.json': JSON.stringify(buildPkgJson('bye'))
      },
      'sp2dir3': {},
    },
    '/tmp/searchPath3': {}
  },
  roots: [
    '/tmp/searchPath1',
    '/tmp/searchPath2',
    '/tmp/searchPath3',
    '/tmp/searchPath1',  // on purpose to check for uniqueness
  ]
};


module.exports = {
  genPath,
  nodeModDir,
  resourcesDir,
  mockedDirsForSearchPaths,
  invalidatePeerDependency,
  moveDefaultFiles
};
