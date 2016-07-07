/**
 * @module records
 *
 * Contains records used throughout the application.
 */

'use strict';

const immutable                     = require('immutable');


class Message extends immutable.Record({ hasError: false, data: {} }) {
  constructor(data) {
    data.data = immutable.fromJS(data.data, function (key, value) {
      var isIndexed = immutable.Iterable.isIndexed(value);
      return isIndexed ? value.toList() : value.toOrderedMap();
    });

    super(data);
  }
}

const SuccessMsg = (data) => new Message({
  data: data
});

const ErrorMsg = (err) => new Message({
  hasError: true,
  data: {
    err: err
  }
});

const pkgDefaults = {
  isHost: true,
  basename: null,
  name: null,
  version: null,  // only for host for semver check
  path: null,
  pjson: {},
  isActivated: false, // Only for sub
  data: {} //only for sub host dep
};

const Package = immutable.Record(pkgDefaults);
const HostGenPkg = (pkg={}) => Package(Object.assign({}, pkgDefaults, pkg, { isHost: true }));
const SubGenPkg = (pkg={}) => Package(Object.assign({}, pkgDefaults, pkg, { isHost: false }));

module.exports = {
  SuccessMsg,
  ErrorMsg,
  HostGenPkg,
  SubGenPkg
};
