#Dateify-js

###Lightweight date and time library for JavaScript.

Offers functions for dealing with dates and times in the browser. This library is not necessarily
meant as an alternative to moment.js, more that its small as possible while still meeting my needs.

##API

###dateify
  * `dateify :: String   -> Date`
  * `dateify :: Number   -> Date`
  * `dateify :: Date     -> Date`
  * `dateify :: [Number] -> Date`

  Converts parameters into a Date object. Can take any of the parameters that the JavaScript Date
  constructor will accept with a few additions: a subset of ISO 8601 formatted datestrings can be
  parsed, and it can take an array of Numbers and spread them for the constructor.

###deDateify
  * `deDateify :: Date -> String`

  Converts a Date object into an ISO 8601 datestring.

###isLeapYear
  * `isLeapYear :: Number -> Boolean`

  Will correctly identify whether or not any CE year is a leap year. Does not work for BCE years.

###toUTCDateString
  * `toUTCDateString :: Date -> String`

  Same as deDateify but outputs a zulu time string.

###destructure
  * `destructure :: Date -> [Number]`

  Performs the reverse operation of the Date constructor: takes a Date and returns an array of its
  numbers `[yr, mon*, day, hr, min, sec]`, same position as the Date constructor takes them.

  \* Does *not* add 1 to the month, i.e. January is 0.

##Input Upgrades

Because not all browsers implement input type='date/time' dateify provides some functions to implement
some basic validation/formatting on the passed-in input elements. Note that calling the function without
an input argument will cause one to be created of the appropriate tag. Because I use Polymer frequently,
I've added versions of these that work for paper-inputs:

###toDateInput

###toTimeInput

###toPaperDate

###toPaperTime

All have a signature of `HTMLElement -> HTMLElement` or `Nil -> HTMLElement`.

##NOTE

-When used with Polymer `paper-inputs`:

Polymer paper inputs will not behave correctly in chrome unless you declare the type attribute to be
date *before* the element is completely upgraded (e.g. 'dom-change' event fired on an auto-binding
template). If using with Polymer make sure to set `type="date"` in your markup (won't affect other
browsers).
