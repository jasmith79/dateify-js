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
  // const _takesString  = d.typeGuard('string');
  // const _takesDate    = d.typeGuard(Date);
  // const _dateOrString = d.typeGuard(['string', Date]);
  // const _takesFn      = d.typeGuard('function');
  // const _takesNum     = d.typeGuard('number');

  //Has IE workaround for lack of function name property on Functions
  //_getFnName :: (* -> *) -> String
  var _getFnName = typed.guard('function', function (fn) {
    return fn.name || (('' + fn).match(FN_NAME_REGEX) || [])[1] || 'Anonymous';
  });

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

  // typed.defType('__inputTagName', s => s.match(/input/i));
  // typed.defType(
  //   '__HTMLElement',
  //   el => el && el.constructor && el.constructor.name.match(/HTML.*Element/)
  // );
  // const _makeTag = typed.Dispatcher([
  //   typed.guard('__inputTagName', s => document.createElement(s)),
  //   typed.guard('__HTMLElement', el => el)
  // ]);

  var _upgradeInput = typed.guard(function (type, input) {

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

  // //_upgradeInput :: String, String -> (HTMLElement -> HTMLElement)
  // //_upgradeInput :: String, String -> (Null -> HTMLElement)
  // const _upgradeInput = ((timeValidator, dateValidator) => {
  //   return _takesString((tag, type) => {
  //     return el => {
  //       let input = el || document.createElement(tag);
  //       if (!input.tagName.match(IS_INPUT)) {
  //         //works in IE 8+ and every browser I care about
  //         console.warn(`Unable to verify function ${_getFnName(fn)} called with input element.`)
  //       }
  //       //right now date type is not supported in phantomjs so the tests all work, but if it starts
  //       //supporting date inputs we'll need to add a function to expose the custom stuff for testing.
  //       if (DATE_TYPE_SUPPORTED) {
  //         input.setAttribute('type', type);
  //       } else {
  //         input.setAttribute('pattern', type === 'date' ? VALID_DATE : VALID_TIME);
  //         input.DEFAULT = type === 'date' ? DATE_DEFAULT : TIME_DEFAULT;
  //         input.value = input.DEFAULT;
  //         let validfn = type === 'date' ? dateValidator : timeValidator;
  //
  //         input.validate = function(fn) {
  //           let ctx = this;
  //           ctx.addEventListener('input', wait500((e) => {
  //             ctx.valid = false;
  //             validfn.call(ctx, fn);
  //           }));
  //         };
  //         input.validate(function(e) {
  //           if (!this.value) {
  //             this.value = this.DEFAULT;
  //           }
  //         });
  //       }
  //       return input;
  //     };
  //   })
  // })(function(fn) {
  //   let def = this.value.match(TIME_DEF_REGEX);
  //   let valid = def || this.value.match(VALID_TIME);
  //   if (!valid) {
  //     fn.call(this, this);
  //   } else {
  //     this.valid = true;
  //   }
  // }, function(fn) {
  //   let def = this.value.match(DATE_DEF_REGEX);
  //   let valid = def || this.value.match(VALID_DATE);
  //   if (!valid) {
  //     fn.call(this, this);
  //   } else {
  //     this.valid = true;
  //   }
  // });

  //destructureDate :: Date -> [Number]
  // const destructureDate = typed.guard('date', date => {
  //   return [
  //     date.getFullYear(),
  //     date.getMonth(), //no +1
  //     date.getDate(),
  //     date.getHours(),
  //     date.getMinutes(),
  //     date.getSeconds(),
  //   ];
  // });

  //destructureDateString :: String -> [Number]
  // const destructureDateString = typed.guard('__isoDateString', str => {
  //   let splitter = str.indexOf('-') >= 0 ? '-' : '/';
  //   let [first, second, third] = str.split(splitter).map(x => +x);
  //   let [yr, mn, day] = first > 11 || third < 32 ? [first, second, third] : [third, second, first];
  //   return [yr, mn, day];
  // });

  /*   Public Functions   */

  //* :: HTMLElement -> HTMLElement
  // const toDateInput = _upgradeInput('input', 'date');
  // const toTimeInput = _upgradeInput('input', 'time');
  // const toPaperDate = _upgradeInput('paper-input', 'date');
  // const toPaperTime = _upgradeInput('paper-input', 'time');

  //dateify :: String -> Date
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
      switch (true) {
        case hasZ:
          var _time$split = time.split('Z');

          var _time$split2 = _slicedToArray(_time$split, 1);

          timestr = _time$split2[0];

          break;
        case hasTZ:
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

      var _hasTZ$0$slice$split = hasTZ[0].slice(1, hasTZ.length).split(':');

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

    // let tzOff = timezone ? timezone.match(/[A-Z]{3}([-+][0-9]{4})/)[1] : null;
    return [yr, mon, day, hr, min, sec].map(function (x) {
      return x || 0;
    });
  }), typed.guard('date', function (d) {
    return [d.getFullYear(), d.getMonth(), //no +1
    d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()];
  })]);

  var dateify = typed.Dispatcher([typed.guard('string', function (s) {
    return _Date.apply(undefined, _toConsumableArray(extractDateParts(s)));
  }), typed.guard('number', function (n) {
    return _Date(n);
  }), typed.guard('date', function (d) {
    return d;
  }), typed.guard('__Array<Number>', function (arr) {
    return _Date.apply(undefined, _toConsumableArray(arr));
  })]);
  // const dateify = _takesString(str => {
  //   let yr, hr, min, sec, mon, day, tzOff, tz;
  //   let datestr = str.replace(/\//g, '-');
  //   let ISOdate = datestr.match(VALID_DATE);
  //   let ISOtime = datestr.match(VALID_TIME);
  //   switch (false) {
  //     case (!datestr.match(DATESTR_REGEX)):
  //       let [
  //         ,
  //         month,
  //         dy,
  //         year,
  //         time,
  //         timezone
  //       ] = datestr.split(' ');
  //       mon = MONTHS.indexOf(month);
  //       day = +dy;
  //       yr  = +year;
  //       [hr, min, sec] = time ? time.split(':').map(x => +x) : [0,0,0];
  //       tzOff = timezone ? timezone.match(/[A-Z]{3}([-+][0-9]{4})/)[1] : null;
  //       break;
  //     case (!(ISOdate && ISOtime)):
  //       let datepart   = ISOdate[0];
  //       [yr, mon, day] = destructureDateString(datepart);
  //       [hr, min, sec] = ISOtime[0]
  //         .match(/[0-2][0-9]:[0-5][0-9](?::[0-5][0-9])?/)[0]
  //         .split(':')
  //         .map(x => +x);
  //       tzOff = (ISOtime[0].match(/[-+][0-2][0-9]:[0-5][0-9]/) || [])[0];
  //       mon -= 1;
  //       break;
  //     case (!ISOdate):
  //       [yr, mon, day] = destructureDateString(ISOdate[0]);
  //       mon -= 1;
  //       break;
  //     default:
  //       throw new Error(`Datestring ${datestr}: format not recognized`);
  //       break;
  //   }
  //   let tempD = _makeDate(...[yr, mon, day, hr, min, sec].map(x => x || 0));
  //   let n = tempD.getTime();
  //   tz = tzOff ?
  //     ((t) => {
  //       let sign = t[0] === '+' ? t[0] : '-';
  //       let rest = t.slice(1);
  //       let [hour, min] = rest.indexOf(':') === -1 ?
  //         [rest.slice(0,2), rest.slice(2,4)] :
  //         rest.split(':');
  //       return +(sign + hour) * 60 + +(sign + min); //IDKWTF js does tzoffsets in *minutes*
  //     })(tzOff) :
  //     0;
  //   return _makeDate(n - (tz * 60 * 1000));
  // });

  //deDateify :: Date -> String
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
    var date = dateify(arg);
    var str = deDateify(date);
    return str + ('T' + _padInt(date.getHours()) + ':' + _padInt(date.getMinutes()) + ':' + _padInt(date.getSeconds()) + 'Z');
  };
  // const toUTCDateString = _dateOrString(day => {
  //   let date = day instanceof Date ?
  //     _makeDate(day.getTime() + (day.getTimezoneOffset() * 60 * 1000)) :
  //     dateify(day);
  //   let str = deDateify(date);
  //   return str +
  //     `T${_padInt(date.getHours())}:${_padInt(date.getMinutes())}:${_padInt(date.getSeconds())}Z`;
  // });

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
