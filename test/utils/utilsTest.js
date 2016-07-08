'use strict';

const after                       = require('mocha').after;
const before                      = require('mocha').before;
const describe                    = require('mocha').describe;
const it                          = require('mocha').it;

const chai                        = require('chai').assert;
const fs                          = require('fs');
const mockfs                      = require('mock-fs');
const path                        = require('path');
const tHelpers                    = require('../_helpers');
const utils                       = require('../../utils/utils');


describe('getInstalledPkgPaths()', () => {
  describe('with mocked file system', function () {
    before(function() {
      mockfs(tHelpers.mockedDirsForSearchPaths.structure);
    });

    it('returns expected number of directories from the fs', function () {
      const res = utils.getInstalledPkgPaths(tHelpers.mockedDirsForSearchPaths.roots);
      chai.isOk(res.length === 6, 'Expected number of dirs to be 6')
    });

    after(function() {
      mockfs.restore();
    });
  });
});


describe('populatePkgStoreFromPaths()', () => {
  describe('with mocked file system', function () {
    before(function() {
      mockfs(tHelpers.mockedDirsForSearchPaths.structure);
      this.pkgPaths = utils.getInstalledPkgPaths(tHelpers.mockedDirsForSearchPaths.roots);
    });

    it('returns expected number of directories from the fs', function () {
      const res = utils.populatePkgStoreFromPaths(this.pkgPaths);
      chai.isOk(res.length === 6, 'Expected number of entries to be 6');
      chai.isOk(
        res.every(x => typeof x.path === 'string' && x.path !== ''),
        'Expected all items to have a non-empty path prop'
      );
    });

    after(function() {
      mockfs.restore();
    });
  });
});


describe('getPkgInfo()', () => {
  describe('with mocked file system', function () {
    before(function () {
      mockfs(tHelpers.mockedDirsForSearchPaths.structure);
      const pkgPaths = utils.getInstalledPkgPaths(tHelpers.mockedDirsForSearchPaths.roots);
      this.store = utils.populatePkgStoreFromPaths(pkgPaths);
    });

    it('returns data from package.json', function () {
      const pkgQ = utils.getPkgInfo('sp1dir1', this.store);
      chai.equal(pkgQ.hasError, false);
      chai.equal(pkgQ.data.getIn(['pkg', 'version']), '1.0.0');
      chai.equal(pkgQ.data.getIn(['pkg', 'name']), 'sp1dir1');
      chai.equal(pkgQ.data.getIn(['pkg', 'path']), '/tmp/searchPath1/sp1dir1');
    });

    it('returns data for a matching substring with exact=fasle', function () {
      const pkgQ = utils.getPkgInfo('sp1', this.store, false);
      chai.equal(pkgQ.data.getIn(['pkg', 'name']), 'sp1dir1');
    });

    it('returns an error if pkg can\'t be found', function () {
      const pkgQ = utils.getPkgInfo('xyz', this.store);
      chai.equal(pkgQ.hasError, true);
    });

    after(function () {
      mockfs.restore();
    });
  });
});


describe('buildPrefixRegexps()', () => {
  it('returns expected regexps', function () {
    let regexps = utils.buildPrefixRegexps(['contrib-subgen-', 'subgen-'], 'foobar');
    chai.equal(regexps.length, 2);
    chai.equal(regexps[0], '/^contrib-subgen-foobar-/');
    chai.equal(regexps[1], '/^subgen-foobar-/');
  });

  it('returns expected basename for subgen-foobar-helloworld', function () {
    let bn = utils.getSubgenBaseName('foobar', ['contrib-subgen-', 'subgen-'], 'subgen-foobar-helloworld');
    chai.equal(bn, 'helloworld');
  });
});


describe('getSubgenBaseName()', () => {
  it('returns expected basename for contrib-subgen-foobar-helloworld', function () {
    let bn = utils.getSubgenBaseName('foobar', ['contrib-subgen-', 'subgen-'], 'contrib-subgen-foobar-helloworld');
    chai.equal(bn, 'helloworld');
  });

  it('returns expected basename for subgen-foobar-helloworld', function () {
    let bn = utils.getSubgenBaseName('foobar', ['contrib-subgen-', 'subgen-'], 'subgen-foobar-helloworld');
    chai.equal(bn, 'helloworld');
  });
});


