// ==UserScript==
// @name         ARAM Mayhem Augments - Vietnamese Translator
// @namespace    https://github.com/sirhvd/arammayhem_auguments_vi
// @version      1.1
// @description  Việt hóa tên và mô tả các Lõi (Augments) trên MetaSrc.
// @author       HVD
// @match        https://www.metasrc.com/lol/arena/build/*
// @match        https://www.metasrc.com/lol/mayhem/build/*
// @match        https://www.metasrc.com/lol/arena/tier-list/augments
// @match        https://www.metasrc.com/lol/mayhem/tier-list/augments
// @match        https://arammayhem.com/champions/*/
// @match        https://arammayhem.com/combo/
// @match        https://arammayhem.com/tools/ryze-simulator/
// @match        https://arammayhem.com/tools/vladimir-simulator/
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @icon         https://www.google.com/s2/favicons?sz=64&domain=metasrc.com
// @homepageURL  https://github.com/sirhvd/arammayhem_auguments_vi
// @downloadURL  https://raw.githubusercontent.com/sirhvd/arammayhem_auguments_vi/main/arammayhem_auguments_vi.js
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const JSON_URL = 'https://raw.githubusercontent.com/sirhvd/arammayhem_auguments_vi/main/augments.json';

    // Helper: Chỉnh sửa text mà không làm mất cấu trúc gốc (nếu cần)
    const replaceText = (el, info) => {
        if (!el || el.dataset.translated) return;
        el.innerText = `${el.innerText} (${info.vn_name})`;
        el.dataset.translated = "true";
    };

    // Khởi tạo truy xuất dữ liệu
    const fetchAugmentData = new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: JSON_URL,
            onload: (res) => {
                const data = JSON.parse(res.responseText);
                // Tối ưu bằng cách tạo Map để lookup O(1)
                const idMap = new Map();
                const nameMap = new Map();

                data.forEach(item => {
                    idMap.set(Number(item.id), item);
                    if (item.en_name) nameMap.set(item.en_name.toLowerCase().trim(), item);
                });

                resolve({ idMap, nameMap });
            },
            onerror: reject
        });
    });

    const Translator = {
        // --- LOGIC CHO METASRC ---
        metaSrc(maps) {
            // 1. Static UI (Bảng danh sách)
            const uiSelector = 'div._je89v2-3._cn8bui div[data-tooltip^="augment-"]';
            document.querySelectorAll(uiSelector).forEach(el => {
                const augId = Number(el.getAttribute('data-tooltip').split('-').pop());
                const info = maps.idMap.get(augId);
                const strong = el.querySelector('strong');
                if (info && strong && !strong.dataset.translated) {
                    strong.innerText = `${info.vn_name} (${info.en_name})`;
                    strong.dataset.translated = "true";
                }
            });

            // 2. Search Dropdown
            document.querySelectorAll('#augmentSelect option').forEach(opt => {
                const info = maps.idMap.get(Number(opt.value));
                if (info && !opt.dataset.translated) {
                    opt.textContent = `${info.vn_name} (${opt.textContent})`;
                    opt.dataset.translated = "true";
                }
            });

            // 3. Tooltip Object (Sửa tận gốc data của web)
            let attempts = 0;
            const checkTooltips = setInterval(() => {
                const tooltips = unsafeWindow.Tooltips?.tooltips;
                if (tooltips) {
                    Object.keys(tooltips).forEach(key => {
                        if (key.startsWith('augment-')) {
                            const augId = Number(key.split('-').pop());
                            const info = maps.idMap.get(augId);
                            if (info && tooltips[key].vars) {
                                tooltips[key].vars.name = `${info.vn_name} (${info.en_name})`;
                                if (info.desc) {
                                    tooltips[key].vars.description = `<div>${info.desc}</div>`;
                                }
                            }
                        }
                    });
                    clearInterval(checkTooltips);
                }
                if (++attempts > 20) clearInterval(checkTooltips);
            }, 500);
        },

        // --- LOGIC CHO ARAMMAYHEM ---
        aramMayhem(maps) {

            GM_addStyle('.font-medium { text-wrap: auto !important; }');

            const path = location.pathname;
            let selector = "";

            if (path.includes('/champions/')) {
                selector = 'div.flex.flex-wrap.items-center.gap-2 > span.font-medium:nth-child(1):not(.text-foreground)';
            } else if (path.endsWith('/combo/')) {
                selector = 'div.flex-1.min-w-0 > a > div > span:nth-child(1)';
            } else if (path.includes('-simulator/')) {
                selector = 'div.flex.items-center.justify-between.gap-2 > div > div';
            }

            if (selector) {
                document.querySelectorAll(selector).forEach(el => {
                    const info = maps.nameMap.get(el.innerText.toLowerCase().trim());
                    if (info) replaceText(el, info);
                });
            }
        }
    };

    // Thực thi
    fetchAugmentData.then(maps => {
        // Chờ UI render nhẹ
        setTimeout(() => {
            if (location.host.includes('metasrc.com')) {
                Translator.metaSrc(maps);
            } else if (location.host.includes('arammayhem.com')) {
                Translator.aramMayhem(maps);
            }
        }, 500);
    }).catch(err => console.error("Translator Error:", err));

})();
