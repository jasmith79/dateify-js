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
let isotz  = '2014-01-01T10:00:00-05:00';

describe('dateify', () => {
  it('should handle datestrings in various formats', () => {
    expect(
      new Date('Fri Aug 26 2016 11:06:52 GMT+0400').toString()
    ).toBe(
      dateify.dateify('2016-08-26T11:06:52+04:00').toString()
    );
    expect(
      new Date('Fri Aug 26 2016 11:06:52 GMT-0600').toString()
    ).toBe(
      dateify.dateify('2016-08-26T11:06:52-06:00').toString()
    );
    expect(
      new Date('Fri Aug 26 2016 11:06:52 GMT+0000').toString()
    ).toBe(
      dateify.dateify('2016-08-26T11:06:52+00:00').toString()
    );
    expect(
      new Date('Fri Aug 26 2016 11:06:52 GMT-0000').toString()
    ).toBe(
      dateify.dateify('2016-08-26T11:06:52-00:00').toString()
    );
    expect(
      new Date('Fri Aug 26 2016 11:06:52 GMT+0000').toString()
    ).toBe(
      dateify.dateify('2016-08-26T11:06:52Z').toString()
    );

    // if timezone is omitted, string is assumed to refer to the JS environment's
    // local time
    expect(
      new Date('Wed Jan 01 2014 10:00:00 GMT-0500 (EST)').toString()
    ).toBe(
      dateify.dateify('2014/01/01 10:00:00').toString()
    );
    expect(
      new Date('Fri Jan 01 1937 10:00:00 GMT-0500 (EST)').toString()
    ).toBe(
      dateify.dateify('1/1/37 10:00:00').toString()
    );

    // it should parse the browser's datestrings same as the browser does:
    let test1 = new Date();
    expect(dateify.dateify(test1.toString()).toString()).toBe(test1.toString());

    // it should handle partials
    expect(dateify.dateify('2014/01/01').toString()).toBe('Wed Jan 01 2014 00:00:00 GMT-0500 (EST)');
  });

  it('should throw on input with multiple tz designations', () => {
    expect(() => dateify.dateify('2016-08-26T11:06:52Z-00:00')).toThrow();
    expect(() => dateify.dateify('2016-08-26T11:06:52-00:00Z')).toThrow();
  });

  it('should return invalid date on bad string input', () => {
    expect(dateify.dateify('').toString()).toBe('Invalid Date');
  });

  it('should return dates as-is', () => {
    let test1 = new Date('Fri Jan 01 1937 10:00:00 GMT-0500 (EST)');
    let test2 = new Date('');

    let res1 = dateify.dateify(test1);
    let res2 = dateify.dateify(test2);
    expect(res1.toString()).toBe(test1.toString());
    expect(res2.toString()).toBe(test2.toString());
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

  it('should handle partial strings', () => {
    expect(dateify.destructure('10:00').toString()).toBe(',,,10,0');
    expect(dateify.destructure('2014-01-01').toString()).toBe('2014,0,1');
  });
});

describe('inRange', () => {
  it('should test if a date is in a given range', () => {
    let test = dateify.inRange(new Date(2015, 0, 1), new Date(2014, 1, 1));
    expect(test(new Date(2015, 0, 1))).toBe(true);
    expect(test(new Date(2014, 1, 1))).toBe(true);
    expect(test(new Date(2016, 0, 1))).toBe(false);
    expect(test(new Date(2013, 0, 1))).toBe(false);
    expect(test(new Date(2014, 6, 6))).toBe(true);
  });
});

describe('isValidDate', () => {
  it('should tell if a date object is valid', () => {
    expect(dateify.isValidDate(new Date())).toBe(true);
    expect(dateify.isValidDate(new Date(''))).toBe(false);
  });

  it('should tell if a date string is valid', () => {
    expect(dateify.isValidDate('')).toBe(false);
    expect(dateify.isValidDate(new Date().toString())).toBe(true);
  });

  it('should return false for all else', () => {
    expect(dateify.isValidDate({})).toBe(false);
    expect(dateify.isValidDate(null)).toBe(false);
    expect(dateify.isValidDate(3)).toBe(false);
  });
});

describe('isValidTime', () => {
  it('should tell if a date object is valid', () => {
    expect(dateify.isValidTime(new Date())).toBe(true);
    expect(dateify.isValidTime(new Date(''))).toBe(false);
  });

  it('should true for any number but NaN', () => {
    expect(dateify.isValidTime(123)).toBe(true);
    expect(dateify.isValidTime(-123)).toBe(true);
    expect(dateify.isValidTime(0)).toBe(true);
    expect(dateify.isValidTime(NaN)).toBe(false);
  });

  it('should return false for all else', () => {
    expect(dateify.isValidTime({})).toBe(false);
    expect(dateify.isValidTime(null)).toBe(false);
    expect(dateify.isValidTime(true)).toBe(false);
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
