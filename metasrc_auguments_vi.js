// ==UserScript==
// @name         MetaSrc Augments - Vietnamese Translator
// @namespace    https://github.com/sirhvd/metasrc_auguments_vi_translator
// @version      1.0
// @description  Việt hóa tên và mô tả các Lõi (Augments) trên MetaSrc.
// @author       HVD
// @match        https://www.metasrc.com/lol/arena/build/*
// @match        https://www.metasrc.com/lol/mayhem/build/*
// @match        https://www.metasrc.com/lol/arena/tier-list/augments
// @match        https://www.metasrc.com/lol/mayhem/tier-list/augments
// @grant        GM_xmlhttpRequest
// @icon         https://www.google.com/s2/favicons?sz=64&domain=metasrc.com
// @homepageURL  https://github.com/sirhvd/metasrc_auguments_vi_translator
// @downloadURL  https://raw.githubusercontent.com/sirhvd/metasrc_auguments_vi_translator/refs/heads/main/metasrc_auguments_vi.js
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const JSON_URL = 'https://raw.githubusercontent.com/sirhvd/metasrc_auguments_vi_translator/main/augments.json';

    function translateStaticUI(augmentData) {
        const targetSelector = 'div._je89v2-3._cn8bui div[data-tooltip^="augment-"]';
        const elements = document.querySelectorAll(targetSelector);

        elements.forEach(el => {
            if (el.hasAttribute('data-translated')) return;

            const augId = parseInt(el.getAttribute('data-tooltip').split('-').pop());
            const info = augmentData.find(a => a.id === augId);

            if (info) {
                const strongTag = el.querySelector('strong');
                if (strongTag) {
                    strongTag.innerText = info.vn_name;
                    el.setAttribute('data-translated', 'true');
                }
            }
        });
    }

    function translateTooltipObject(augmentData) {
        const tooltips = unsafeWindow.Tooltips && unsafeWindow.Tooltips.tooltips;
        if (!tooltips) return false;
        for (let key in tooltips) {
            if (key.startsWith('augment-')) {
                const augId = parseInt(key.split('-').pop());
                const info = augmentData.find(a => a.id === augId);
                if (info && tooltips[key].vars) {
                    tooltips[key].vars.name = info.vn_name;
                    tooltips[key].vars.description = `<div>${info.desc}</div>`;
                }
            }
        }
        return true;
    }

    GM_xmlhttpRequest({
        method: "GET",
        url: JSON_URL,
        onload: function(response) {
            try {
                const augmentData = JSON.parse(response.responseText);
                translateStaticUI(augmentData);
                const checkDataInterval = setInterval(() => {
                    if (translateTooltipObject(augmentData)) {
                        console.log("Đã dịch xong.");
                        clearInterval(checkDataInterval);
                    }
                }, 500);
                setTimeout(() => clearInterval(checkDataInterval), 10000);
            } catch (e) { console.error("Lỗi script:", e); }
        }
    });
})();
