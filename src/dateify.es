/*
 *Dateify-js
 *@author jasmith79@gmail.com
 *@copyright Jared Adam Smith, 2016
 *Licensed under the MIT license. You should have received a copy with this software, otherwise see
 *https://opensource.org/licenses/MIT.
 *
 */

/*   Imports   */
import * as d from 'decorators-js';
import * as typed from 'js-typed';

/*   Polyfills  */
if (typeof Number.isNaN !== 'function') {
  Number.isNaN = (x => x !== x);
}

/*   Constants   */
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

//none of the regexs are foolproof, but good enough for a quick and dirty check

//ISO 8601
const VALID_DATE = /(?:[0-9]{4}[-\/][0-1][0-9][-\/][0-3][0-9])|(?:[0-1][0-9][-\/][0-3][0-9][-\/][0-9]{4})/;
const VALID_TIME = /[0-2][0-9]:[0-5][0-9](?::[0-5][0-9])?[+-Z]?(?:[0-2][0-9]:[0-5][0-9])?/;

//ISO-conforming defaults
const DATE_DEF_REGEX = /^y{1,4}-?m{0,2}-?d{0,2}/i;
const TIME_DEF_REGEX = /^h{1,2}:?m{0,2}:?s{0,2}\s*[ap]?/i;
const DATE_DEFAULT   = 'yyyy-mm-dd';
const TIME_DEFAULT   = 'hh:mm';
const FN_NAME_REGEX  = /^\s*function\s*(\S*)\s*\(/;

//matches Date::toString() and Date::toDateString()
const DATESTR_REGEX  = new RegExp([
  /[A-Z][a-z]{2} [A-Z][a-z]{2} [0-3][0-9] [0-9]{4}/,                          //date
  /(?: [0-9]{2}:[0-9]{2}:[0-9]{2} GMT[-+][0-2][0-9][0-5][0-9] \([A-Z]{3}\))?/ //time
].map(r => r.source).join(''), 'g');

//See what we're dealing with in terms of browser support. Not entirely sure how good the
//pattern check is, but its the approach Modernizr takes so I'm assuming it works well enough.
// const [DATE_TYPE_SUPPORTED, PATTERN_SUPPORTED, INPUT_EVENT_SUPPORTED] = (() => {
//   let input = document.createElement('input');
//   let notDate = 'not-a-date';
//   input.setAttribute('type', 'date');
//   input.setAttribute('value', notDate);
//   let inputEvent;
//   try {
//     input.dispatchEvent(new Event('input'));
//     inputEvent = true;
//   } catch (e) {
//     inputEvent = false;
//   }
//   return [input.value !== notDate, 'pattern' in input, inputEvent];
// })();

const DATE_TYPE_SUPPORTED = (() => {
  if (typeof document === 'undefined') {
    return false;
  } else {
    let input = document.createElement('input');
    let notDate = 'not-a-date';
    input.setAttribute('type', 'date');
    input.setAttribute('value', notDate);
    return input.value !== notDate;
  }
})();

const _padInt = d.padInt(2);
const _Date = typed.guardClass(0, Date);
const wait500 = d.debounce(500);

typed.defType('__dateString', s => typed.isType('string', s) && s.match(DATESTR_REGEX));
typed.defType('__isoDateString', s => typed.isType('string', s) && s.match(VALID_DATE));
typed.defType(
  '__Array<Number>',
  arr => typed.isType('array', arr) && arr.every(x => !Number.isNaN(+x))
);

// returns [yr, mn, dy, hr, min, sec] in *local* time for the executing JS environment.
// NOTE: months are 0-11.
let destructure = typed.Dispatcher([
  typed.guard('date', d => {
    return Number.isNaN(d.getTime()) ? [] : [
      d.getFullYear(),
      d.getMonth(), //no +1
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
    ];
  }),

  typed.guard('__dateString', s => {
    let d = new Date(s);
    return Number.isNaN(d.getTime()) ? [] : [
      d.getFullYear(),
      d.getMonth(), //no +1
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
    ];
  }),

  typed.guard('string', s => {
    let result = [];
    let dateTimeSplitter = s.indexOf('T') === -1 ? ' ' : 'T';
    let dateSplitter = s.indexOf('-') === -1 ? '/' : '-';

    let [date, t] = s.split(dateTimeSplitter);
    let dateArr = date.split(dateSplitter).map(Number);

    // valid dates must have day/month/yr and there is no year 0.
    let validDate = dateArr.length === 3 && dateArr.every(n => n > 0);

    if (validDate) {

      // We try to determine the position of the various pieces of the date, starting
      // with the year. We If we cannot reliably determine the year, bail.
      let [first, second, third] = dateArr;
      let yr, mn, dy;

      switch (true) {
        case first > 31:
          if (second < 13) { // assume month comes before day unless clearly otherwise
            ([yr, mn, dy] = dateArr);
          } else {
            ([yr, dy, mn] = dateArr);
          }

          mn -= 1;
          break;

        case third > 31:
          if (first < 13) {
            ([mn, dy, yr] = dateArr);
          } else {
            ([dy, mn, yr] = dateArr);
          }

          mn -= 1;
          break;

        default:
          dy = mn = yr = null;
          break;
      }

      result.push(yr, mn, dy)

    } else {
      t = date;
      result.push(null, null, null);
    }

    let tzSplitter = null;
    if (t) {
      tzSplitter = ((t) => {
        let hasZ = t.indexOf('Z') !== -1;
        let hasPlus = t.indexOf('+') !== -1;
        let hasDash = t.indexOf('-') !== -1;
        let splitters = [hasZ, hasDash, hasPlus].reduce((acc, bool, i) => {
          if (bool) {
            acc.push(i);
          }
          return acc;
        }, []);

        switch (splitters.length) {
          case 0: return null;
          case 1: return ['Z', '-', '+'][splitters[0]];
          default:
            throw new Error(`Attempted to parse a datestring with both a 'Z' and
              a timezone.`);
        }
      })(t);
    }

    let [time, tz] = tzSplitter ? t.split(tzSplitter) : [t, null];
    let timeArr = time ? time.split(':').map(Number) : [];
    let tzOff = tz ? (() => { // in ms
      let sign = tzSplitter;
      let [hours, minutes] = tz.split(':');
      return ((Number(`${sign}${hours}`) * 60) + Number(`${sign}${minutes}`)) * 60 * 1000;
    })() : null;

    let [hrs, min, sec] = timeArr;
    let validTime = hrs >= 0 &&
      hrs <= 24 &&
      min >= 0 &&
      min <= 59 &&
      (sec == null || (sec >= 0 &&
      sec <= 59));

    if (validTime) {
      result.push(hrs, min);
      if (sec != null) {
        result.push(sec);
      }
    }

    if (result[0] && tzSplitter != null) {
      let tempDate = _Date(...result);
      let localOffset = tempDate.getTimezoneOffset() * 60 * 1000;
      let adjustedTime = tempDate.getTime() - localOffset - tzOff;
      return destructure(_Date(adjustedTime));
    } else if (result.every(x => x == null)) {
      return [];
    } else {
      return result;
    }
  })
]);

let _isValidDate = a => {
  let arr = destructure(a);
  return arr.length > 2 ? arr.slice(0, 3).every(n => typed.isType('number', n)) : false;
};

let _isValidTime = a => {
  let arr = destructure(a);
  return arr.length > 4 ? arr.slice(3, 5).every(n => typed.isType('number', n)) : false;
};

let isValidDate = typed.Dispatcher([
  typed.guard('date', d => _isValidDate(d)),
  typed.guard('string', s => _isValidDate(s))
]);

isValidDate.setDefault(x => false);

let isValidTime = typed.Dispatcher([
  typed.guard('date', d => _isValidTime(d)),
  typed.guard('string', s => _isValidTime(s)),
  typed.guard('number', n => !Number.isNaN(n))
]);

isValidTime.setDefault(x => false);

// _upgradeInput :: String -> HTMLInputElement -> HTMLInputElement
const _upgradeInput = ((timeValidator, dateValidator) => {
  return typed.guard((type, input) => {

    //right now date type is not supported in phantomjs so the tests all work, but if it starts
    //supporting date inputs we'll need to add a function to expose the custom stuff for testing.
    if (DATE_TYPE_SUPPORTED) {
      input.setAttribute('type', type);
    } else {
      input.setAttribute('pattern', type === 'date' ? VALID_DATE : VALID_TIME);
      input.DEFAULT = type === 'date' ? DATE_DEFAULT : TIME_DEFAULT;
      input.value = input.DEFAULT;
      let validfn = type === 'date' ? dateValidator : timeValidator;

      input.validate = function(fn) {
        let ctx = this;
        ctx.addEventListener('input', wait500((e) => {
          ctx.valid = false;
          validfn.call(ctx, fn);
        }));
      };
      input.validate(function(e) {
        if (!this.value) {
          this.value = this.DEFAULT;
        }
      });
    }
    return input;
  });
})(
  function(fn) {
    let def = this.value.match(TIME_DEF_REGEX);
    let valid = def || this.value.match(VALID_TIME);
    if (!valid) {
      fn.call(this, this);
    } else {
      this.valid = true;
    }
  }, function(fn) {
    let def = this.value.match(DATE_DEF_REGEX);
    let valid = def || this.value.match(VALID_DATE);
    if (!valid) {
      fn.call(this, this);
    } else {
      this.valid = true;
    }
  }
);

// _defaultTag :: String -> Maybe HTMLElement -> HTMLElement
const _defaultTag  = tag => el => el || document.createElement(tag);
const _ensureInput = _defaultTag('input');
const _ensurePaper = _defaultTag('paper-input');
const _upDate      = _upgradeInput('date');
const _upTime      = _upgradeInput('time');
const toDateInput  = arg => _upDate(_ensureInput(arg));
const toTimeInput  = arg => _upTime(_ensureInput(arg));
const toPaperDate  = arg => _upDate(_ensurePaper(arg));
const toPaperTime  = arg => _upTime(_ensurePaper(arg));

// dateify :: String   -> Date
// dateify :: Number   -> Date
// dateify :: Date     -> Date
// dateify :: [Number] -> Date
const dateify = typed.Dispatcher([
  typed.guard('string', s => {
    let parsed = destructure(s);
    if (!parsed.length) {
      console.warn(`Attempted to parse non-date string ${s} as a date`);
      return new Date(''); // invalid date
    }
    return _Date(...parsed);
  }),
  typed.guard('number', n => _Date(n)),
  typed.guard('date', d => d),
  typed.guard('__Array<Number>', arr => _Date(...arr))
]);

// deDateify :: Date -> ISODateString
// returns an ISO 8601 datestring with timezone
const deDateify = typed.guard('date', d => {
  let [yr, mn, dy, hr, min, sec] = destructure(d);
  let tz = d.getTimezoneOffset();
  let sign = tz > 0 ? '-' : '+';
  let hrs = tz / 60 | 0;
  let mins = tz % 60;
  return `${yr}-${_padInt(mn + 1)}-${_padInt(dy)}T${_padInt(hr)}:${_padInt(min)}:${_padInt(sec)}` +
    `${sign}${_padInt(hrs)}:${_padInt(mins)}`;
});

// isLeapYear :: Number -> Boolean
const isLeapYear = ((err) => {
  return typed.guard('number', yr => {
    // check for the special years, see https://www.wwu.edu/skywise/leapyear.html
    if (yr === 0) {
      throw err;
    }
    // after 8 AD, follows 'normal' leap year rules
    let passed = true;
    // not technically true as there were 13 LY BCE, but hey.
    if (yr === 4 || yr < 0 || (yr % 4)) {
      passed = false;
    } else {
      if (yr % 400) {
        if (!(yr % 100)) {
          passed = false;
        }
      }
    }
    return passed;
  });
})(new Error('Year zero does not exist, refers to 1 BCE'));

// toUTCDateString :: Date   -> ISODateString
// toUTCDateString :: String -> ISODateString
// Returns date string in UTC time ISO 8601 format - YYYY-MM-DDTHH:MM:SSZ
const toUTCDateString = arg => {
  let d = dateify(arg);
  let date = new Date(d.getTime() + (d.getTimezoneOffset() * 60 * 1000));
  let [yr, mn, dy, hr, min, sec] = destructure(date);
  return `${yr}-${_padInt(mn + 1)}-${_padInt(dy)}` +
    `T${_padInt(hr)}:${_padInt(min)}:${_padInt(sec)}Z`;
}

// order :: [Date] -> [Date]
// Returns an array of the passed-in Date objects in ascending chronological order.
const order = d.unGather((...args) => args.sort((a, b) => a.getTime() - b.getTime()));

// inRange :: Date -> Date -> Date -> Boolean
// Returns whether the date is in the given range, inclusive.
const inRange = typed.guard(['date', 'date', 'date'], (a, b, test) => {
  let [start, end] = order(a, b);
  let x = start.getTime();
  let y = end.getTime();
  let z = test.getTime();
  return z <= y && z >= x;
});

const _toDateInputString = typed.guard('date', d => {
  return `${d.getFullYear()}-${_padInt(d.getMonth() + 1)}-${_padInt(d.getDate())}`;
});

// toInputDateString :: Date -> String
// toInputDateString :: String -> String
const toInputDateString = typed.Dispatcher([
  _toDateInputString,
  typed.guard('string', s => _toDateInputString(dateify(s)))
]);

export {
  toDateInput,
  toTimeInput,
  toPaperDate,
  toPaperTime,
  dateify,
  deDateify,
  isLeapYear,
  toUTCDateString,
  //destructure as destructure,
  destructure,
  order,
  inRange,
  isValidDate,
  isValidTime,
  toInputDateString,
};
