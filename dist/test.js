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

  var d = new Date(2014, 0, 1, 10); /*
                                     *Dateify-js tests
                                     *@author jasmith79@gmail.com
                                     *@copyright Jared Adam Smith, 2016
                                     *Licensed under the MIT license. You should have received a copy with this software, otherwise see
                                     *https://opensource.org/licenses/MIT.
                                     *
                                     */

  var n = d.getTime();
  var nplus = n + 1000 * 60 * new Date().getTimezoneOffset();
  var iso = '2014-01-01T10:00:00';
  var isoz = '2014-01-01T15:00:00Z';
  var isotz = '2014-01-01T10:00:00-05:00';
  var meh = '2014/01/01 10:00:00';
  var jsstr = d.toString();
  var jsdstr = d.toDateString(); //year, month, and day only

  describe('dateify', function () {
    it('should handle datestrings in various formats', function () {
      expect(dateify.dateify(iso).getTime()).toBe(n);
      expect(dateify.dateify(isoz).getTime()).toBe(n); //coming through as 3pm local
      // expect(dateify.dateify(isotz).getTime()).toBe(n);
      // expect(dateify.dateify(meh).getTime()).toBe(n);
      // expect(dateify.dateify(jsstr).getTime()).toBe(n);
      // expect(dateify.dateify(jsdstr).getTime()).toBe(n - (1000 * 60 * 60 * 10));
      expect(function () {
        return dateify.dateify('24687965');
      }).toThrow();
    });
  });

  describe('deDateify', function () {
    it('should return a yyyy-mm-dd string for various dates', function () {
      expect(dateify.deDateify(d)).toBe('2014-01-01');
    });
  });

  describe('isLeapYear', function () {
    it('should accurately tell if a year is a leap year', function () {
      expect(function () {
        return dateify.isLeapYear(0);
      }).toThrow();
      expect(dateify.isLeapYear(4)).toBe(false);
      expect(dateify.isLeapYear(1900)).toBe(false);
      expect(dateify.isLeapYear(1600)).toBe(true);
      expect(dateify.isLeapYear(404)).toBe(true);
      expect(dateify.isLeapYear(634)).toBe(false);
      expect(dateify.isLeapYear(-30)).toBe(false); //actually 30 BC was a leap year, but fn -> false for < 0
    });
  });

  describe('toUTCDate', function () {
    // it('should handle dateify-able datestrings', function() {
    //   expect(dateify.toUTCDate(iso).getTime()).toBe(nplus);
    //   expect(dateify.toUTCDate(isoz).getTime()).toBe(nplus);
    //   expect(dateify.toUTCDate(isotz).getTime()).toBe(nplus);
    //   expect(dateify.toUTCDate(jsstr).getTime()).toBe(nplus);
    // });

    it('should handle date objects', function () {
      expect(dateify.toUTCDate(d).getTime()).toBe(nplus);
    });

    it('should not apply the offset multiple times', function () {
      expect(dateify.toUTCDate(dateify.toUTCDate(d)).getTime()).toBe(nplus);
    });
  });

  describe('toUTCDateString', function () {
    it('should return a ISO-formatted UTC string', function () {
      var str = dateify.toUTCDateString(d);
      expect(str).toBe('2014-01-01T15:00:00Z');
    });
  });
});
