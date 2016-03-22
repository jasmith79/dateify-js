#Dateify-js

###Lightweight date and time library for javascript.

Offers functions for dealing with dates and times in the browser. This library is not necessarily
meant as an alternative to moment.js, more that its small as possible while still meeting my needs.

##NOTE

-When used with Polymer `paper-inputs`:

Polymer paper inputs will not behave correctly in chrome unless you declare the type attribute to be
date *before* the element is completely upgraded (e.g. 'dom-change' event fired on an auto-binding
template). If using with Polymer make sure to set `type="date"` in your markup (won't affect other
browsers). 
