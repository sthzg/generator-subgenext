/**
 * @module records
 *
 * Contains records used throughout the application.
 */

'use strict';

const Immutable                     = require('immutable');


/**
 * @private Base record used to build more concrete message classes like {@link SuccessMsg} and {@link ErrorMsg}.
 */
class Msg extends Immutable.Record({ hasError: false, data: {} }) {
  constructor(data) {
    data.data = Immutable.fromJS(data.data, function (key, value) {
      var isIndexed = Immutable.Iterable.isIndexed(value);
      return isIndexed ? value.toList() : value.toOrderedMap();
    });

    super(data);
  }
}


/**
 * Record to pass a payload for success messages around.
 *
 * @param {Object} data
 */
const SuccessMsg = (data) => new Msg({
  data: data
});


/**
 * Record to pass a payload for error messages around.
 *
 * @param {Object} err
 */
const ErrorMsg = (err) => new Msg({
  hasError: true,
  data: {
    err: err
  }
});


const pkgDefaults = {
  authorCfg: new Immutable.Map(),
  isHost: true,
  basename: null,
  name: null,
  version: null,  // only for host for semver check
  path: null,
  pjson: {},
  isActivated: false, // Only for sub
  peerDependencies:  {},
  data: {} //only for sub host dep
};


const Pkg = Immutable.Record(pkgDefaults);


/**
 * Record to store host generator's package data.
 *
 * @param {Object} pkg
 */
const HostGenPkg = (pkg={}) => Pkg(Object.assign({}, pkgDefaults, pkg, {
  isHost: true
}));


/**
 * Record to store subgen's package data.
 *
 * @param {Object} pkg
 */
const SubGenPkg = (pkg={}) => Pkg(Object.assign({}, pkgDefaults, pkg, {
  isHost: false
}));


module.exports = {
  SuccessMsg,
  ErrorMsg,
  HostGenPkg,
  SubGenPkg
};
