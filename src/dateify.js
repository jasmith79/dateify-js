/*
 *Dateify-js
 *@author jasmith79@gmail.com
 *@copyright Jared Adam Smith, 2016
 *Licensed under the MIT license. You should have received a copy with this software, otherwise see
 *https://opensource.org/licenses/MIT.
 *
 */

/*   Imports   */
import * as d from 'decorators';

/*   Constants   */

//none of the regexs are foolproof, but good enough for a quick and dirty check

//ISO 8601
const VALID_DATE     = /[0-9]{4}-[0-1][0-9]-[0-3][0-9]/;
const VALID_TIME     = /[0-2][0-9]:[0-5][0-9](?::[0-5][0-9])?[+-Z]?(?:[0-2][0-9]:[0-5][0-9])?/;

//ISO-conforming defaults
const DATE_DEF_REGEX = /^y{1,4}-?m{0,2}-?d{0,2}/i;
const TIME_DEF_REGEX = /^h{1,2}:?m{0,2}:?s{0,2}\s*[ap]?/i;
const DATE_DEFAULT   = 'yyyy-mm-dd';
const TIME_DEFAULT   = 'hh:mm';
const IS_INPUT       = /input/i;
const FN_NAME_REGEX  = /^\s*function\s*(\S*)\s*\(/;
const MERIDIAN       = /[ap]m/i;

//matches Date::toString() and Date::toDateString()
const DATESTR_REGEX  = new RegExp([
  /[A-Z][a-z]{2} [A-Z][a-z]{2} [0-3][0-9] [0-9]{4}/,                  //date
  /(?: [0-9]{2}:[0-9]{2}:[0-9]{2} GMT[-+][0-2][0-9][0-5][0-9] \([A-Z]{3}\))?/ //time
].map(r => r.source).join(''), 'g');

//See what we're dealing with in terms of browser support. Not entirely sure how good the
//pattern check is, but its the approach Modernizr takes so I'm assuming it works well enough.
const [DATE_TYPE_SUPPORTED, PATTERN_SUPPORTED] = (() => {
  let input = document.createElement('input');
  let notDate = 'not-a-date';
  input.setAttribute('type', 'date');
  input.setAttribute('value', notDate);
  return [input.value !== notDate, 'pattern' in input];
})();

/*   Private Functions   */

//Has IE workaround for lack of function name property on Functions
//_getFnName :: (* -> *) -> String
const _getFnName = fn => fn.name || ((('' + fn).match(FN_NAME_REGEX) || [])[1] || 'Anonymous');

//padInt :: Number -> String
const _padInt = num => num > 9 ? '' + num : '0' + num;

//makeDate :: Number -> Date
const makeDate = d.unNew(0, Date);

//makeUTCDate :: Number -> Date
const makeUTCDate = d.unNew(0, Date.UTC);

const wait500 = d.debounce(500);

//decorator for ensuring arg is an HTML input/paper-input
const _callWithTag = tag => {
  return fn => {
    return elem => {
      let el = elem == null ? document.createElement(tag) : elem;
      if (!(el instanceof HTMLElement)) {
        throw new TypeError(`Function ${_getFnName(fn)} called with invalid type ${typeof el}`);
      }
      if (!(elem.tagName.match(IS_INPUT))) {
        //works in IE 8+ and every browser I care about
        console.warn(`Unable to verify function ${_getFnName(fn)} called with input element.`);
      }
      return fn(el);
    };
  };
};
//_upgradeInput :: String, String -> (HTMLElement -> HTMLElement)
const _upgradeInput = (tag, type) => {
  let guard = _callWithTag(tag);
  return guard(input => {
    input.value = defValue;
    let valid, def, regex;
    switch (type) {
      case 'date':
        valid     = VALID_DATE;
        def       = DATE_DEFAULT;
        regex     = DATE_DEF_REGEX;
        break;
      case 'time':
        valid     = VALID_TIME;
        def       = TIME_DEFAULT;
        regex     = TIME_DEF_REGEX;
        break;
      default:
        throw new TypeError(`Unsupported type ${type} applied to input`);
    }
    switch (true) {
      case (DATE_TYPE_SUPPORTED):
        input.setAttribute('type', type);
        break;
      case (PATTERN_SUPPORTED):
        input.setAttribute('pattern', valid);
        break;
      default:
        input.addEventListener('change', wait500(e => {
          let value = e.currentTarget.value;
          //do validatey stuffs
        }));
        break;
    }
  });
};

/*   Public Functions   */

//* :: HTMLElement -> HTMLElement
const toDateInput = _upgradeInput('input', 'date');
const toTimeInput = _upgradeInput('input', 'time');
const toPaperDate = _upgradeInput('paper-input', 'date');
const toPaperTime = _upgradeInput('paper-input', 'time');

//dateify :: String -> Date
const dateify = d.typeGuard('string', str => {
  let datestr = str.replace(/\//g, '-');
  let jsDateStr = datestr.match(DATESTR_REGEX);
  if (jsDateStr) {
    return makeDate(jsDateStr);
  }

  let type, yr, hr, min, sec, mon, day, tzOff;
  let ISOdate   = datestr.match(VALID_DATE);
  let ISOtime   = datestr.match(VALID_TIME);
  switch (true) {
    case (ISOdate && ISOtime):
      let datepart   = ISOdate[0];
      [yr, mon, day] = datepart.split('-');
      [hr, min, sec] = ISOtime[0].split(':');
      tzOff = (ISOtime[0].match(/[-+][0-2][0-9]:[0-5][0-9]/) || [])[0];
      break;
    case (ISOdate):
      [yr, mon, day] = ISOdate[0].split('-');
      break;
    default:
      throw new Error(`Datestring ${datestr} format not recognized`);
      break;
  }
  let month = mon ? '' + (+mon + 1) : mon;
  let args = [yr, month, day, hr, min, sec].filter(x => x != null);
  if ((datestr.indexOf('Z') !== -1) || !tzOff) {
    return makeDate.apply(null, args);
  } else {
    return makeDate(makeUTCDate.apply(null, args));
  }
});

//deDateify :: Date -> String
const deDateify = d.typeGuard(Date, date => {
  return `${date.getFullYear()}-${_padInt(date.getMonth() + 1)}-${_padInt(date.getDate())}`;
});

//isLeapYear :: Number -> Boolean
const isLeapYear = d.typeGuard('number', year => {
  let passed = true, yr = +year;
  if (yr <= 0 || (yr % 4)) {
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

//toUTCDate :: Date   -> Date
//toUTCDate :: String -> Date
//Converts javascript Date Object from browser's timezone to GMT. Somewhat idempotent: if you call
//this on a Date, serialize it, then pass it back to the function it will apply the offset twice.
const toUTCDate = day => {
  if (day._convertedToUTC) {
    return date;
  }
  let date = day instanceof Date ? day : dateify(day);
  let obj  = makeDate(+date + (date.getTimezoneOffset() * 60000));
  obj._convertedToUTC = true; //need to make sure that we don't double-dip
  return obj
};

//toUTCDateString :: Date   -> String
//toUTCDateString :: String -> String
//Returns date string in UTC time ISO 8601 format - YYYY-MM-DDTHH:MM:SSZ
const toUTCDateString = day => {
  let date = toUTCDate(day);
  let str = deDateify(date);
  return `${str}T${_padInt(date.getHours())}:${_padInt(date.getMinutes())}:${_padInt(date.getSeconds())}Z`;
};

export {
  toDateInput,
  toTimeInput,
  toPaperDate,
  toPaperTime,
  dateify,
  deDateify,
  isLeapYear,
  toUTCDate,
  toUTCDateString,
};
