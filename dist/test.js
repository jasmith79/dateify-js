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

  var HTML = 'undefined' !== typeof HTMLElement; /*
                                                  *Dateify-js tests
                                                  *@author jasmith79@gmail.com
                                                  *@copyright Jared Adam Smith, 2016
                                                  *Licensed under the MIT license. You should have received a copy with this software, otherwise see
                                                  *https://opensource.org/licenses/MIT.
                                                  *
                                                  */

  var d = new Date(2014, 0, 1, 10);
  var n = d.getTime();
  var nplus = n + 1000 * 60 * 60 * 5;
  var iso = '2014-01-01T10:00:00'; //Z is assumed
  var isoz = '2014-01-01T15:00:00Z';
  var isotz = '2014-01-01T10:00:00-05:00';
  var meh = '2014/01/01 10:00:00';
  var jsstr = d.toString();
  var jsdstr = d.toDateString(); //year, month, and day only

  describe('dateify', function () {
    it('should handle datestrings in various formats', function () {
      expect(dateify.dateify(iso).getTime()).toBe(n);
      expect(dateify.dateify(isoz).getTime()).toBe(nplus);
      expect(dateify.dateify(isotz).getTime()).toBe(nplus);
      expect(dateify.dateify(meh).getTime()).toBe(n);
      expect(dateify.dateify(jsstr).getTime()).toBe(nplus);
      expect(dateify.dateify(jsdstr).getTime()).toBe(nplus - 1000 * 60 * 60 * 15); //midnight vs 3pm
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

      describe('Polymer date tests', function () {
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

      describe('Polymer time tests', function () {
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
