!function(){return function t(e,n,o){function r(i,c){if(!n[i]){if(!e[i]){var a="function"==typeof require&&require;if(!c&&a)return a(i,!0);if(s)return s(i,!0);var u=new Error("Cannot find module '"+i+"'");throw u.code="MODULE_NOT_FOUND",u}var l=n[i]={exports:{}};e[i][0].call(l.exports,function(t){return r(e[i][1][t]||t)},l,l.exports,t,e,n,o)}return n[i].exports}for(var s="function"==typeof require&&require,i=0;i<o.length;i++)r(o[i]);return r}}()({1:[function(t,e,n){!function(t,o){"use strict";var r={};t.PubSub=r;var s=t.define;!function(t){var e={},n=-1;function o(t){var e;for(e in t)if(t.hasOwnProperty(e))return!0;return!1}function r(t,e,n){try{t(e,n)}catch(t){setTimeout(function(t){return function(){throw t}}(t),0)}}function s(t,e,n){t(e,n)}function i(t,n,o,i){var c,a=e[n],u=i?s:r;if(e.hasOwnProperty(n))for(c in a)a.hasOwnProperty(c)&&u(a[c],t,o)}function c(t,n,r,s){var c=function(t,e,n){return function(){var o=String(t),r=o.lastIndexOf(".");for(i(t,t,e,n);-1!==r;)o=o.substr(0,r),r=o.lastIndexOf("."),i(t,o,e,n)}}(t,n,s),a=function(t){var n=String(t),r=Boolean(e.hasOwnProperty(n)&&o(e[n])),s=n.lastIndexOf(".");for(;!r&&-1!==s;)n=n.substr(0,s),s=n.lastIndexOf("."),r=Boolean(e.hasOwnProperty(n)&&o(e[n]));return r}(t);return!!a&&(!0===r?c():setTimeout(c,0),!0)}t.publish=function(e,n){return c(e,n,!1,t.immediateExceptions)},t.publishSync=function(e,n){return c(e,n,!0,t.immediateExceptions)},t.subscribe=function(t,o){if("function"!=typeof o)return!1;e.hasOwnProperty(t)||(e[t]={});var r="uid_"+String(++n);return e[t][r]=o,r},t.subscribeOnce=function(e,n){var o=t.subscribe(e,function(){t.unsubscribe(o),n.apply(this,arguments)});return t},t.clearAllSubscriptions=function(){e={}},t.clearSubscriptions=function(t){var n;for(n in e)e.hasOwnProperty(n)&&0===n.indexOf(t)&&delete e[n]},t.unsubscribe=function(n){var o,r,s,i="string"==typeof n&&(e.hasOwnProperty(n)||function(t){var n;for(n in e)if(e.hasOwnProperty(n)&&0===n.indexOf(t))return!0;return!1}(n)),c=!i&&"string"==typeof n,a="function"==typeof n,u=!1;if(!i){for(o in e)if(e.hasOwnProperty(o)){if(r=e[o],c&&r[n]){delete r[n],u=n;break}if(a)for(s in r)r.hasOwnProperty(s)&&r[s]===n&&(delete r[s],u=!0)}return u}t.clearSubscriptions(n)}}(r),"function"==typeof s&&s.amd?s(function(){return r}):"object"==typeof n&&(void 0!==e&&e.exports&&(n=e.exports=r),n.PubSub=r,e.exports=n=r)}("object"==typeof window&&window||this)},{}],2:[function(t,e,n){"use strict";const o=Array.prototype.concat(["reset","submit"],["cut","copy","paste"],["keydown","keypress","keyup"],["mousedown","mouseup","click","dblclick","contextmenu","wheel","select","pointerlockchange","pointerlockerror"],["dragstart","drag","dragend","dragenter","dragover","dragleave","drop"]);e.exports={EVENTS:o}},{}],3:[function(t,e,n){"use strict";class o{setOptions(t){"enabled"in t&&(this.enabled=Boolean(t.enabled)),"types"in t&&(this.types=t.types),"selector"in t&&(this.selector=t.selector),this.onEvent=function(e){const n={topic:"dom-events",element:e.target.nodeName,event:e.type};t.callback(null,n)}}_matches(t,e){return(!this.types||this.types.includes(t))&&(!this.selector||"document"===this.selector&&e instanceof Document||"window"===this.selector&&e instanceof Window||e.matches&&e.matches(this.selector))}_onEvent(t,e){if(this.enabled&&this._matches(t.type,t.target))return this.onEvent(t,e)}}e.exports={EventListenerHook:class{constructor(t){this.name=t,this.targetInstance=this,this.rules=[new o],this.handlerProxies=new WeakMap,this.oldAEL=EventTarget.prototype.addEventListener,this.oldREL=EventTarget.prototype.removeEventListener;const e=this;EventTarget.prototype.addEventListener=function(t,n,o){return e.onAddListener(this,t,n,o)},EventTarget.prototype.removeEventListener=function(t,n,o){return e.onRemoveListener(this,t,n,o)}}onAddListener(t,e,n,o){if(!n)return;const r=this,s=this.handlerProxies.get(n)||function(t){return r.targetInstance.onEvent(this,t,n)},i=this.oldAEL.call(t,e,s,o);return this.handlerProxies.set(n,s),i}onRemoveListener(t,e,n,o){if(n&&this.handlerProxies.has(n)){const r=this.handlerProxies.get(n);this.oldREL.call(t,e,r,o)}else this.oldREL.call(t,e,n,o)}onEvent(t,e,n){let o=!1;for(const t of this.rules)!1===t._onEvent(e,n)&&(o=!0);if(!o)return n.handleEvent?n.handleEvent.call(t,e):n.call(t,e)}setOptions(t){this.rules[0].setOptions(t),this.enabled=this.rules[0].enabled}}}},{}],4:[function(t,e,n){"use strict";const o=[],r=Storage.prototype.getItem,s=Storage.prototype.removeItem,i=Storage.prototype.setItem;function c(t){let e;return e=t===window.sessionStorage?"sessionStorage":t===window.localStorage?"localStorage":"unknown"}Storage.prototype.getItem=function(...t){const e=t[0],n=r.call(this,e);for(const t of o)t.onStorage({key:e,action:"get",value:n,type:c(this)});return n},Storage.prototype.removeItem=function(...t){const e=t[0],n=r.call(this,e),i=s.call(this,e);for(const t of o)t.onStorage({key:e,action:"remove",value:n,type:c(this)});return i},Storage.prototype.setItem=function(...t){const e=t[0],n=t[1],r=i.call(this,e,n);for(const t of o)t.onStorage({key:e,action:"set",value:n,type:c(this)});return r};e.exports={StorageHook:class{constructor(){o.push(this)}setOptions(t){"enabled"in t&&(this.enabled=Boolean(t.enabled)),this.onStorage=function(e){const n={...e,topic:"storage"};t.callback(null,n)}}}}},{}],5:[function(t,e,n){(function(e){"use strict";const n=t("pubsub-js");e.mailbox=n;const{EVENTS:o}=t("./events.js"),{EventListenerHook:r}=t("./hooks/event-listener-hook.js"),{StorageHook:s}=t("./hooks/storage-hook");function i(t,e){if(t)console.log(t);else{const t=(new Date).getTime(),{topic:o}=e;e.timestamp=t,n.publish(o,e)}}[{Hook:r,options:{enabled:!0,types:o,callback:i}},{Hook:s,options:{enabled:!0,callback:i}}].forEach(t=>{(new t.Hook).setOptions(t.options)})}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"./events.js":2,"./hooks/event-listener-hook.js":3,"./hooks/storage-hook":4,"pubsub-js":1}]},{},[5,3,4]);