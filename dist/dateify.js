(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'decorators-js', 'js-typed'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('decorators-js'), require('js-typed'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.decoratorsJs, global.jsTyped);
    global.dateify = mod.exports;
  }
})(this, function (exports, _decoratorsJs, _jsTyped) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.order = exports.destructure = exports.toUTCDateString = exports.isLeapYear = exports.deDateify = exports.dateify = exports.toPaperTime = exports.toPaperDate = exports.toTimeInput = exports.toDateInput = undefined;

  var d = _interopRequireWildcard(_decoratorsJs);

  var typed = _interopRequireWildcard(_jsTyped);

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
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  //none of the regexs are foolproof, but good enough for a quick and dirty check

  //ISO 8601
  var VALID_DATE = /(?:[0-9]{4}[-\/][0-1][0-9][-\/][0-3][0-9])|(?:[0-1][0-9][-\/][0-3][0-9][-\/][0-9]{4})/;
  var VALID_TIME = /[0-2][0-9]:[0-5][0-9](?::[0-5][0-9])?[+-Z]?(?:[0-2][0-9]:[0-5][0-9])?/;

  //ISO-conforming defaults
  var DATE_DEF_REGEX = /^y{1,4}-?m{0,2}-?d{0,2}/i;
  var TIME_DEF_REGEX = /^h{1,2}:?m{0,2}:?s{0,2}\s*[ap]?/i;
  var DATE_DEFAULT = 'yyyy-mm-dd';
  var TIME_DEFAULT = 'hh:mm';
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

  // padInt :: Number -> String
  var _padInt = d.padInt(2);

  //_makeDate :: Number -> Date
  // const _makeDate = d.unNew(0, Date);
  var _Date = typed.guardClass(0, Date);
  typed.defType('__Array<Number>', function (arr) {
    return typed.isType('array', arr) && arr.every(function (x) {
      return !Number.isNaN(+x);
    });
  });

  var wait500 = d.debounce(500);

  typed.defType('__dateString', function (s) {
    return typed.isType('string', s) && s.match(DATESTR_REGEX);
  });
  typed.defType('__isoDateString', function (s) {
    return typed.isType('string', s) && s.match(VALID_DATE);
  });

  // _upgradeInput :: String -> HTMLInputElement -> HTMLInputElement
  var _upgradeInput = function (timeValidator, dateValidator) {
    return typed.guard(function (type, input) {

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

  // _defaultTag :: String -> Maybe HTMLElement -> HTMLElement
  var _defaultTag = function _defaultTag(tag) {
    return function (el) {
      return el || document.createElement(tag);
    };
  };
  var _ensureInput = _defaultTag('input');
  var _ensurePaper = _defaultTag('paper-input');
  var _upDate = _upgradeInput('date');
  var _upTime = _upgradeInput('time');
  var toDateInput = function toDateInput(arg) {
    return _upDate(_ensureInput(arg));
  };
  var toTimeInput = function toTimeInput(arg) {
    return _upTime(_ensureInput(arg));
  };
  var toPaperDate = function toPaperDate(arg) {
    return _upDate(_ensurePaper(arg));
  };
  var toPaperTime = function toPaperTime(arg) {
    return _upTime(_ensurePaper(arg));
  };

  // extractDateParts :: ISODateString -> [Number]
  // extractDateParts :: DateString -> [Number]
  // extractDateParts :: Date -> [Number]
  var extractDateParts = typed.Dispatcher([typed.guard('__isoDateString', function (str) {
    var timeSplitter = str.indexOf('T') === -1 ? ' ' : 'T';
    var dateSplitter = str.indexOf('-') >= 0 ? '-' : '/';

    var _str$split = str.split(timeSplitter);

    var _str$split2 = _slicedToArray(_str$split, 2);

    var date = _str$split2[0];
    var time = _str$split2[1];

    var hr = void 0,
        min = void 0,
        sec = void 0,
        hasTZ = void 0;
    if (time) {
      var hasZ = time.indexOf('Z') !== -1;
      hasTZ = time.match(/[-+][01][0-9]:[0-5][0-9]/);
      if (hasZ && hasTZ) {
        throw new Error('DateError: string ' + str + ' contains both \'Z\' and a timezone.');
      }
      var timestr = void 0;
      switch (false) {
        case !hasZ:
          var _time$split = time.split('Z');

          var _time$split2 = _slicedToArray(_time$split, 1);

          timestr = _time$split2[0];

          break;
        case !hasTZ:
          var _time$split3 = time.split(/[+-]/);

          var _time$split4 = _slicedToArray(_time$split3, 1);

          timestr = _time$split4[0];

          break;
        default:
          timestr = time;
          break;
      }

      var _timestr$split$map = timestr.split(':').map(function (x) {
        return +x;
      });

      var _timestr$split$map2 = _slicedToArray(_timestr$split$map, 3);

      hr = _timestr$split$map2[0];
      min = _timestr$split$map2[1];
      sec = _timestr$split$map2[2];
    }

    var _date$split$map = date.split(dateSplitter).map(function (x) {
      return +x;
    });

    var _date$split$map2 = _slicedToArray(_date$split$map, 3);

    var first = _date$split$map2[0];
    var second = _date$split$map2[1];
    var third = _date$split$map2[2];

    var _ref = first > 11 || third < 32 ? [first, second, third] : [third, second, first];

    var _ref2 = _slicedToArray(_ref, 3);

    var yr = _ref2[0];
    var mn = _ref2[1];
    var day = _ref2[2];

    var arr = [yr, mn - 1, day, hr, min, sec].map(function (x) {
      return x || 0;
    });
    return !hasTZ ? arr : function () {
      var sign = hasTZ[0][0];

      var _hasTZ$0$slice$split = hasTZ[0].slice(1, hasTZ[0].length).split(':');

      var _hasTZ$0$slice$split2 = _slicedToArray(_hasTZ$0$slice$split, 2);

      var hours = _hasTZ$0$slice$split2[0];
      var minutes = _hasTZ$0$slice$split2[1];

      var tzMin = +(sign + hours) * 60 + +(sign + minutes);
      return [_Date.apply(undefined, _toConsumableArray(arr)).getTime() - tzMin * 60 * 1000];
    }();
  }), typed.guard('__dateString', function (s) {
    var _s$split = s.split(' ');

    var _s$split2 = _slicedToArray(_s$split, 6);

    var month = _s$split2[1];
    var dy = _s$split2[2];
    var year = _s$split2[3];
    var time = _s$split2[4];
    var timezone = _s$split2[5];

    var mon = MONTHS.indexOf(month);
    var day = +dy;
    var yr = +year;

    var _ref3 = time ? time.split(':').map(function (x) {
      return +x;
    }) : [0, 0, 0];

    var _ref4 = _slicedToArray(_ref3, 3);

    var hr = _ref4[0];
    var min = _ref4[1];
    var sec = _ref4[2];

    var tzOff = s.match(/[-+][01][0-9][0-5][0-9]/);
    var arr = [yr, mon, day, hr, min, sec].map(function (x) {
      return x || 0;
    });
    return !tzOff ? arr : function () {
      var sign = tzOff[0][0];
      var rest = tzOff[0].slice(1, tzOff[0].length);
      var hours = rest.slice(0, 2);
      var minutes = rest.slice(2, 4);
      var tzMin = +(sign + hours) * 60 + +(sign + minutes);
      return [_Date.apply(undefined, _toConsumableArray(arr)).getTime() - tzMin * 60 * 1000];
    }();
  }), typed.guard('date', function (d) {
    return [d.getFullYear(), d.getMonth(), //no +1
    d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()];
  })]);

  // dateify :: String   -> Date
  // dateify :: Number   -> Date
  // dateify :: Date     -> Date
  // dateify :: [Number] -> Date
  var dateify = typed.Dispatcher([typed.guard('string', function (s) {
    return _Date.apply(undefined, _toConsumableArray(extractDateParts(s)));
  }), typed.guard('number', function (n) {
    return _Date(n);
  }), typed.guard('date', function (d) {
    return d;
  }), typed.guard('__Array<Number>', function (arr) {
    return _Date.apply(undefined, _toConsumableArray(arr));
  })]);

  //deDateify :: Date -> ISODateString
  var deDateify = typed.guard('date', function (date) {
    return date.getFullYear() + '-' + _padInt(date.getMonth() + 1) + '-' + _padInt(date.getDate());
  });

  //isLeapYear :: Number -> Boolean
  var isLeapYear = function (err) {
    return typed.guard('number', function (yr) {
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
  var toUTCDateString = function toUTCDateString(arg) {
    var d = dateify(arg);
    var date = new Date(d.getTime() + d.getTimezoneOffset() * 60 * 1000);
    var str = deDateify(date);
    return str + ('T' + _padInt(date.getHours()) + ':' + _padInt(date.getMinutes()) + ':' + _padInt(date.getSeconds()) + 'Z');
  };

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
  exports.destructure = extractDateParts;
  exports.order = order;
});
