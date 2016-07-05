/*
 *Dateify-js tests
 *@author jasmith79@gmail.com
 *@copyright Jared Adam Smith, 2016
 *Licensed under the MIT license. You should have received a copy with this software, otherwise see
 *https://opensource.org/licenses/MIT.
 *
 */

import * as dateify from './dateify.js';

let HTML   = 'undefined' !== typeof HTMLElement;
let d      = new Date(2014, 0, 1, 10);
let n      = d.getTime();
let nplus  = n + (1000 * 60 * 60 * 5);
let iso    = '2014-01-01T10:00:00'; //Z is assumed
let isoz   = '2014-01-01T15:00:00Z';
let isotz  = '2014-01-01T10:00:00-05:00';
let meh    = '2014/01/01 10:00:00';
let jsstr  = d.toString();
let jsdstr = d.toDateString(); //year, month, and day only

describe('dateify', function() {
  it('should handle datestrings in various formats', function() {
    expect(dateify.dateify(iso).getTime()).toBe(n);
    expect(dateify.dateify(isoz).getTime()).toBe(nplus);
    expect(dateify.dateify(isotz).getTime()).toBe(n); // gettime is always UTC
    expect(dateify.dateify(meh).getTime()).toBe(n);
    expect(dateify.dateify(jsstr).getTime()).toBe(n);
    expect(dateify.dateify(jsdstr).getTime()).toBe(nplus - (1000 * 60 * 60 * 15)); //midnight vs 3pm
  });

  it('Should throw on invalid datestrings', () => {
    expect(() => dateify.dateify('24687965')).toThrow();
    expect(() => dateify.dateify('2014-01-01T10:00:00Z-05:00')).toThrow();
  });
});

describe('deDateify', function() {
  console.log(Object.prototype.toString.call(d));
  it('should return an ISO-formatted datestring with timezone', () => {
    expect(dateify.deDateify(d)).toBe(isotz);
  });

  it('should be the inverse operation of dateify', () => {
    expect(dateify.deDateify(dateify.dateify(isotz))).toBe(isotz);
  });
});

describe('isLeapYear', function() {
  it('should accurately tell if a year is a leap year', function() {
    expect(() => dateify.isLeapYear(0)).toThrow();
    expect(dateify.isLeapYear(4)).toBe(false);
    expect(dateify.isLeapYear(1900)).toBe(false);
    expect(dateify.isLeapYear(1600)).toBe(true);
    expect(dateify.isLeapYear(404)).toBe(true);
    expect(dateify.isLeapYear(634)).toBe(false);
    //actually 30 BC was a leap year, but fn -> false for < 0
    expect(dateify.isLeapYear(-30)).toBe(false);
  });
});

describe('toUTCDateString', function() {
  it('should return a ISO-formatted UTC string', function() {
    let str = dateify.toUTCDateString(d);
    expect(str).toBe('2014-01-01T15:00:00Z');
  });
});

describe('order', function() {
  let arr = [new Date(2014, 2, 1), new Date(2014, 0, 1), new Date(2014, 1, 1)];
  it('should order n Date objects in ascending chronological order', function() {
    let sorted = dateify.order(...arr);
    expect(sorted[0].getMonth()).toBe(0);
    expect(sorted[2].getMonth()).toBe(2);
  });

  it('should also work on arrays of Date objects', function() {
    let sorted = dateify.order(arr);
    expect(sorted[0].getMonth()).toBe(0);
    expect(sorted[2].getMonth()).toBe(2);
  });
});

describe('destructure', function() {
  it('performs inverse operation of Date constructor: turns a Date object into #s', function() {
    let [yr, mon, day, hr] = dateify.destructure(d);
    expect(yr).toBe(2014);
    expect(mon).toBe(0);
    expect(day).toBe(1);
    expect(hr).toBe(10);
  });
});

