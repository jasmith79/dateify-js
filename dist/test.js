(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['./dateify.js'], factory);
  } else if (typeof exports !== "undefined") {
    factory(require('./dateify.js'));
  } else {
    var mod = {
      exports: {}
    };
    factory(global.dateify);
    global.test = mod.exports;
  }
})(this, function (_dateify) {
  'use strict';

  var dateify = _interopRequireWildcard(_dateify);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }

  describe('dateify', function () {}); /*
                                        *Dateify-js tests
                                        *@author jasmith79@gmail.com
                                        *@copyright Jared Adam Smith, 2016
                                        *Licensed under the MIT license. You should have received a copy with this software, otherwise see
                                        *https://opensource.org/licenses/MIT.
                                        *
                                        */

  describe('deDateify', function () {});

  describe('isLeapYear', function () {});

  describe('toUTCDate', function () {});

  describe('toUTCDateString', function () {});
});
