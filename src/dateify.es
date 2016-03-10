/*
 *Dateify-js
 *@author jasmith79@gmail.com
 *@copyright Jared Adam Smith, 2016
 *Licensed under the MIT license. You should have received a copy with this software, otherwise see
 *https://opensource.org/licenses/MIT.
 *
 */

/*   Imports   */
import * as d from '../node_modules/decorators-js/dist/decorators.js';

//remove this stub later
let document = document || {
  createElement: function(){
    return {
      setAttribute: function(k, v) {
        this[k] = v;
      },
      pattern: true
    }
  }
};

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
];;

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
//type checks
const _takesString  = d.typeGuard('string');
const _takesDate    = d.typeGuard(Date);
const _dateOrString = d.typeGuard(['string', Date]);
const _takesFn      = d.typeGuard('function');
const _takesNum     = d.typeGuard('number');

//Has IE workaround for lack of function name property on Functions
//_getFnName :: (* -> *) -> String
const _getFnName = _takesFn(fn => {
  return fn.name || ((('' + fn).match(FN_NAME_REGEX) || [])[1] || 'Anonymous')
});

//padInt :: Number -> String
const _padInt = _takesNum(num => num > 9 ? '' + num : '0' + num);

//_makeDate :: Number -> Date
const _makeDate = d.unNew(0, Date);

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
    throw new Error('shouldnt see me')
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

//_parseDate :: Date -> [Number]
const _parseDate = _takesDate((date) => {
  return [
    date.getFullYear(),
    date.getMonth(), //no +1
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getTimezoneOffset()
  ];
});

//_parseDateString :: String -> [Number]
const _parseDateString = _takesString(str => {
  let yr, hr, min, sec, mon, day, tzOff, tz;
  let datestr = str.replace(/\//g, '-');
  let ISOdate = datestr.match(VALID_DATE);
  let ISOtime = datestr.match(VALID_TIME);
  switch (false) {
    case (!datestr.match(DATESTR_REGEX)):
      let [
        ,
        month,
        dy,
        year,
        time,
        timezone
      ] = datestr.split(' ');
      mon = MONTHS.indexOf(month);
      day = +dy;
      yr  = +yr;
      [hr, min, sec] = time ? time.split(':').map(x => +x) : [0,0,0];
      tzOff = timezone ? timezone.split('T')[1] : null;
      break;
    case (!(ISOdate && ISOtime)):
      let datepart   = ISOdate[0];
      [yr, mon, day] = datepart.split('-').map(x => +x);
      [hr, min, sec] = ISOtime[0]
        .match(/[0-2][0-9]:[0-5][0-9](?::[0-5][0-9])?/)[0]
        .split(':')
        .map(x => +x);
      tzOff = (ISOtime[0].match(/[-+][0-2][0-9]:[0-5][0-9]/) || [])[0];
      mon -= 1;
      break;
    case (!ISOdate):
      [yr, mon, day] = ISOdate[0].split('-').map(x => +x);
      mon -= 1;
      break;
    default:
      throw new Error(`Datestring ${datestr} format not recognized`);
      break;
  }
  tz = tzOff ?
    ((t) => {
      let sign = t[0] === '+' ? t[0] : '-';
      let rest = t.slice(1);
      let [hour, min] = rest.indexOf(':') === -1 ?
        [rest.slice(0,2), rest.slice(2,4)] :
        rest.split(':');
      return +(sign + hour) * 60 + +(sign + min); //IDKWTF js does tzoffsets in *minutes*
    })(tzOff) :
    0;
  return [yr, mon, day, hr, min, sec, tz].map(x => x || 0);
});

/*   Public Functions   */

//* :: HTMLElement -> HTMLElement
const toDateInput = _upgradeInput('input', 'date');
const toTimeInput = _upgradeInput('input', 'time');
const toPaperDate = _upgradeInput('paper-input', 'date');
const toPaperTime = _upgradeInput('paper-input', 'time');

//dateify :: String -> Date
const dateify = _takesString(str => {
  let args = _parseDateString(str);
  // if ((str.indexOf('Z') !== -1) || !args[args.length - 1]) {
  //   //return _makeDate(...args);
  //   return _makeDate(Date.UTC(...args));
  // } else {
  //   return _makeDate(...args);
  //   //return _makeDate(Date.UTC(...args));
  // }
  makeDate(...args);
});

//deDateify :: Date -> String
const deDateify = _takesDate(date => {
  return `${date.getFullYear()}-${_padInt(date.getMonth() + 1)}-${_padInt(date.getDate())}`;
});

//isLeapYear :: Number -> Boolean
const isLeapYear = ((err) => {
  return _takesNum(yr => {
    //check for the special years, see https://www.wwu.edu/skywise/leapyear.html
    if (yr === 0) {
      throw err;
    }
    //after 8 AD, follows 'normal' leap year rules
    let passed = true;
    //not technically true as there were 13 LY BCE, but hey.
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

//toUTCDate :: Date   -> Date
//toUTCDate :: String -> Date
//Converts javascript Date Object from browser's timezone to GMT. Somewhat idempotent: if you call
//this on a Date, serialize it, then pass it back to the function it will apply the offset twice.
const toUTCDate = d.typeGuard(['string', Date], day => {
  if (day._convertedToUTC) {
    return day;
  }
  let date = day instanceof Date ? day : dateify(day);
  let obj  = _makeDate(+date + (date.getTimezoneOffset() * 60000));
  obj._convertedToUTC = true; //need to make sure that we don't double-dip
  return obj
});

//toUTCDateString :: Date   -> String
//toUTCDateString :: String -> String
//Returns date string in UTC time ISO 8601 format - YYYY-MM-DDTHH:MM:SSZ
const toUTCDateString = d.typeGuard(['string', Date], day => {
  let date = toUTCDate(day);
  let str = deDateify(date);
  return `${str}T${_padInt(date.getHours())}:${_padInt(date.getMinutes())}:${_padInt(date.getSeconds())}Z`;
});

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