describe('checkActivationState()', () => {
  describe('with mocked file system', function () {
    before(function () {
      mockfs(tHelpers.mockedDirsForSearchPaths.structure);
      const pkgPaths = utils.getInstalledPkgPaths(tHelpers.mockedDirsForSearchPaths.roots);
      this.store = utils.populatePkgStoreFromPaths(pkgPaths);
    });

    it('reports activated subgen', function () {
      const hostPkgQ = utils.getPkgInfo('sp1dir1', this.store);
      const resQ = utils.checkActivationState(hostPkgQ.data.get('pkg'), 'hello');
      chai.ok(resQ.data.get('result'));
    });

    it('reports deactivated', function () {
      const hostPkgQ = utils.getPkgInfo('sp1dir1', this.store);
      const resQ = utils.checkActivationState(hostPkgQ.data.get('pkg'), 'nonExistent');
      chai.notOk(resQ.data.get('result'));
    });

    after(function () {
      mockfs.restore();
    });
  });
});


describe('checkPkgExists()', () => {
  describe('with mocked file system', function () {
    before(function () {
      this.prefixes = require('../../utils/constants').SUBGEN_PREFIX_PATTERNS;
      mockfs(tHelpers.mockedDirsForSearchPaths.structure);
      const pkgPaths = utils.getInstalledPkgPaths(tHelpers.mockedDirsForSearchPaths.roots);
      this.store = utils.populatePkgStoreFromPaths(pkgPaths);
    });

    it('finds packages with exact name', function () {
      const subgens = utils.findExternalSubgens(this.prefixes, 'sp1dir', this.store).data.get('results');
      const resQ = utils.checkPkgExists('contrib-subgen-sp1dir-hello', subgens);

      chai.equal(resQ, true);
    });

    it('finds packages with similar name', function () {
      const subgens = utils.findExternalSubgens(this.prefixes, 'sp1dir', this.store).data.get('results');
      const resQ = utils.checkPkgExists('hello', subgens, false);

      chai.equal(resQ, true);
    });

    after(function () {
      mockfs.restore();
    });
  });
})


describe('findExternalSubgens()', () => {
  describe('with mocked file system', function () {
    before(function () {
      this.prefixes = require('../../utils/constants').SUBGEN_PREFIX_PATTERNS;
      mockfs(tHelpers.mockedDirsForSearchPaths.structure);
      const pkgPaths = utils.getInstalledPkgPaths(tHelpers.mockedDirsForSearchPaths.roots);
      this.store = utils.populatePkgStoreFromPaths(pkgPaths);
    });

    it('finds packages that qualify as external subgens', function () {
      const resQ = utils.findExternalSubgens(this.prefixes, 'sp1dir', this.store);
      chai.equal(resQ.data.get('results').size, 2);
    });

    after(function () {
      mockfs.restore();
    });
  });
});

/*
describe('checkHostgenDependency()', () => {
  describe('with mocked file system', function () {
    before(function () {
      this.prefixes = require('../../utils/constants').SUBGEN_PREFIX_PATTERNS;
      mockfs(tHelpers.mockedDirsForSearchPaths.structure);
      const pkgPaths = utils.getInstalledPkgPaths(tHelpers.mockedDirsForSearchPaths.roots);
      this.store = utils.populatePkgStoreFromPaths(pkgPaths);
    });

    it('finds packages that qualify as external subgens', function () {
      const resQ = utils.findExternalSubgens(this.prefixes, 'sp1dir', this.store);
      chai.equal(resQ.data.get('results').size, 2);
    });

    after(function () {
      mockfs.restore();
    });
  });
});
*/


describe('sortCharArrByLength()', () => {
  const arr = ['foo', 'longest', 's', 'bar'];
  it('sorts descending', function () {
    const resQ = utils.sortCharArrByLength(arr);
    chai.equal(resQ[0], 'longest');
    chai.equal(resQ[3], 's');
  });

  it('sorts ascending', function () {
    const resQ = utils.sortCharArrByLength(arr, false);
    chai.equal(resQ[0], 's');
    chai.equal(resQ[3], 'longest');
  });
});


describe('getScanResultTableHeader()', () => {
  it('formats properly for single subgen', function () {
    const resQ = utils.getScanResultTableHeader('some-name', '1.2.3', 1);
    chai.equal(resQ, 'Found 1 sub generator for some-name (1.2.3)');
  });

  it('formats properly for multiple subgens', function () {
    const resQ = utils.getScanResultTableHeader('some-name', '1.2.3', 5);
    chai.equal(resQ, 'Found 5 sub generators for some-name (1.2.3)');
  });
});
