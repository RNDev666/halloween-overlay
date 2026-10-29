/*
 * tt-halloween-boot.js - Halloween creatures for any web page: this file decides whether they come at all. Drop one
 * line into a page (TT, TD and IPT link it from /srv/<site>/templates/header.tpl) and keep tt-halloween.js next to
 * this file:
 *
 *   <script src="/path/to/tt-halloween-boot.js" defer></script>
 *
 * Served from another domain (e.g. the Vercel deployment, see vercel.json), the files need
 * Access-Control-Allow-Origin so the localStorage copy works; without it they still load, just uncached.
 *
 * Optional attributes on that tag:
 *   data-site="td|ipt|tt"     follow that site's own light/dark switch (other pages are detected from their background)
 *   data-theme="light|dark"   force the creatures' theme instead
 *   data-sound="off"          no sounds (they only ever play when a creature is clicked)
 *   data-end="2026-11-01"     the day they stop coming, in the visitor's own time (default below)
 *   data-lab                  allow the creature lab with #spooky-lab
 *
 * Delete the line and the creatures are gone from the next page view on. (ON below works too, but only once browsers
 * fetch this file again.) Waits until the page has finished loading (at most a second more), then runs
 * tt-halloween.js, which it keeps in localStorage per VERSION: one download per visitor rather than one per page view.
 */
(function () {
	'use strict';
	var ON = true;                               // false: no creatures for anyone, from the next page view on
	var SOUND = true;                            // false: the creatures make no sound, whatever data-sound says
	var VERSION = '4';                           // = ?v of tt-halloween.js below: bump it on every change of that file
	var END = new Date(2026, 10, 1).getTime();   // 1 November 2026, 00:00, in the visitor's own time
	var KEY = 'tth.code';
	var me = document.currentScript;
	var attr = function (n) { return me ? me.getAttribute('data-' + n) : null; };
	var endAttr = /^(\d{4})-(\d{2})-(\d{2})$/.exec(attr('end') || '');
	if (endAttr) END = new Date(+endAttr[1], endAttr[2] - 1, +endAttr[3]).getTime();
	if (!ON || Date.now() >= END) {
		try { localStorage.removeItem(KEY); } catch (e) { }
		return;
	}
	if (!window.fetch || !window.Promise || !document.documentElement.attachShadow) return;
	// tt-halloween.js sits next to this file, wherever the page itself is
	var src = new URL('tt-halloween.js?v=' + VERSION, (me && me.src) || location.href).href;
	window.__tthCfg = {
		end: END, v: VERSION,
		sound: SOUND && attr('sound') !== 'off',
		lab: !!(me && me.hasAttribute('data-lab')),
		site: attr('site') || '',
		theme: attr('theme') || '',
	};
	function run(code) {
		var s = document.createElement('script');
		s.textContent = code + '\n//# sourceURL=tt-halloween.js';
		document.head.appendChild(s);
		s.remove();
	}
	// fetch fails on file:// and cross-origin hosts without CORS: a plain script tag still works there, just uncached
	function fallback() {
		var s = document.createElement('script');
		s.src = src;
		document.head.appendChild(s);
	}
	function start() {
		var c = null;
		try { c = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { }
		if (c && c.v === VERSION && typeof c.code === 'string') return run(c.code);
		fetch(src, { credentials: 'same-origin' })
			.then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
			.then(function (code) {
				try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, code: code })); } catch (e) { }
				run(code);
			})
			.catch(fallback);
	}
	function later() {
		if (window.requestIdleCallback) requestIdleCallback(start, { timeout: 1000 });   // at most a second after load
		else setTimeout(start, 300);
	}
	if (document.readyState === 'complete') later();
	else addEventListener('load', later);
})();