/*   Browser tests   */
if (HTML) {
  let inputEvent = new Event('input');
  let check = dateify.toDateInput();
  let tcheck = dateify.toTimeInput();
  describe('toDateInput', function() {
    it('should have the correct initial value', function() {
      if (check.getAttribute('type') !== 'date') {
        let def = dateify.toDateInput();
        expect(def.value).toBe('yyyy-mm-dd');
      } else {
        console.log('Date type supported, skipping default value test');
        expect(true).toBe(true);
      }
    });

    it('should reset on empty string', function(done) {
      if (check.getAttribute('type') !== 'date') {
        let def = dateify.toDateInput();
        def.value = '';
        def.dispatchEvent(inputEvent);
        setTimeout(() => {
          expect(def.value).toBe('yyyy-mm-dd');
          done();
        }, 510);
      } else {
        console.log('Date type supported, skipping default reset test');
        expect(true).toBe(true);
        done();
      }
    });

    it('should validate dates', function(done) {
      if (check.getAttribute('type') !== 'date') {
        let input = dateify.toDateInput();
        let foo = null;
        input.validate((input) => foo = input.value);
        input.value = '2014-';
        input.dispatchEvent(inputEvent);
        setTimeout(() => {
          expect(foo).toBe('2014-');
          expect(input.valid).toBe(false);
          input.value = '2014-01-01';
          input.dispatchEvent(inputEvent);
          setTimeout(() => {
            expect(input.valid).toBe(true);
            expect(foo).toBe('2014-');
            done();
          }, 510);
        }, 510);
      } else {
        console.log('Date type supported, skipping validation test');
        expect(true).toBe(true);
        done();
      }
    });
  });

  describe('toTimeInput', function() {
    let def = dateify.toTimeInput();
    it('should have the correct initial value', function() {
      if (tcheck.getAttribute('type') !== 'time') {
        expect(def.value).toBe('hh:mm');
      } else {
        console.log('Time type supported, skipping default value test');
        expect(true).toBe(true);
      }
    });

    it('should reset on empty string', function(done) {
      if (tcheck.getAttribute('type') !== 'time') {
        def.value = 'orsientorsnt';
        def.value = '';
        def.dispatchEvent(inputEvent);
        setTimeout(() => {
          expect(def.value).toBe('hh:mm');
          done();
        }, 510);
      } else {
        console.log('Time type supported, skipping default reset test');
        expect(true).toBe(true);
        done();
      }
    });

    it('should validate times', function(done) {
      if (tcheck.getAttribute('type') !== 'time') {
        let input = dateify.toTimeInput(document.createElement('input'));
        let foo = null;
        input.validate((input) => foo = input.value);
        input.value = '10:';
        input.dispatchEvent(inputEvent);
        setTimeout(() => {
          expect(foo).toBe('10:');
          expect(input.valid).toBe(false);
          input.value = '10:00';
          input.dispatchEvent(inputEvent);
          setTimeout(() => {
            expect(input.valid).toBe(true);
            expect(foo).toBe('10:');
            done();
          }, 510);
        }, 510);
      } else {
        console.log('Time type supported, skipping validation test');
        expect(true).toBe(true);
        done();
      }
    });
  });

  describe('toPaperDate', function() {
    let loaded = Promise.all([new Promise((resolve, reject) => {
      window.addEventListener('WebComponentsReady', () => {
        resolve(true);
      });
      setTimeout(() => {
        reject(new Error('Polymer failed to load'));
      }, 3000);
    }), new Promise((resolve, reject) => {
      document.addEventListener('DOMContentLoaded', () => {
        resolve(true);
      });
      setTimeout(() => {
        reject(new Error('DOM failed to load'));
      }, 3000);
    })]);
    let catcher = (e) => { throw e };

    it('should have the correct initial value', function(done) {
      loaded.then(() => {
        if (check.getAttribute('type') !== 'date') {
          let def = dateify.toPaperDate();
          expect(def.value).toBe('yyyy-mm-dd');
          done();
        } else {
          console.log('Date type supported, skipping paper default value test');
          expect(true).toBe(true);
          done();
        }
      }).catch(catcher);
    });

    it('should reset on empty string', function(done) {
      loaded.then(() => {
        if (check.getAttribute('type') !== 'date') {
          let def = dateify.toPaperDate();
          def.value = '';
          def.dispatchEvent(inputEvent);
          setTimeout(() => {
            expect(def.value).toBe('yyyy-mm-dd');
            done();
          }, 510);
        } else {
          console.log('Date type supported, skipping paper default reset test');
          expect(true).toBe(true);
          done();
        }
      }).catch(catcher);
    });

    it('should validate dates', function(done) {
      loaded.then(() => {
        if (check.getAttribute('type') !== 'date') {
          let input = dateify.toPaperDate();
          let foo = null;
          input.validate((input) => foo = input.value);
          input.value = '2014-';
          input.dispatchEvent(inputEvent);
          setTimeout(() => {
            expect(foo).toBe('2014-');
            expect(input.valid).toBe(false);
            input.value = '2014-01-01';
            input.dispatchEvent(inputEvent);
            setTimeout(() => {
              expect(input.valid).toBe(true);
              expect(foo).toBe('2014-');
              done();
            }, 510);
          }, 510);
        } else {
          console.log('Date type supported, skipping paper validation test');
          expect(true).toBe(true);
          done();
        }
      }).catch(catcher);
    });
  });

  describe('toPaperTime', function() {
    let loaded = Promise.all([new Promise((resolve, reject) => {
      window.addEventListener('WebComponentsReady', () => {
        resolve(true);
      });
      setTimeout(() => {
        reject(new Error('Polymer failed to load'));
      }, 3000);
    }), new Promise((resolve, reject) => {
      document.addEventListener('DOMContentLoaded', () => {
        resolve(true);
      });
      setTimeout(() => {
        reject(new Error('DOM failed to load'));
      }, 3000);
    })]);
    let catcher = (e) => { throw e };

    it('should have the correct initial value', function(done) {
      loaded.then(() => {
        if (tcheck.getAttribute('type') !== 'time') {
          let def = dateify.toPaperTime();
          expect(def.value).toBe('hh:mm');
          done();
        } else {
          console.log('Time type supported, skipping paper default value test');
          expect(true).toBe(true);
          done();
        }
      }).catch(catcher);
    });

    it('should reset on empty string', function(done) {
      loaded.then(() => {
        if (tcheck.getAttribute('type') !== 'time') {
          let def = dateify.toPaperTime();
          def.value = '';
          def.dispatchEvent(inputEvent);
          setTimeout(() => {
            expect(def.value).toBe('hh:mm');
            done();
          }, 510);
        } else {
          console.log('Time type supported, skipping paper default reset test');
          expect(true).toBe(true);
          done();
        }
      }).catch(catcher);
    });

    it('should validate times', function(done) {
      loaded.then(() => {
        if (tcheck.getAttribute('type') !== 'time') {
          let input = dateify.toPaperTime();
          let foo = null;
          input.validate((input) => foo = input.value);
          input.value = '10:';
          input.dispatchEvent(inputEvent);
          setTimeout(() => {
            expect(foo).toBe('10:');
            expect(input.valid).toBe(false);
            input.value = '10:00';
            input.dispatchEvent(inputEvent);
            setTimeout(() => {
              expect(input.valid).toBe(true);
              expect(foo).toBe('10:');
              done();
            }, 510);
          }, 510);
        } else {
          console.log('Time type supported, skipping paper validation test');
          expect(true).toBe(true);
          done();
        }
      }).catch(catcher);
    });
  });
} else {
  console.log('Skipping HTMLElement/Polymer tests...');
}
