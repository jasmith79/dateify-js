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

// padInt :: Number -> String
const _padInt = d.padInt(2);

//_makeDate :: Number -> Date
// const _makeDate = d.unNew(0, Date);
const _Date = typed.guardClass(0, Date);
typed.defType(
  '__Array<Number>',
  arr => typed.isType('array', arr) && arr.every(x => !Number.isNaN(+x))
);

const wait500 = d.debounce(500);

typed.defType('__dateString', s => typed.isType('string', s) && s.match(DATESTR_REGEX));
typed.defType('__isoDateString', s => typed.isType('string', s) && s.match(VALID_DATE));

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

// extractDateParts :: ISODateString -> [Number]
// extractDateParts :: DateString -> [Number]
// extractDateParts :: Date -> [Number]
const extractDateParts = typed.Dispatcher([
  typed.guard('__isoDateString', str => {
    let timeSplitter = str.indexOf('T') === -1 ? ' ' : 'T';
    let dateSplitter = str.indexOf('-') >= 0 ? '-' : '/';
    let [date, time] = str.split(timeSplitter);
    let hr, min, sec, hasTZ;
    if (time) {
      let hasZ = time.indexOf('Z') !== -1;
      hasTZ = time.match(/[-+][01][0-9]:[0-5][0-9]/);
      if (hasZ && hasTZ) {
        throw new Error(`DateError: string ${str} contains both 'Z' and a timezone.`);
      }
      let timestr;
      switch(false) {
        case !hasZ:
          ([timestr] = time.split('Z'));
          break;
        case !hasTZ:
          ([timestr] = time.split(/[+-]/));
          break;
        default:
          timestr = time;
          break;
      }
      ([hr, min, sec] = timestr.split(':').map(x => +x));
    }
    let [first, second, third] = date.split(dateSplitter).map(x => +x);
    let [yr, mn, day] = first > 11 || third < 32 ? [first, second, third] : [third, second, first];
    let arr = [yr, mn - 1, day, hr, min, sec].map(x => x || 0);
    return arr;
    // return !hasTZ ?
    //   arr :
    //   (() => {
    //     let sign = hasTZ[0][0];
    //     let [hours, minutes] = hasTZ[0].slice(1, hasTZ[0].length).split(':');
    //     let tzMin = (+(sign + hours) * 60) + +(sign + minutes);
    //     return [_Date(...arr).getTime() - (tzMin * 60 * 1000)];
    //   })();
  }),
  typed.guard('__dateString', s => {
    let [
      ,
      month,
      dy,
      year,
      time,
      timezone
    ] = s.split(' ');
    let mon = MONTHS.indexOf(month);
    let day = +dy;
    let yr  = +year;
    let [hr, min, sec] = time ? time.split(':').map(x => +x) : [0,0,0];
    let tzOff = false;//s.match(/[-+][01][0-9][0-5][0-9]/);
    let arr = [yr, mon, day, hr, min, sec].map(x => x || 0);
    return !tzOff ?
      arr :
      (() => {
        let sign = tzOff[0][0];
        let rest = tzOff[0].slice(1, tzOff[0].length);
        let hours = rest.slice(0,2);
        let minutes = rest.slice(2,4);
        let tzMin = (+(sign + hours) * 60) + +(sign + minutes);
        return [_Date(...arr).getTime() - (tzMin * 60 * 1000)];
      })();
  }),
  typed.guard('date', d => {
    return [
      d.getFullYear(),
      d.getMonth(), //no +1
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
    ];
  })
]);

// dateify :: String   -> Date
// dateify :: Number   -> Date
// dateify :: Date     -> Date
// dateify :: [Number] -> Date
const dateify = typed.Dispatcher([
  typed.guard('string', s => _Date(...extractDateParts(s))),
  typed.guard('number', n => _Date(n)),
  typed.guard('date', d => d),
  typed.guard('__Array<Number>', arr => _Date(...arr))
]);

// deDateify :: Date -> ISODateString
// returns an ISO 8601 datestring with timezone
const deDateify = typed.guard('date', d => {
  let [yr, mn, dy, hr, min, sec] = extractDateParts(d);
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
  let [yr, mn, dy, hr, min, sec] = extractDateParts(date);
  return `${yr}-${_padInt(mn + 1)}-${_padInt(dy)}` +
    `T${_padInt(hr)}:${_padInt(min)}:${_padInt(sec)}Z`;
}

// order :: [Date] -> [Date]
// Returns an array of the passed-in Date objects in ascending chronological order.
const order = d.unGather((...args) => args.sort((a, b) => a.getTime() - b.getTime()));

export {
  toDateInput,
  toTimeInput,
  toPaperDate,
  toPaperTime,
  dateify,
  deDateify,
  isLeapYear,
  toUTCDateString,
  extractDateParts as destructure,
  order,
};
