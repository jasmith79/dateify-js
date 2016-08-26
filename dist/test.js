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

  var _slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  var HTML = 'undefined' !== typeof HTMLElement;
  var d = new Date(2014, 0, 1, 10);
  var isotz = '2014-01-01T10:00:00-05:00';

  describe('dateify', function () {
    it('should handle datestrings in various formats', function () {
      expect(new Date('Fri Aug 26 2016 11:06:52 GMT+0400').toString()).toBe(dateify.dateify('2016-08-26T11:06:52+04:00').toString());
      expect(new Date('Fri Aug 26 2016 11:06:52 GMT-0600').toString()).toBe(dateify.dateify('2016-08-26T11:06:52-06:00').toString());
      expect(new Date('Fri Aug 26 2016 11:06:52 GMT+0000').toString()).toBe(dateify.dateify('2016-08-26T11:06:52+00:00').toString());
      expect(new Date('Fri Aug 26 2016 11:06:52 GMT-0000').toString()).toBe(dateify.dateify('2016-08-26T11:06:52-00:00').toString());
      expect(new Date('Fri Aug 26 2016 11:06:52 GMT+0000').toString()).toBe(dateify.dateify('2016-08-26T11:06:52Z').toString());

      // if timezone is omitted, string is assumed to refer to the JS environment's
      // local time
      expect(new Date('Wed Jan 01 2014 10:00:00 GMT-0500 (EST)').toString()).toBe(dateify.dateify('2014/01/01 10:00:00').toString());
      expect(new Date('Fri Jan 01 1937 10:00:00 GMT-0500 (EST)').toString()).toBe(dateify.dateify('1/1/37 10:00:00').toString());

      // it should parse the browser's datestrings same as the browser does:
      var test1 = new Date();
      expect(dateify.dateify(test1.toString()).toString()).toBe(test1.toString());

      // it should handle partials
      expect(dateify.dateify('2014/01/01').toString()).toBe('Wed Jan 01 2014 00:00:00 GMT-0500 (EST)');
    });

    it('should throw on input with multiple tz designations', function () {
      expect(function () {
        return dateify.dateify('2016-08-26T11:06:52Z-00:00');
      }).toThrow();
      expect(function () {
        return dateify.dateify('2016-08-26T11:06:52-00:00Z');
      }).toThrow();
    });

    it('should return invalid date on bad string input', function () {
      expect(dateify.dateify('').toString()).toBe('Invalid Date');
    });

    it('should return dates as-is', function () {
      var test1 = new Date('Fri Jan 01 1937 10:00:00 GMT-0500 (EST)');
      var test2 = new Date('');

      var res1 = dateify.dateify(test1);
      var res2 = dateify.dateify(test2);
      expect(res1.toString()).toBe(test1.toString());
      expect(res2.toString()).toBe(test2.toString());
    });
  });

  describe('deDateify', function () {
    console.log(Object.prototype.toString.call(d));
    it('should return an ISO-formatted datestring with timezone', function () {
      expect(dateify.deDateify(d)).toBe(isotz);
    });

    it('should be the inverse operation of dateify', function () {
      expect(dateify.deDateify(dateify.dateify(isotz))).toBe(isotz);
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
      //actually 30 BC was a leap year, but fn -> false for < 0
      expect(dateify.isLeapYear(-30)).toBe(false);
    });
  });

  describe('toUTCDateString', function () {
    it('should return a ISO-formatted UTC string', function () {
      var str = dateify.toUTCDateString(d);
      expect(str).toBe('2014-01-01T15:00:00Z');
    });
  });

  describe('order', function () {
    var arr = [new Date(2014, 2, 1), new Date(2014, 0, 1), new Date(2014, 1, 1)];
    it('should order n Date objects in ascending chronological order', function () {
      var sorted = dateify.order.apply(dateify, arr);
      expect(sorted[0].getMonth()).toBe(0);
      expect(sorted[2].getMonth()).toBe(2);
    });

    it('should also work on arrays of Date objects', function () {
      var sorted = dateify.order(arr);
      expect(sorted[0].getMonth()).toBe(0);
      expect(sorted[2].getMonth()).toBe(2);
    });
  });

  describe('destructure', function () {
    it('performs inverse operation of Date constructor: turns a Date object into #s', function () {
      var _dateify$destructure = dateify.destructure(d);

      var _dateify$destructure2 = _slicedToArray(_dateify$destructure, 4);

      var yr = _dateify$destructure2[0];
      var mon = _dateify$destructure2[1];
      var day = _dateify$destructure2[2];
      var hr = _dateify$destructure2[3];

      expect(yr).toBe(2014);
      expect(mon).toBe(0);
      expect(day).toBe(1);
      expect(hr).toBe(10);
    });

    it('should handle partial strings', function () {
      expect(dateify.destructure('10:00').toString()).toBe(',,,10,0');
      expect(dateify.destructure('2014-01-01').toString()).toBe('2014,0,1');
    });
  });

  describe('inRange', function () {
    it('should test if a date is in a given range', function () {
      var test = dateify.inRange(new Date(2015, 0, 1), new Date(2014, 1, 1));
      expect(test(new Date(2015, 0, 1))).toBe(true);
      expect(test(new Date(2014, 1, 1))).toBe(true);
      expect(test(new Date(2016, 0, 1))).toBe(false);
      expect(test(new Date(2013, 0, 1))).toBe(false);
      expect(test(new Date(2014, 6, 6))).toBe(true);
    });
  });

  describe('isValidDate', function () {
    it('should tell if a date object is valid', function () {
      expect(dateify.isValidDate(new Date())).toBe(true);
      expect(dateify.isValidDate(new Date(''))).toBe(false);
    });

    it('should tell if a date string is valid', function () {
      expect(dateify.isValidDate('')).toBe(false);
      expect(dateify.isValidDate(new Date().toString())).toBe(true);
    });

    it('should return false for all else', function () {
      expect(dateify.isValidDate({})).toBe(false);
      expect(dateify.isValidDate(null)).toBe(false);
      expect(dateify.isValidDate(3)).toBe(false);
    });
  });

  describe('isValidTime', function () {
    it('should tell if a date object is valid', function () {
      expect(dateify.isValidTime(new Date())).toBe(true);
      expect(dateify.isValidTime(new Date(''))).toBe(false);
    });

    it('should true for any number but NaN', function () {
      expect(dateify.isValidTime(123)).toBe(true);
      expect(dateify.isValidTime(-123)).toBe(true);
      expect(dateify.isValidTime(0)).toBe(true);
      expect(dateify.isValidTime(NaN)).toBe(false);
    });

    it('should return false for all else', function () {
      expect(dateify.isValidTime({})).toBe(false);
      expect(dateify.isValidTime(null)).toBe(false);
      expect(dateify.isValidTime(true)).toBe(false);
    });
  });

  /*   Browser tests   */
  if (HTML) {
    (function () {
      var inputEvent = new Event('input');
      var check = dateify.toDateInput();
      var tcheck = dateify.toTimeInput();
      describe('toDateInput', function () {
        it('should have the correct initial value', function () {
          if (check.getAttribute('type') !== 'date') {
            var def = dateify.toDateInput();
            expect(def.value).toBe('yyyy-mm-dd');
          } else {
            console.log('Date type supported, skipping default value test');
            expect(true).toBe(true);
          }
        });

        it('should reset on empty string', function (done) {
          if (check.getAttribute('type') !== 'date') {
            (function () {
              var def = dateify.toDateInput();
              def.value = '';
              def.dispatchEvent(inputEvent);
              setTimeout(function () {
                expect(def.value).toBe('yyyy-mm-dd');
                done();
              }, 510);
            })();
          } else {
            console.log('Date type supported, skipping default reset test');
            expect(true).toBe(true);
            done();
          }
        });

        it('should validate dates', function (done) {
          if (check.getAttribute('type') !== 'date') {
            (function () {
              var input = dateify.toDateInput();
              var foo = null;
              input.validate(function (input) {
                return foo = input.value;
              });
              input.value = '2014-';
              input.dispatchEvent(inputEvent);
              setTimeout(function () {
                expect(foo).toBe('2014-');
                expect(input.valid).toBe(false);
                input.value = '2014-01-01';
                input.dispatchEvent(inputEvent);
                setTimeout(function () {
                  expect(input.valid).toBe(true);
                  expect(foo).toBe('2014-');
                  done();
                }, 510);
              }, 510);
            })();
          } else {
            console.log('Date type supported, skipping validation test');
            expect(true).toBe(true);
            done();
          }
        });
      });

      describe('toTimeInput', function () {
        var def = dateify.toTimeInput();
        it('should have the correct initial value', function () {
          if (tcheck.getAttribute('type') !== 'time') {
            expect(def.value).toBe('hh:mm');
          } else {
            console.log('Time type supported, skipping default value test');
            expect(true).toBe(true);
          }
        });

        it('should reset on empty string', function (done) {
          if (tcheck.getAttribute('type') !== 'time') {
            def.value = 'orsientorsnt';
            def.value = '';
            def.dispatchEvent(inputEvent);
            setTimeout(function () {
              expect(def.value).toBe('hh:mm');
              done();
            }, 510);
          } else {
            console.log('Time type supported, skipping default reset test');
            expect(true).toBe(true);
            done();
          }
        });

        it('should validate times', function (done) {
          if (tcheck.getAttribute('type') !== 'time') {
            (function () {
              var input = dateify.toTimeInput(document.createElement('input'));
              var foo = null;
              input.validate(function (input) {
                return foo = input.value;
              });
              input.value = '10:';
              input.dispatchEvent(inputEvent);
              setTimeout(function () {
                expect(foo).toBe('10:');
                expect(input.valid).toBe(false);
                input.value = '10:00';
                input.dispatchEvent(inputEvent);
                setTimeout(function () {
                  expect(input.valid).toBe(true);
                  expect(foo).toBe('10:');
                  done();
                }, 510);
              }, 510);
            })();
          } else {
            console.log('Time type supported, skipping validation test');
            expect(true).toBe(true);
            done();
          }
        });
      });

      describe('toPaperDate', function () {
        var loaded = Promise.all([new Promise(function (resolve, reject) {
          window.addEventListener('WebComponentsReady', function () {
            resolve(true);
          });
          setTimeout(function () {
            reject(new Error('Polymer failed to load'));
          }, 3000);
        }), new Promise(function (resolve, reject) {
          document.addEventListener('DOMContentLoaded', function () {
            resolve(true);
          });
          setTimeout(function () {
            reject(new Error('DOM failed to load'));
          }, 3000);
        })]);
        var catcher = function catcher(e) {
          throw e;
        };

        it('should have the correct initial value', function (done) {
          loaded.then(function () {
            if (check.getAttribute('type') !== 'date') {
              var def = dateify.toPaperDate();
              expect(def.value).toBe('yyyy-mm-dd');
              done();
            } else {
              console.log('Date type supported, skipping paper default value test');
              expect(true).toBe(true);
              done();
            }
          }).catch(catcher);
        });

        it('should reset on empty string', function (done) {
          loaded.then(function () {
            if (check.getAttribute('type') !== 'date') {
              (function () {
                var def = dateify.toPaperDate();
                def.value = '';
                def.dispatchEvent(inputEvent);
                setTimeout(function () {
                  expect(def.value).toBe('yyyy-mm-dd');
                  done();
                }, 510);
              })();
            } else {
              console.log('Date type supported, skipping paper default reset test');
              expect(true).toBe(true);
              done();
            }
          }).catch(catcher);
        });

        it('should validate dates', function (done) {
          loaded.then(function () {
            if (check.getAttribute('type') !== 'date') {
              (function () {
                var input = dateify.toPaperDate();
                var foo = null;
                input.validate(function (input) {
                  return foo = input.value;
                });
                input.value = '2014-';
                input.dispatchEvent(inputEvent);
                setTimeout(function () {
                  expect(foo).toBe('2014-');
                  expect(input.valid).toBe(false);
                  input.value = '2014-01-01';
                  input.dispatchEvent(inputEvent);
                  setTimeout(function () {
                    expect(input.valid).toBe(true);
                    expect(foo).toBe('2014-');
                    done();
                  }, 510);
                }, 510);
              })();
            } else {
              console.log('Date type supported, skipping paper validation test');
              expect(true).toBe(true);
              done();
            }
          }).catch(catcher);
        });
      });

      describe('toPaperTime', function () {
        var loaded = Promise.all([new Promise(function (resolve, reject) {
          window.addEventListener('WebComponentsReady', function () {
            resolve(true);
          });
          setTimeout(function () {
            reject(new Error('Polymer failed to load'));
          }, 3000);
        }), new Promise(function (resolve, reject) {
          document.addEventListener('DOMContentLoaded', function () {
            resolve(true);
          });
          setTimeout(function () {
            reject(new Error('DOM failed to load'));
          }, 3000);
        })]);
        var catcher = function catcher(e) {
          throw e;
        };

        it('should have the correct initial value', function (done) {
          loaded.then(function () {
            if (tcheck.getAttribute('type') !== 'time') {
              var def = dateify.toPaperTime();
              expect(def.value).toBe('hh:mm');
              done();
            } else {
              console.log('Time type supported, skipping paper default value test');
              expect(true).toBe(true);
              done();
            }
          }).catch(catcher);
        });

        it('should reset on empty string', function (done) {
          loaded.then(function () {
            if (tcheck.getAttribute('type') !== 'time') {
              (function () {
                var def = dateify.toPaperTime();
                def.value = '';
                def.dispatchEvent(inputEvent);
                setTimeout(function () {
                  expect(def.value).toBe('hh:mm');
                  done();
                }, 510);
              })();
            } else {
              console.log('Time type supported, skipping paper default reset test');
              expect(true).toBe(true);
              done();
            }
          }).catch(catcher);
        });

        it('should validate times', function (done) {
          loaded.then(function () {
            if (tcheck.getAttribute('type') !== 'time') {
              (function () {
                var input = dateify.toPaperTime();
                var foo = null;
                input.validate(function (input) {
                  return foo = input.value;
                });
                input.value = '10:';
                input.dispatchEvent(inputEvent);
                setTimeout(function () {
                  expect(foo).toBe('10:');
                  expect(input.valid).toBe(false);
                  input.value = '10:00';
                  input.dispatchEvent(inputEvent);
                  setTimeout(function () {
                    expect(input.valid).toBe(true);
                    expect(foo).toBe('10:');
                    done();
                  }, 510);
                }, 510);
              })();
            } else {
              console.log('Time type supported, skipping paper validation test');
              expect(true).toBe(true);
              done();
            }
          }).catch(catcher);
        });
      });
    })();
  } else {
    console.log('Skipping HTMLElement/Polymer tests...');
  }
});
