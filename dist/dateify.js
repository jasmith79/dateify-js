(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'decorators'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('decorators'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.decorators);
    global.dateify = mod.exports;
  }
})(this, function (exports, _decorators) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.toUTCDateString = exports.toUTCDate = exports.isLeapYear = exports.deDateify = exports.dateify = exports.toPaperTime = exports.toPaperDate = exports.toTimeInput = exports.toDateInput = undefined;

  var d = _interopRequireWildcard(_decorators);

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

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
  };

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

  /*   Constants   */

  //none of the regexs are foolproof, but good enough for a quick and dirty check

  //ISO 8601
  var VALID_DATE = /[0-9]{4}-[0-1][0-9]-[0-3][0-9]/;
  var VALID_TIME = /[0-2][0-9]:[0-5][0-9](?::[0-5][0-9])?[+-Z]?(?:[0-2][0-9]:[0-5][0-9])?/;

  //ISO-conforming defaults
  var DATE_DEF_REGEX = /^y{1,4}-?m{0,2}-?d{0,2}/i;
  var TIME_DEF_REGEX = /^h{1,2}:?m{0,2}:?s{0,2}\s*[ap]?/i;
  var DATE_DEFAULT = 'yyyy-mm-dd';
  var TIME_DEFAULT = 'hh:mm';
  var IS_INPUT = /input/i;
  var FN_NAME_REGEX = /^\s*function\s*(\S*)\s*\(/;
  var MERIDIAN = /[ap]m/i;

  //matches Date::toString() and Date::toDateString()
  var DATESTR_REGEX = new RegExp([/[A-Z][a-z]{2} [A-Z][a-z]{2} [0-3][0-9] [0-9]{4}/, //date
  /(?: [0-9]{2}:[0-9]{2}:[0-9]{2} GMT[-+][0-2][0-9][0-5][0-9] \([A-Z]{3}\))?/ //time
  ].map(function (r) {
    return r.source;
  }).join(''), 'g');

  //See what we're dealing with in terms of browser support. Not entirely sure how good the
  //pattern check is, but its the approach Modernizr takes so I'm assuming it works well enough.

  var _ref = function () {
    var input = document.createElement('input');
    var notDate = 'not-a-date';
    input.setAttribute('type', 'date');
    input.setAttribute('value', notDate);
    return [input.value !== notDate, 'pattern' in input];
  }();

  var _ref2 = _slicedToArray(_ref, 2);

  var DATE_TYPE_SUPPORTED = _ref2[0];
  var PATTERN_SUPPORTED = _ref2[1];


  /*   Private Functions   */

  //Has IE workaround for lack of function name property on Functions
  //_getFnName :: (* -> *) -> String
  var _getFnName = function _getFnName(fn) {
    return fn.name || (('' + fn).match(FN_NAME_REGEX) || [])[1] || 'Anonymous';
  };

  //padInt :: Number -> String
  var _padInt = function _padInt(num) {
    return num > 9 ? '' + num : '0' + num;
  };

  //makeDate :: Number -> Date
  var makeDate = d.unNew(0, Date);

  //makeUTCDate :: Number -> Date
  var makeUTCDate = d.unNew(0, Date.UTC);

  var wait500 = d.debounce(500);

  //decorator for ensuring arg is an HTML input/paper-input
  var _callWithTag = function _callWithTag(tag) {
    return function (fn) {
      return function (elem) {
        var el = elem == null ? document.createElement(tag) : elem;
        if (!(el instanceof HTMLElement)) {
          throw new TypeError('Function ' + _getFnName(fn) + ' called with invalid type ' + (typeof el === 'undefined' ? 'undefined' : _typeof(el)));
        }
        if (!elem.tagName.match(IS_INPUT)) {
          //works in IE 8+ and every browser I care about
          console.warn('Unable to verify function ' + _getFnName(fn) + ' called with input element.');
        }
        return fn(el);
      };
    };
  };
  //_upgradeInput :: String, String -> (HTMLElement -> HTMLElement)
  var _upgradeInput = function _upgradeInput(tag, type) {
    var guard = _callWithTag(tag);
    return guard(function (input) {
      input.value = defValue;
      var valid = undefined,
          def = undefined,
          regex = undefined;
      switch (type) {
        case 'date':
          valid = VALID_DATE;
          def = DATE_DEFAULT;
          regex = DATE_DEF_REGEX;
          break;
        case 'time':
          valid = VALID_TIME;
          def = TIME_DEFAULT;
          regex = TIME_DEF_REGEX;
          break;
        default:
          throw new TypeError('Unsupported type ' + type + ' applied to input');
      }
      switch (true) {
        case DATE_TYPE_SUPPORTED:
          input.setAttribute('type', type);
          break;
        case PATTERN_SUPPORTED:
          input.setAttribute('pattern', valid);
          break;
        default:
          input.addEventListener('change', wait500(function (e) {
            var value = e.currentTarget.value;
            //do validatey stuffs
          }));
          break;
      }
    });
  };

  /*   Public Functions   */

  //* :: HTMLElement -> HTMLElement
  var toDateInput = _upgradeInput('input', 'date');
  var toTimeInput = _upgradeInput('input', 'time');
  var toPaperDate = _upgradeInput('paper-input', 'date');
  var toPaperTime = _upgradeInput('paper-input', 'time');

  //dateify :: String -> Date
  var dateify = d.typeGuard('string', function (str) {
    var datestr = str.replace(/\//g, '-');
    var jsDateStr = datestr.match(DATESTR_REGEX);
    if (jsDateStr) {
      return makeDate(jsDateStr);
    }

    var type = undefined,
        yr = undefined,
        hr = undefined,
        min = undefined,
        sec = undefined,
        mon = undefined,
        day = undefined,
        tzOff = undefined;
    var ISOdate = datestr.match(VALID_DATE);
    var ISOtime = datestr.match(VALID_TIME);
    switch (true) {
      case ISOdate && ISOtime:
        var datepart = ISOdate[0];

        var _datepart$split = datepart.split('-');

        var _datepart$split2 = _slicedToArray(_datepart$split, 3);

        yr = _datepart$split2[0];
        mon = _datepart$split2[1];
        day = _datepart$split2[2];

        var _ISOtime$0$split = ISOtime[0].split(':');

        var _ISOtime$0$split2 = _slicedToArray(_ISOtime$0$split, 3);

        hr = _ISOtime$0$split2[0];
        min = _ISOtime$0$split2[1];
        sec = _ISOtime$0$split2[2];

        tzOff = (ISOtime[0].match(/[-+][0-2][0-9]:[0-5][0-9]/) || [])[0];
        break;
      case ISOdate:
        var _ISOdate$0$split = ISOdate[0].split('-');

        var _ISOdate$0$split2 = _slicedToArray(_ISOdate$0$split, 3);

        yr = _ISOdate$0$split2[0];
        mon = _ISOdate$0$split2[1];
        day = _ISOdate$0$split2[2];

        break;
      default:
        throw new Error('Datestring ' + datestr + ' format not recognized');
        break;
    }
    var month = mon ? '' + (+mon + 1) : mon;
    var args = [yr, month, day, hr, min, sec].filter(function (x) {
      return x != null;
    });
    if (datestr.indexOf('Z') !== -1 || !tzOff) {
      return makeDate.apply(null, args);
    } else {
      return makeDate(makeUTCDate.apply(null, args));
    }
  });

  //deDateify :: Date -> String
  var deDateify = d.typeGuard(Date, function (date) {
    return date.getFullYear() + '-' + _padInt(date.getMonth() + 1) + '-' + _padInt(date.getDate());
  });

  //isLeapYear :: Number -> Boolean
  var isLeapYear = d.typeGuard('number', function (year) {
    var passed = true,
        yr = +year;
    if (yr <= 0 || yr % 4) {
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
  var toUTCDate = function toUTCDate(day) {
    if (day._convertedToUTC) {
      return date;
    }
    var date = day instanceof Date ? day : dateify(day);
    var obj = makeDate(+date + date.getTimezoneOffset() * 60000);
    obj._convertedToUTC = true; //need to make sure that we don't double-dip
    return obj;
  };

  //toUTCDateString :: Date   -> String
  //toUTCDateString :: String -> String
  //Returns date string in UTC time ISO 8601 format - YYYY-MM-DDTHH:MM:SSZ
  var toUTCDateString = function toUTCDateString(day) {
    var date = toUTCDate(day);
    var str = deDateify(date);
    return str + 'T' + _padInt(date.getHours()) + ':' + _padInt(date.getMinutes()) + ':' + _padInt(date.getSeconds()) + 'Z';
  };

  exports.toDateInput = toDateInput;
  exports.toTimeInput = toTimeInput;
  exports.toPaperDate = toPaperDate;
  exports.toPaperTime = toPaperTime;
  exports.dateify = dateify;
  exports.deDateify = deDateify;
  exports.isLeapYear = isLeapYear;
  exports.toUTCDate = toUTCDate;
  exports.toUTCDateString = toUTCDateString;
});
