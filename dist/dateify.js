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
  exports.toInputDateString = exports.isValidTime = exports.isValidDate = exports.inRange = exports.order = exports.destructure = exports.toUTCDateString = exports.isLeapYear = exports.deDateify = exports.dateify = exports.toPaperTime = exports.toPaperDate = exports.toTimeInput = exports.toDateInput = undefined;

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

  /*   Polyfills  */
  if (typeof Number.isNaN !== 'function') {
    Number.isNaN = function (x) {
      return x !== x;
    };
  }

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
    if (typeof document === 'undefined') {
      return false;
    } else {
      var input = document.createElement('input');
      var notDate = 'not-a-date';
      input.setAttribute('type', 'date');
      input.setAttribute('value', notDate);
      return input.value !== notDate;
    }
  }();

  var _padInt = d.padInt(2);
  var _Date = typed.guardClass(0, Date);
  var wait500 = d.debounce(500);

  typed.defType('__dateString', function (s) {
    return typed.isType('string', s) && s.match(DATESTR_REGEX);
  });
  typed.defType('__isoDateString', function (s) {
    return typed.isType('string', s) && s.match(VALID_DATE);
  });
  typed.defType('__Array<Number>', function (arr) {
    return typed.isType('array', arr) && arr.every(function (x) {
      return !Number.isNaN(+x);
    });
  });

  // returns [yr, mn, dy, hr, min, sec] in *local* time for the executing JS environment.
  // NOTE: months are 0-11.
  var destructure = typed.Dispatcher([typed.guard('date', function (d) {
    return Number.isNaN(d.getTime()) ? [] : [d.getFullYear(), d.getMonth(), //no +1
    d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()];
  }), typed.guard('__dateString', function (s) {
    var d = new Date(s);
    return Number.isNaN(d.getTime()) ? [] : [d.getFullYear(), d.getMonth(), //no +1
    d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()];
  }), typed.guard('string', function (s) {
    var result = [];
    var dateTimeSplitter = s.indexOf('T') === -1 ? ' ' : 'T';
    var dateSplitter = s.indexOf('-') === -1 ? '/' : '-';

    var _s$split = s.split(dateTimeSplitter);

    var _s$split2 = _slicedToArray(_s$split, 2);

    var date = _s$split2[0];
    var t = _s$split2[1];

    var dateArr = date.split(dateSplitter).map(Number);

    // valid dates must have day/month/yr and there is no year 0.
    var validDate = dateArr.length === 3 && dateArr.every(function (n) {
      return n > 0;
    });

    if (validDate) {
      var _dateArr = _slicedToArray(dateArr, 3);

      var first = _dateArr[0];
      var second = _dateArr[1];
      var third = _dateArr[2];

      var yr = void 0,
          mn = void 0,
          dy = void 0;

      switch (true) {
        case first > 31:
          if (second < 13) {
            var _dateArr2 = _slicedToArray(dateArr, 3);

            yr = _dateArr2[0];
            mn = _dateArr2[1];
            dy = _dateArr2[2];
          } else {
            var _dateArr3 = _slicedToArray(dateArr, 3);

            yr = _dateArr3[0];
            dy = _dateArr3[1];
            mn = _dateArr3[2];
          }

          mn -= 1;
          break;

        case third > 31:
          if (first < 13) {
            var _dateArr4 = _slicedToArray(dateArr, 3);

            mn = _dateArr4[0];
            dy = _dateArr4[1];
            yr = _dateArr4[2];
          } else {
            var _dateArr5 = _slicedToArray(dateArr, 3);

            dy = _dateArr5[0];
            mn = _dateArr5[1];
            yr = _dateArr5[2];
          }

          mn -= 1;
          break;

        default:
          dy = mn = yr = null;
          break;
      }

      result.push(yr, mn, dy);
    } else {
      t = date;
      result.push(null, null, null);
    }

    var tzSplitter = null;
    if (t) {
      tzSplitter = function (t) {
        var hasZ = t.indexOf('Z') !== -1;
        var hasPlus = t.indexOf('+') !== -1;
        var hasDash = t.indexOf('-') !== -1;
        var splitters = [hasZ, hasDash, hasPlus].reduce(function (acc, bool, i) {
          if (bool) {
            acc.push(i);
          }
          return acc;
        }, []);

        switch (splitters.length) {
          case 0:
            return null;
          case 1:
            return ['Z', '-', '+'][splitters[0]];
          default:
            throw new Error('Attempted to parse a datestring with both a \'Z\' and\n              a timezone.');
        }
      }(t);
    }

    var _ref = tzSplitter ? t.split(tzSplitter) : [t, null];

    var _ref2 = _slicedToArray(_ref, 2);

    var time = _ref2[0];
    var tz = _ref2[1];

    var timeArr = time ? time.split(':').map(Number) : [];
    var tzOff = tz ? function () {
      // in ms
      var sign = tzSplitter;

      var _tz$split = tz.split(':');

      var _tz$split2 = _slicedToArray(_tz$split, 2);

      var hours = _tz$split2[0];
      var minutes = _tz$split2[1];

      return (Number('' + sign + hours) * 60 + Number('' + sign + minutes)) * 60 * 1000;
    }() : null;

    var _timeArr = _slicedToArray(timeArr, 3);

    var hrs = _timeArr[0];
    var min = _timeArr[1];
    var sec = _timeArr[2];

    var validTime = hrs >= 0 && hrs <= 24 && min >= 0 && min <= 59 && (sec == null || sec >= 0 && sec <= 59);

    if (validTime) {
      result.push(hrs, min);
      if (sec != null) {
        result.push(sec);
      }
    }

    if (result[0] && tzSplitter != null) {
      var tempDate = _Date.apply(undefined, result);
      var localOffset = tempDate.getTimezoneOffset() * 60 * 1000;
      var adjustedTime = tempDate.getTime() - localOffset - tzOff;
      return destructure(_Date(adjustedTime));
    } else if (result.every(function (x) {
      return x == null;
    })) {
      return [];
    } else {
      return result;
    }
  })]);

  var _isValidDate = function _isValidDate(a) {
    var arr = destructure(a);
    return arr.length > 2 ? arr.slice(0, 3).every(function (n) {
      return typed.isType('number', n);
    }) : false;
  };

  var _isValidTime = function _isValidTime(a) {
    var arr = destructure(a);
    return arr.length > 4 ? arr.slice(3, 5).every(function (n) {
      return typed.isType('number', n);
    }) : false;
  };

  var isValidDate = typed.Dispatcher([typed.guard('date', function (d) {
    return _isValidDate(d);
  }), typed.guard('string', function (s) {
    return _isValidDate(s);
  })]);

  isValidDate.setDefault(function (x) {
    return false;
  });

  var isValidTime = typed.Dispatcher([typed.guard('date', function (d) {
    return _isValidTime(d);
  }), typed.guard('string', function (s) {
    return _isValidTime(s);
  }), typed.guard('number', function (n) {
    return !Number.isNaN(n);
  })]);

  isValidTime.setDefault(function (x) {
    return false;
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

  // dateify :: String   -> Date
  // dateify :: Number   -> Date
  // dateify :: Date     -> Date
  // dateify :: [Number] -> Date
  var dateify = typed.Dispatcher([typed.guard('string', function (s) {
    var parsed = destructure(s);
    if (!parsed.length) {
      console.warn('Attempted to parse non-date string ' + s + ' as a date');
      return new Date(''); // invalid date
    }
    return _Date.apply(undefined, _toConsumableArray(parsed));
  }), typed.guard('number', function (n) {
    return _Date(n);
  }), typed.guard('date', function (d) {
    return d;
  }), typed.guard('__Array<Number>', function (arr) {
    return _Date.apply(undefined, _toConsumableArray(arr));
  })]);

  // deDateify :: Date -> ISODateString
  // returns an ISO 8601 datestring with timezone
  var deDateify = typed.guard('date', function (d) {
    var _destructure = destructure(d);

    var _destructure2 = _slicedToArray(_destructure, 6);

    var yr = _destructure2[0];
    var mn = _destructure2[1];
    var dy = _destructure2[2];
    var hr = _destructure2[3];
    var min = _destructure2[4];
    var sec = _destructure2[5];

    var tz = d.getTimezoneOffset();
    var sign = tz > 0 ? '-' : '+';
    var hrs = tz / 60 | 0;
    var mins = tz % 60;
    return yr + '-' + _padInt(mn + 1) + '-' + _padInt(dy) + 'T' + _padInt(hr) + ':' + _padInt(min) + ':' + _padInt(sec) + ('' + sign + _padInt(hrs) + ':' + _padInt(mins));
  });

  // isLeapYear :: Number -> Boolean
  var isLeapYear = function (err) {
    return typed.guard('number', function (yr) {
      // check for the special years, see https://www.wwu.edu/skywise/leapyear.html
      if (yr === 0) {
        throw err;
      }
      // after 8 AD, follows 'normal' leap year rules
      var passed = true;
      // not technically true as there were 13 LY BCE, but hey.
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

  // toUTCDateString :: Date   -> ISODateString
  // toUTCDateString :: String -> ISODateString
  // Returns date string in UTC time ISO 8601 format - YYYY-MM-DDTHH:MM:SSZ
  var toUTCDateString = function toUTCDateString(arg) {
    var d = dateify(arg);
    var date = new Date(d.getTime() + d.getTimezoneOffset() * 60 * 1000);

    var _destructure3 = destructure(date);

    var _destructure4 = _slicedToArray(_destructure3, 6);

    var yr = _destructure4[0];
    var mn = _destructure4[1];
    var dy = _destructure4[2];
    var hr = _destructure4[3];
    var min = _destructure4[4];
    var sec = _destructure4[5];

    return yr + '-' + _padInt(mn + 1) + '-' + _padInt(dy) + ('T' + _padInt(hr) + ':' + _padInt(min) + ':' + _padInt(sec) + 'Z');
  };

  // order :: [Date] -> [Date]
  // Returns an array of the passed-in Date objects in ascending chronological order.
  var order = d.unGather(function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return args.sort(function (a, b) {
      return a.getTime() - b.getTime();
    });
  });

  // inRange :: Date -> Date -> Date -> Boolean
  // Returns whether the date is in the given range, inclusive.
  var inRange = typed.guard(['date', 'date', 'date'], function (a, b, test) {
    var _order = order(a, b);

    var _order2 = _slicedToArray(_order, 2);

    var start = _order2[0];
    var end = _order2[1];

    var x = start.getTime();
    var y = end.getTime();
    var z = test.getTime();
    return z <= y && z >= x;
  });

  var _toDateInputString = typed.guard('date', function (d) {
    return d.getFullYear() + '-' + _padInt(d.getMonth() + 1) + '-' + _padInt(d.getDate());
  });

  // toInputDateString :: Date -> String
  // toInputDateString :: String -> String
  var toInputDateString = typed.Dispatcher([_toDateInputString, typed.guard('string', function (s) {
    return _toDateInputString(dateify(s));
  })]);

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
  exports.inRange = inRange;
  exports.isValidDate = isValidDate;
  exports.isValidTime = isValidTime;
  exports.toInputDateString = toInputDateString;
});
