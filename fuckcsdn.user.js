// ==UserScript==
// @name         FuckCSDN - 全方位屏蔽CSDN
// @namespace    http://github.com/janephpdev/fuckcsdn
// @version      2.9.0
// @description  屏蔽CSDN及其旗下所有网站，包括搜索结果、直接访问、跳转等 - 因为CSDN带坏了整个中国技术博客圈！
// @author       JanePHPDev
// @match        *://*/*
// @match        *
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const defaultDomains = [
        'csdn.net',
        'csdn.com',
        'csdnblogs.com',
        'blog.csdn.net',
        'edu.csdn.net',
        'download.csdn.net',
        'bbs.csdn.net',
        'ask.csdn.net',
        'news.csdn.net',
        'lib.csdn.net',
        'geek.csdn.net',
        'cto.csdn.net',
        'ai.csdn.net',
        'cloud.csdn.net',
        'blockchain.csdn.net',
        'game.csdn.net',
        'mobile.csdn.net',
        'web.csdn.net',
        'database.csdn.net',
        'os.csdn.net',
        'sec.csdn.net',
        'programmer.csdn.net',
        'gitbook.cn',
        'gitchat.cn',
        'tinymind.cn',
        'iteye.com',
        'codercto.com',
        'csdnimg.cn'
    ];

    const defaultSearchEngines = [
        'google.com', 'google.cn',
        'baidu.com',
        'bing.com',
        'sogou.com',
        'so.com',
        'yahoo.com', 'yahoo.co.jp',
        'duckduckgo.com',
        'yandex.com', 'yandex.ru',
        'toutiao.com', 'so.toutiao.com',
        'sm.cn', 'm.sm.cn'
    ];

    const DOMAINS_KEY = 'fuckCSDN_blockedDomains';
    const WHITELIST_KEY = 'fuckCSDN_whitelist';
    const SETTINGS_KEY = 'fuckCSDN_settings';

    const defaultSettings = {
        debug: false,
        censorText: true,
        globalBlock: true,
        customBlockMessage: '',
        searchEngines: defaultSearchEngines.reduce((acc, engine) => ({ ...acc, [engine]: true }), {})
    };

    function getBlockedDomains() {
        try {
            const stored = GM_getValue(DOMAINS_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return new Map(parsed);
            }
        } catch (e) {
            console.error('FuckCSDN: 域名存储解析失败，使用默认。');
        }
        const map = new Map(defaultDomains.map(domain => [domain, true]));
        saveBlockedDomains(map);
        return map;
    }

    function saveBlockedDomains(map) {
        try {
            GM_setValue(DOMAINS_KEY, JSON.stringify(Array.from(map.entries())));
        } catch (e) {
            console.error('FuckCSDN: 保存域名失败。');
        }
    }

    function getWhitelist() {
        try {
            const stored = GM_getValue(WHITELIST_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return new Map(parsed);
            }
        } catch (e) {
            console.error('FuckCSDN: 白名单存储解析失败，使用空。');
        }
        const map = new Map();
        saveWhitelist(map);
        return map;
    }

    function saveWhitelist(map) {
        try {
            GM_setValue(WHITELIST_KEY, JSON.stringify(Array.from(map.entries())));
        } catch (e) {
            console.error('FuckCSDN: 保存白名单失败。');
        }
    }

    function getSettings() {
        try {
            const stored = GM_getValue(SETTINGS_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return { ...defaultSettings, ...parsed };
            }
        } catch (e) {
            console.error('FuckCSDN: 设置解析失败，使用默认。');
        }
        saveSettings(defaultSettings);
        return defaultSettings;
    }

    function saveSettings(settings) {
        try {
            GM_setValue(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('FuckCSDN: 保存设置失败。');
        }
    }

    let blockedDomains = getBlockedDomains();
    let whitelist = getWhitelist();
    let settings = getSettings();

    // Debug log
    function debugLog(...args) {
        if (settings.debug) {
            console.log('[FuckCSDN Debug]:', ...args);
        }
    }

    function isInPanel(node) {
        let current = node;
        while (current && current !== document) {
            if (current.id === 'fuckCSDN-settings-panel') {
                return true;
            }
            current = current.parentNode;
        }
        return false;
    }

    function isBlockedDomain(hostname) {
        const lowerHost = hostname.toLowerCase();
        for (const [domain] of whitelist.entries()) {
            if (lowerHost === domain || lowerHost.endsWith('.' + domain)) {
                debugLog('白名单匹配:', lowerHost, domain);
                return false;
            }
        }
        for (const [domain, enabled] of blockedDomains.entries()) {
            if (enabled && (lowerHost === domain || lowerHost.endsWith('.' + domain))) {
                debugLog('黑名单匹配:', lowerHost, domain);
                return true;
            }
        }
        return false;
    }

    function isBlockedUrl(url) {
        try {
            const urlObj = new URL(url, window.location.href);
            return isBlockedDomain(urlObj.hostname);
        } catch (e) {
            debugLog('URL解析失败:', url, e);
            return false;
        }
    }

    function censorText(node) {
        if (!settings.censorText || !node || node.nodeType !== Node.TEXT_NODE || isInPanel(node)) return;
        let text = node.textContent;
        for (const [domain] of blockedDomains.entries()) {
            const regex = new RegExp(domain, 'gi');
            text = text.replace(regex, ' '.repeat(domain.length));
        }
        if (text !== node.textContent) {
            node.textContent = text;
            debugLog('文本审查:', node.textContent);
        }
    }

    function censorPageText() {
        if (!settings.censorText) return;
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        let node;
        while (node = walker.nextNode()) {
            if (!isInPanel(node)) {
                censorText(node);
            }
        }
        // Observer for dynamic text
        const textObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(added => {
                        if (isInPanel(added.parentNode || added)) return;
                        if (added.nodeType === Node.TEXT_NODE) {
                            if (!isInPanel(added)) censorText(added);
                        } else if (added.nodeType === Node.ELEMENT_NODE) {
                            if (isInPanel(added)) return;
                            const childWalker = document.createTreeWalker(
                                added,
                                NodeFilter.SHOW_TEXT,
                                null,
                                false
                            );
                            let childNode;
                            while (childNode = childWalker.nextNode()) {
                                if (!isInPanel(childNode)) {
                                    censorText(childNode);
                                }
                            }
                        }
                    });
                }
            });
        });
        textObserver.observe(document.body, { childList: true, subtree: true });
    }

    function blockPage() {
        if (!settings.globalBlock) return;
        const message = settings.customBlockMessage || `
            <div class="icon">🚫</div>
            <h1>网站已被屏蔽</h1>
            <p>该网站因以下原因被屏蔽：</p>
            <ul>
                <li>• 付费阅读/下载</li>
                <li>• 过度广告</li>
                <li>• 带坏中国技术博客圈风气</li>
                <li>• 我操你妈CSDN</li>
            </ul>
            <p>推荐使用：博客园、掘金、思否、知乎等平台</p>
        `;
        document.open();
        document.write(`
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <title>已屏蔽网站 - FuckCSDN</title>
                <style>
                    body {
                        background: #ffffff;
                        color: #000000;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        text-align: center;
                    }
                    .block-message {
                        background: #f8f9fa;
                        padding: 40px;
                        border-radius: 12px;
                        border: 1px solid #e0e0e0;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        max-width: 500px;
                    }
                    h1 {
                        color: #e53e3e;
                        margin-bottom: 20px;
                        font-size: 24px;
                        font-weight: 600;
                    }
                    p {
                        color: #4a5568;
                        line-height: 1.6;
                        margin: 10px 0;
                        font-size: 16px;
                    }
                    .icon {
                        font-size: 48px;
                        margin-bottom: 20px;
                        color: #e53e3e;
                    }
                    ul {
                        list-style: none;
                        padding: 0;
                        text-align: left;
                    }
                    li {
                        margin: 8px 0;
                        color: #4a5568;
                        font-size: 15px;
                    }
                </style>
            </head>
            <body>
                <div class="block-message">
                    ${message}
                </div>
            </body>
            </html>
        `);
        document.close();
        window.stop();
    }

    function hideBlockedInSearch() {
        const currentHost = window.location.hostname.toLowerCase();
        const enabledEngines = Object.entries(settings.searchEngines).filter(([_, enabled]) => enabled).map(([engine]) => engine);
        if (!enabledEngines.some(engine => currentHost.endsWith(engine))) {
            return;
        }

        debugLog('搜索引擎屏蔽激活:', currentHost);

        let cssSelectors = '';
        for (const [domain] of blockedDomains.entries()) {
            cssSelectors += `a[href*="${domain}"], a[href*=".${domain}"] { display: none !important; }`;
        }
        const style = document.createElement('style');
        style.textContent = cssSelectors;
        (document.head || document.documentElement).appendChild(style);

        const parentSelectors = [
            '.g',         // Google
            '.c-container', // Baidu
            '.b_algo',    // Bing
            '.algo',      // Yahoo
            '.result',    // DuckDuckGo, Sogou, 360, Toutiao, Shenma
            '.serp-item', // Yandex
            '.rb',        // Sogou
            '.res-list',  // 360 So, Shenma
            '.search-result', // Toutiao, general
            '.item'       // General
        ];

        function removeBlockedResults() {
            const allLinks = document.querySelectorAll('a[href]');
            allLinks.forEach(link => {
                if (isBlockedUrl(link.href)) {
                    for (const selector of parentSelectors) {
                        const parent = link.closest(selector);
                        if (parent) {
                            parent.remove();
                            debugLog('移除屏蔽结果:', parent);
                            break;
                        }
                    }
                }
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', removeBlockedResults, { once: true });
        } else {
            removeBlockedResults();
        }

        // MutationObserver
        const observer = new MutationObserver(mutations => {
            let shouldScan = false;
            mutations.forEach(mutation => {
                if (mutation.addedNodes) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE && (node.querySelectorAll('a[href]').length > 0 || node.matches && node.matches('a[href]'))) {
                            shouldScan = true;
                        }
                    });
                }
            });
            if (shouldScan) {
                removeBlockedResults();
            }
        });

        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            document.addEventListener('DOMContentLoaded', () => observer.observe(document.body, { childList: true, subtree: true }), { once: true });
        }
    }

    function blockLinks() {
        if (!settings.globalBlock) return;
        document.addEventListener('click', (e) => {
            let target = e.target;
            while (target && target.tagName !== 'A') {
                target = target.parentElement;
            }
            if (target && target.href && isBlockedUrl(target.href)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                alert('此链接指向屏蔽网站，已被FuckCSDN脚本阻止！');
                debugLog('阻止点击:', target.href);
            }
        }, true);
    }

    function blockIframes() {
        if (!settings.globalBlock) return;
        function handleIframes() {
            document.querySelectorAll('iframe[src]').forEach(iframe => {
                if (isBlockedUrl(iframe.src)) {
                    iframe.remove();
                    debugLog('移除iframe:', iframe.src);
                }
            });
        }
        handleIframes();
        const observer = new MutationObserver(handleIframes);
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
            }, { once: true });
        }
    }

    function showSettings() {
        const existingPanel = document.getElementById('fuckCSDN-settings-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        settings = getSettings();
        blockedDomains = getBlockedDomains();
        whitelist = getWhitelist();

        const panel = document.createElement('div');
        panel.id = 'fuckCSDN-settings-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.95);
            color: #000000;
            padding: 24px;
            border-radius: 12px;
            border: 1px solid #e0e0e0;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            z-index: 999999;
            max-width: 750px;
            max-height: 85vh;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        `;

        const title = document.createElement('h2');
        title.innerHTML = '🚫 FuckCSDN 设置';
        title.style.cssText = 'color: #e53e3e; font-size: 22px; font-weight: 600; margin-bottom: 20px; text-align: center;';
        panel.appendChild(title);

        const sectionStyle = 'margin-bottom: 24px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;';

        const globalSection = document.createElement('div');
        globalSection.style.cssText = sectionStyle;
        const globalTitle = document.createElement('h3');
        globalTitle.textContent = '全局设置';
        globalTitle.style.cssText = 'color: #4a5568; font-size: 16px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;';
        globalSection.appendChild(globalTitle);

        const globalBlockCb = document.createElement('label');
        globalBlockCb.innerHTML = `<input type="checkbox" ${settings.globalBlock ? 'checked' : ''} style="margin-right: 8px;"> 启用全局屏蔽`;
        globalBlockCb.style.cssText = 'display: block; margin-bottom: 8px; color: #4a5568; font-size: 14px;';
        globalBlockCb.querySelector('input').addEventListener('change', (e) => {
            settings.globalBlock = e.target.checked;
            saveSettings(settings);
        });
        globalSection.appendChild(globalBlockCb);

        const debugCb = document.createElement('label');
        debugCb.innerHTML = `<input type="checkbox" ${settings.debug ? 'checked' : ''} style="margin-right: 8px;"> Debug模式 (控制台日志)`;
        debugCb.style.cssText = 'display: block; margin-bottom: 8px; color: #4a5568; font-size: 14px;';
        debugCb.querySelector('input').addEventListener('change', (e) => {
            settings.debug = e.target.checked;
            saveSettings(settings);
        });
        globalSection.appendChild(debugCb);

        const censorCb = document.createElement('label');
        censorCb.innerHTML = `<input type="checkbox" ${settings.censorText ? 'checked' : ''} style="margin-right: 8px;"> 屏蔽页面关键词 (替换为空格)`;
        censorCb.style.cssText = 'display: block; color: #4a5568; font-size: 14px;';
        censorCb.querySelector('input').addEventListener('change', (e) => {
            settings.censorText = e.target.checked;
            saveSettings(settings);
        });
        globalSection.appendChild(censorCb);

        const customMsgLabel = document.createElement('label');
        customMsgLabel.style.cssText = 'display: block; color: #4a5568; font-size: 14px; margin-top: 12px;';
        customMsgLabel.innerHTML = '自定义屏蔽页消息 (HTML，支持 <ul><li> 等，空=默认)：';
        const customMsgTa = document.createElement('textarea');
        customMsgTa.value = settings.customBlockMessage;
        customMsgTa.style.cssText = 'width: 80%; height: 80px; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; margin-top: 4px; resize: vertical;';
        customMsgTa.addEventListener('input', (e) => {
            settings.customBlockMessage = e.target.value;
            saveSettings(settings);
        });
        customMsgLabel.appendChild(customMsgTa);
        globalSection.appendChild(customMsgLabel);

        panel.appendChild(globalSection);

        const searchSection = document.createElement('div');
        searchSection.style.cssText = sectionStyle;
        const searchTitle = document.createElement('h3');
        searchTitle.textContent = '搜索引擎屏蔽';
        searchTitle.style.cssText = 'color: #4a5568; font-size: 16px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;';
        searchSection.appendChild(searchTitle);

        const enginesGrid = document.createElement('div');
        enginesGrid.style.cssText = 'display: flex; flex-wrap: wrap; gap: 12px;';
        Object.keys(settings.searchEngines).forEach(engine => {
            const engineCb = document.createElement('label');
            engineCb.innerHTML = `<input type="checkbox" ${settings.searchEngines[engine] ? 'checked' : ''} style="margin-right: 8px;"> ${engine}`;
            engineCb.style.cssText = 'color: #4a5568; font-size: 14px; padding: 4px 8px; border-radius: 4px; background: white; border: 1px solid #e2e8f0; white-space: nowrap;';
            engineCb.querySelector('input').addEventListener('change', (e) => {
                settings.searchEngines[engine] = e.target.checked;
                saveSettings(settings);
            });
            enginesGrid.appendChild(engineCb);
        });
        searchSection.appendChild(enginesGrid);
        panel.appendChild(searchSection);

        const domainsSection = document.createElement('div');
        domainsSection.style.cssText = sectionStyle;
        const domainsTitle = document.createElement('h3');
        domainsTitle.textContent = '黑名单域名';
        domainsTitle.style.cssText = 'color: #4a5568; font-size: 16px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;';
        domainsSection.appendChild(domainsTitle);

        const domainsContainer = document.createElement('div');
        domainsContainer.style.cssText = 'max-height: 200px; overflow-y: auto;';

        const domainsList = document.createElement('div');
        domainsList.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

        blockedDomains.forEach((enabled, domain) => {
            const item = createDomainItem(domain, enabled, blockedDomains, true);
            domainsList.appendChild(item);
        });
        domainsContainer.appendChild(domainsList);
        domainsSection.appendChild(domainsContainer);

        const addBlackSection = createAddSection('黑名单', (newDomain) => {
            if (!blockedDomains.has(newDomain)) {
                blockedDomains.set(newDomain, true);
                saveBlockedDomains(blockedDomains);
                const newItem = createDomainItem(newDomain, true, blockedDomains, true);
                domainsList.appendChild(newItem);
            }
        });
        domainsSection.appendChild(addBlackSection);
        panel.appendChild(domainsSection);

        const whitelistSection = document.createElement('div');
        whitelistSection.style.cssText = sectionStyle;
        const whitelistTitle = document.createElement('h3');
        whitelistTitle.textContent = '白名单域名 (例外，不屏蔽)';
        whitelistTitle.style.cssText = 'color: #48bb78; font-size: 16px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;';
        whitelistSection.appendChild(whitelistTitle);

        const whitelistContainer = document.createElement('div');
        whitelistContainer.style.cssText = 'max-height: 150px; overflow-y: auto;';

        const whitelistList = document.createElement('div');
        whitelistList.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

        whitelist.forEach((enabled, domain) => {
            const item = createDomainItem(domain, enabled, whitelist, false);
            whitelistList.appendChild(item);
        });
        whitelistContainer.appendChild(whitelistList);
        whitelistSection.appendChild(whitelistContainer);

        const addWhiteSection = createAddSection('白名单', (newDomain) => {
            if (!whitelist.has(newDomain)) {
                whitelist.set(newDomain, true);
                saveWhitelist(whitelist);
                const newItem = createDomainItem(newDomain, true, whitelist, false);
                whitelistList.appendChild(newItem);
            }
        });
        whitelistSection.appendChild(addWhiteSection);
        panel.appendChild(whitelistSection);

        function createDomainItem(domain, enabled, map, isBlack) {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; padding: 8px 12px; border-radius: 6px; background: #f1f5f9; border: 1px solid #e2e8f0;';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = enabled;
            checkbox.style.marginRight = '12px';
            checkbox.addEventListener('change', () => {
                map.set(domain, checkbox.checked);
                if (isBlack) saveBlockedDomains(map);
                else saveWhitelist(map);
            });

            const label = document.createElement('span');
            label.textContent = domain;
            label.style.cssText = 'flex: 1; color: #4a5568; font-size: 14px; font-family: monospace;';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '删除';
            deleteBtn.style.cssText = 'margin-left: 12px; background: #e53e3e; border: none; color: #ffffff; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; transition: background 0.2s ease;';
            deleteBtn.addEventListener('mouseover', () => { deleteBtn.style.background = '#c53030'; });
            deleteBtn.addEventListener('mouseout', () => { deleteBtn.style.background = '#e53e3e'; });
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                map.delete(domain);
                if (isBlack) saveBlockedDomains(map);
                else saveWhitelist(map);
                item.remove();
            });

            item.appendChild(checkbox);
            item.appendChild(label);
            item.appendChild(deleteBtn);
            return item;
        }

        function createAddSection(type, callback) {
            const addSection = document.createElement('div');
            addSection.style.cssText = 'display: flex; align-items: center; margin-top: 12px; gap: 8px;';
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `输入新${type}域名`;
            input.style.cssText = 'flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;';
            const addBtn = document.createElement('button');
            addBtn.textContent = '添加';
            addBtn.style.cssText = 'background: #48bb78; border: none; color: #ffffff; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: background 0.2s ease;';
            addBtn.addEventListener('mouseover', () => { addBtn.style.background = '#38a169'; });
            addBtn.addEventListener('mouseout', () => { addBtn.style.background = '#48bb78'; });
            addBtn.addEventListener('click', () => {
                const newDomain = input.value.trim().toLowerCase();
                if (newDomain) {
                    callback(newDomain);
                    input.value = '';
                } else {
                    alert('请输入有效域名！');
                }
            });
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addBtn.click();
            });
            addSection.appendChild(input);
            addSection.appendChild(addBtn);
            return addSection;
        }

        const actionsSection = document.createElement('div');
        actionsSection.style.cssText = 'display: flex; justify-content: space-around; margin: 20px 0; padding-top: 16px; border-top: 1px solid #e2e8f0; gap: 12px;';

        const exportBtn = document.createElement('button');
        exportBtn.textContent = '导出设置';
        exportBtn.style.cssText = 'background: #4299e1; border: none; color: #ffffff; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: background 0.2s ease; flex: 1;';
        exportBtn.addEventListener('mouseover', () => { exportBtn.style.background = '#3182ce'; });
        exportBtn.addEventListener('mouseout', () => { exportBtn.style.background = '#4299e1'; });
        exportBtn.addEventListener('click', () => {
            const data = { domains: Array.from(blockedDomains.entries()), whitelist: Array.from(whitelist.entries()), settings };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'fuckCSDN-settings.json';
            a.click();
            URL.revokeObjectURL(url);
        });
        actionsSection.appendChild(exportBtn);

        const importBtn = document.createElement('button');
        importBtn.textContent = '导入设置';
        importBtn.style.cssText = 'background: #ed8936; border: none; color: #ffffff; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: background 0.2s ease; flex: 1;';
        importBtn.addEventListener('mouseover', () => { importBtn.style.background = '#dd6b20'; });
        importBtn.addEventListener('mouseout', () => { importBtn.style.background = '#ed8936'; });
        importBtn.addEventListener('click', () => {
            const inputFile = document.createElement('input');
            inputFile.type = 'file';
            inputFile.accept = '.json';
            inputFile.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        try {
                            const data = JSON.parse(ev.target.result);
                            if (data.domains) {
                                blockedDomains = new Map(data.domains);
                                saveBlockedDomains(blockedDomains);
                            }
                            if (data.whitelist) {
                                whitelist = new Map(data.whitelist);
                                saveWhitelist(whitelist);
                            }
                            if (data.settings) {
                                settings = { ...defaultSettings, ...data.settings };
                                saveSettings(settings);
                            }
                            alert('导入成功！请刷新页面。');
                            showSettings(); // 刷新面板
                        } catch (err) {
                            alert('导入失败：无效JSON');
                        }
                    };
                    reader.readAsText(file);
                }
            };
            inputFile.click();
        });
        actionsSection.appendChild(importBtn);

        const resetBtn = document.createElement('button');
        resetBtn.textContent = '重置默认';
        resetBtn.style.cssText = 'background: #e53e3e; border: none; color: #ffffff; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: background 0.2s ease; flex: 1;';
        resetBtn.addEventListener('mouseover', () => { resetBtn.style.background = '#c53030'; });
        resetBtn.addEventListener('mouseout', () => { resetBtn.style.background = '#e53e3e'; });
        resetBtn.addEventListener('click', () => {
            if (confirm('确认重置所有设置？')) {
                blockedDomains = new Map(defaultDomains.map(d => [d, true]));
                saveBlockedDomains(blockedDomains);
                whitelist = new Map();
                saveWhitelist(whitelist);
                settings = defaultSettings;
                saveSettings(settings);
                alert('已重置！请刷新页面。');
                showSettings();
            }
        });
        actionsSection.appendChild(resetBtn);

        panel.appendChild(actionsSection);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.style.cssText = 'display: block; margin: 16px auto 0; background: #edf2f7; border: 1px solid #d1d5db; color: #4a5568; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 15px; transition: all 0.2s ease; width: 100%;';
        closeBtn.addEventListener('mouseover', () => { closeBtn.style.background = '#e2e8f0'; closeBtn.style.transform = 'translateY(-1px)'; });
        closeBtn.addEventListener('mouseout', () => { closeBtn.style.background = '#edf2f7'; closeBtn.style.transform = 'none'; });
        closeBtn.addEventListener('click', () => panel.remove());
        panel.appendChild(closeBtn);

        const copyright = document.createElement('p');
        copyright.style.cssText = 'margin-top: 20px; color: #a0aec0; font-size: 12px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px;';
        copyright.innerHTML = 'FuckCSDN v2.9.0<br>作者: JanePHPDev<br>命名空间: http://github.com/JanePHPDev/FuckCSDN<br>许可证: MIT<br>© 2025 All Rights Reserved.';
        panel.appendChild(copyright);

        document.body.appendChild(panel);
    }

    try {
        GM_registerMenuCommand('FuckCSDN 设置', showSettings);
    } catch (e) {
        console.error('FuckCSDN: 菜单注册失败。');
    }

    function main() {
        try {
            const currentHost = window.location.hostname;
            if (isBlockedDomain(currentHost)) {
                blockPage();
                return;
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    censorPageText();
                    hideBlockedInSearch();
                    blockLinks();
                    blockIframes();
                }, { once: true });
            } else {
                censorPageText();
                hideBlockedInSearch();
                blockLinks();
                blockIframes();
            }
        } catch (e) {
            debugLog('主函数错误:', e);
        }
    }

    main();
})();