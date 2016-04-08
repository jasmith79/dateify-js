(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', '../node_modules/decorators-js/dist/decorators.js'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('../node_modules/decorators-js/dist/decorators.js'));
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
  exports.order = exports.destructure = exports.toUTCDateString = exports.isLeapYear = exports.deDateify = exports.dateify = exports.toPaperTime = exports.toPaperDate = exports.toTimeInput = exports.toDateInput = undefined;

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

  function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }

      return arr2;
    } else {
      return Array.from(arr);
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

  /*   Constants   */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];;

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

  //matches Date::toString() and Date::toDateString()
  var DATESTR_REGEX = new RegExp([/[A-Z][a-z]{2} [A-Z][a-z]{2} [0-3][0-9] [0-9]{4}/, //date
  /(?: [0-9]{2}:[0-9]{2}:[0-9]{2} GMT[-+][0-2][0-9][0-5][0-9] \([A-Z]{3}\))?/ //time
  ].map(function (r) {
    return r.source;
  }).join(''), 'g');

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
  var DATE_TYPE_SUPPORTED = function () {
    var input = document.createElement('input');
    var notDate = 'not-a-date';
    input.setAttribute('type', 'date');
    input.setAttribute('value', notDate);
    return input.value !== notDate;
  }();

  /*   Private Functions   */
  //type checks
  var _takesString = d.typeGuard('string');
  var _takesDate = d.typeGuard(Date);
  var _dateOrString = d.typeGuard(['string', Date]);
  var _takesFn = d.typeGuard('function');
  var _takesNum = d.typeGuard('number');

  //Has IE workaround for lack of function name property on Functions
  //_getFnName :: (* -> *) -> String
  var _getFnName = _takesFn(function (fn) {
    return fn.name || (('' + fn).match(FN_NAME_REGEX) || [])[1] || 'Anonymous';
  });

  //padInt :: Number -> String
  var _padInt = d.padInt(2);

  //_makeDate :: Number -> Date
  var _makeDate = d.unNew(0, Date);

  var wait500 = d.debounce(500);

  //_upgradeInput :: String, String -> (HTMLElement -> HTMLElement)
  //_upgradeInput :: String, String -> (Null -> HTMLElement)
  var _upgradeInput = function (timeValidator, dateValidator) {
    return _takesString(function (tag, type) {
      return function (el) {
        var input = el || document.createElement(tag);
        if (!input.tagName.match(IS_INPUT)) {
          //works in IE 8+ and every browser I care about
          console.warn('Unable to verify function ' + _getFnName(fn) + ' called with input element.');
        }
        //right now date type is not supported in phantomjs so the tests all work, but if it starts
        //supporting date inputs we'll need to add a function to expose the custom stuff for testing.
        if (DATE_TYPE_SUPPORTED) {
          input.setAttribute('type', type);
        } else {
          (function () {
            input.setAttribute('pattern', type === 'date' ? VALID_DATE : VALID_TIME);
            input.DEFAULT = type === 'date' ? DATE_DEFAULT : TIME_DEFAULT;
            input.value = input.DEFAULT;
            var validfn = type === 'date' ? dateValidator : timeValidator;

            input.validate = function (fn) {
              var ctx = this;
              ctx.addEventListener('input', wait500(function (e) {
                ctx.valid = false;
                validfn.call(ctx, fn);
              }));
            };
            input.validate(function (e) {
              if (!this.value) {
                this.value = this.DEFAULT;
              }
            });
          })();
        }
        return input;
      };
    });
  }(function (fn) {
    var def = this.value.match(TIME_DEF_REGEX);
    var valid = def || this.value.match(VALID_TIME);
    if (!valid) {
      fn.call(this, this);
    } else {
      this.valid = true;
    }
  }, function (fn) {
    var def = this.value.match(DATE_DEF_REGEX);
    var valid = def || this.value.match(VALID_DATE);
    if (!valid) {
      fn.call(this, this);
    } else {
      this.valid = true;
    }
  });

  //destructure :: Date -> [Number]
  var destructure = _takesDate(function (date) {
    return [date.getFullYear(), date.getMonth(), //no +1
    date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];
  });

  /*   Public Functions   */

  //* :: HTMLElement -> HTMLElement
  var toDateInput = _upgradeInput('input', 'date');
  var toTimeInput = _upgradeInput('input', 'time');
  var toPaperDate = _upgradeInput('paper-input', 'date');
  var toPaperTime = _upgradeInput('paper-input', 'time');

  //dateify :: String -> Date
  var dateify = _takesString(function (str) {
    var yr = void 0,
        hr = void 0,
        min = void 0,
        sec = void 0,
        mon = void 0,
        day = void 0,
        tzOff = void 0,
        tz = void 0;
    var datestr = str.replace(/\//g, '-');
    var ISOdate = datestr.match(VALID_DATE);
    var ISOtime = datestr.match(VALID_TIME);
    switch (false) {
      case !datestr.match(DATESTR_REGEX):
        var _datestr$split = datestr.split(' ');

        var _datestr$split2 = _slicedToArray(_datestr$split, 6);

        var month = _datestr$split2[1];
        var dy = _datestr$split2[2];
        var year = _datestr$split2[3];
        var time = _datestr$split2[4];
        var timezone = _datestr$split2[5];

        mon = MONTHS.indexOf(month);
        day = +dy;
        yr = +year;

        var _ref = time ? time.split(':').map(function (x) {
          return +x;
        }) : [0, 0, 0];

        var _ref2 = _slicedToArray(_ref, 3);

        hr = _ref2[0];
        min = _ref2[1];
        sec = _ref2[2];

        tzOff = timezone ? timezone.match(/[A-Z]{3}([-+][0-9]{4})/)[1] : null;
        break;
      case !(ISOdate && ISOtime):
        var datepart = ISOdate[0];

        var _datepart$split$map = datepart.split('-').map(function (x) {
          return +x;
        });

        var _datepart$split$map2 = _slicedToArray(_datepart$split$map, 3);

        yr = _datepart$split$map2[0];
        mon = _datepart$split$map2[1];
        day = _datepart$split$map2[2];

        var _ISOtime$0$match$0$sp = ISOtime[0].match(/[0-2][0-9]:[0-5][0-9](?::[0-5][0-9])?/)[0].split(':').map(function (x) {
          return +x;
        });

        var _ISOtime$0$match$0$sp2 = _slicedToArray(_ISOtime$0$match$0$sp, 3);

        hr = _ISOtime$0$match$0$sp2[0];
        min = _ISOtime$0$match$0$sp2[1];
        sec = _ISOtime$0$match$0$sp2[2];

        tzOff = (ISOtime[0].match(/[-+][0-2][0-9]:[0-5][0-9]/) || [])[0];
        mon -= 1;
        break;
      case !ISOdate:
        var _ISOdate$0$split$map = ISOdate[0].split('-').map(function (x) {
          return +x;
        });

        var _ISOdate$0$split$map2 = _slicedToArray(_ISOdate$0$split$map, 3);

        yr = _ISOdate$0$split$map2[0];
        mon = _ISOdate$0$split$map2[1];
        day = _ISOdate$0$split$map2[2];

        mon -= 1;
        break;
      default:
        throw new Error('Datestring ' + datestr + ' format not recognized');
        break;
    }
    var tempD = _makeDate.apply(undefined, _toConsumableArray([yr, mon, day, hr, min, sec].map(function (x) {
      return x || 0;
    })));
    var n = tempD.getTime();
    tz = tzOff ? function (t) {
      var sign = t[0] === '+' ? t[0] : '-';
      var rest = t.slice(1);

      var _ref3 = rest.indexOf(':') === -1 ? [rest.slice(0, 2), rest.slice(2, 4)] : rest.split(':');

      var _ref4 = _slicedToArray(_ref3, 2);

      var hour = _ref4[0];
      var min = _ref4[1];

      return +(sign + hour) * 60 + +(sign + min); //IDKWTF js does tzoffsets in *minutes*
    }(tzOff) : 0;
    return _makeDate(n - tz * 60 * 1000);
  });

  //deDateify :: Date -> String
  var deDateify = _takesDate(function (date) {
    return date.getFullYear() + '-' + _padInt(date.getMonth() + 1) + '-' + _padInt(date.getDate());
  });

  //isLeapYear :: Number -> Boolean
  var isLeapYear = function (err) {
    return _takesNum(function (yr) {
      //check for the special years, see https://www.wwu.edu/skywise/leapyear.html
      if (yr === 0) {
        throw err;
      }
      //after 8 AD, follows 'normal' leap year rules
      var passed = true;
      //not technically true as there were 13 LY BCE, but hey.
      if (yr === 4 || yr < 0 || yr % 4) {
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
  }(new Error('Year zero does not exist, refers to 1 BCE'));

  //toUTCDateString :: Date   -> String
  //toUTCDateString :: String -> String
  //Returns date string in UTC time ISO 8601 format - YYYY-MM-DDTHH:MM:SSZ
  var toUTCDateString = _dateOrString(function (day) {
    var date = day instanceof Date ? _makeDate(day.getTime() + day.getTimezoneOffset() * 60 * 1000) : dateify(day);
    var str = deDateify(date);
    return str + ('T' + _padInt(date.getHours()) + ':' + _padInt(date.getMinutes()) + ':' + _padInt(date.getSeconds()) + 'Z');
  });

  //order :: [Date] -> [Date]
  //Returns an array of the passed-in Date objects in ascending chronological order.
  var order = d.unGather(function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return args.sort(function (a, b) {
      return a.getTime() - b.getTime();
    });
  });

  exports.toDateInput = toDateInput;
  exports.toTimeInput = toTimeInput;
  exports.toPaperDate = toPaperDate;
  exports.toPaperTime = toPaperTime;
  exports.dateify = dateify;
  exports.deDateify = deDateify;
  exports.isLeapYear = isLeapYear;
  exports.toUTCDateString = toUTCDateString;
  exports.destructure = destructure;
  exports.order = order;
});
