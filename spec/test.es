/*
 *Dateify-js tests
 *@author jasmith79@gmail.com
 *@copyright Jared Adam Smith, 2016
 *Licensed under the MIT license. You should have received a copy with this software, otherwise see
 *https://opensource.org/licenses/MIT.
 *
 */

import * as dateify from './dateify.js';

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
    expect(dateify.dateify(isotz).getTime()).toBe(nplus);
    expect(dateify.dateify(meh).getTime()).toBe(n);
    expect(dateify.dateify(jsstr).getTime()).toBe(nplus);
    expect(dateify.dateify(jsdstr).getTime()).toBe(nplus - (1000 * 60 * 60 * 15)); //midnight vs 3pm
    expect(() => dateify.dateify('24687965')).toThrow();
  });
});

describe('deDateify', function() {
  it('should return a yyyy-mm-dd string for various dates', function() {
    expect(dateify.deDateify(d)).toBe('2014-01-01');
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

/*   Browser tests   */
if ('undefined' !== typeof HTMLElement) {
  let change = new Event('change');
  describe('toDateInput', function() {
    it('should have the correct initial value', function() {
      let def = dateify.toDateInput();
      expect(def.value).toBe('yyyy-mm-dd');
    });

    it('should reset on empty string', function(done) {
      let def = dateify.toDateInput();
      def.value = '';
      def.dispatchEvent(change);
      setTimeout(() => {
        expect(def.value).toBe('yyyy-mm-dd');
        done();
      }, 510)
    });

    it('should validate dates', function(done) {
      let input = dateify.toDateInput();
      let foo = null;
      input.validate((input) => foo = input.value);
      input.value = '2014-';
      input.dispatchEvent(change);
      setTimeout(() => {
        expect(foo).toBe('2014-');
        expect(input.valid).toBe(false);
        input.value = '2014-01-01';
        input.dispatchEvent(change);
        setTimeout(() => {
          expect(input.valid).toBe(true);
          expect(foo).toBe('2014-');
          done();
        }, 510);
      }, 510)
    });
  });

  describe('toTimeInput', function() {
    let def = dateify.toTimeInput();
    it('should have the correct initial value', function() {
      expect(def.value).toBe('hh:mm');
    });

    it('should reset on empty string', function(done) {
      def.value = 'orsientorsnt';
      def.value = '';
      def.dispatchEvent(change);
      setTimeout(() => {
        expect(def.value).toBe('hh:mm');
        done();
      }, 510)
    });

    it('should validate times', function(done) {
      let input = dateify.toTimeInput(document.createElement('input'));
      let foo = null;
      input.validate((input) => foo = input.value);
      input.value = '10:';
      input.dispatchEvent(change);
      setTimeout(() => {
        expect(foo).toBe('10:');
        expect(input.valid).toBe(false);
        input.value = '10:00';
        input.dispatchEvent(change);
        setTimeout(() => {
          expect(input.valid).toBe(true);
          expect(foo).toBe('10:');
          done();
        }, 510);
      }, 510)
    });
  });
} else {
  console.log('Skipping HTMLElement tests');
}
