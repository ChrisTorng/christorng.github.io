// ==UserScript==
// @name         ChrisTorng Blog - Exclude Own Analytics
// @namespace    https://christorng.idv.tw/
// @version      2026-10-13
// @description  Maintain a browser cookie for excluding the site maintainer from Cloudflare Web Analytics.
// @author       ChrisTorng
// @homepage     https://github.com/ChrisTorng/christorng.github.io
// @downloadURL  https://github.com/ChrisTorng/christorng.github.io/raw/main/scripts/CloudflareAnalyticsExclude.user.js
// @updateURL    https://github.com/ChrisTorng/christorng.github.io/raw/main/scripts/CloudflareAnalyticsExclude.user.js
// @match        https://christorng.idv.tw/
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Renew on homepage visits; the cookie applies to the entire site.
    document.cookie = 'cf_analytics_ignore=1; Path=/; Max-Age=34560000; SameSite=Lax; Secure';
})();
