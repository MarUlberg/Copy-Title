/**
 * Copy Page Title — Chrome
 *
 * Background script for the Chrome version of the Copy Page Title
 * browser extension.
 *
 * This script manages the extension's background functionality, including
 * context menus, keyboard shortcuts, toolbar interactions, tab changes,
 * and communication with the content script. It coordinates user
 * actions from the browser interface and passes the appropriate copy
 * requests to content.js for page-level processing.
 *
 * This file contains the Chrome-specific background implementation of
 * the extension. The content.js file is shared unchanged between the
 * Chrome and Firefox versions.
 */

// ============================================================
// CONTEXT MENU
// ============================================================

const MENU_IDS = {
    TITLE: "copy-title",
    URL: "copy-url",
    RAW: "copy-raw",
    TITLE_URL: "copy-title-url",
    MARKDOWN: "copy-markdown",
    BBCODE: "copy-bbcode",
    HTML: "copy-html"
};

const customSite = {
    "amazon.": {
        title: "Copy Product Title       (Click Extension Icon)"
    },

    "mail.google.com": {
        title: "Copy Email Address       (Click Extension Icon)"
    },

    "instagram.com": {
        title: "Copy Instagram Username  (Click Extension Icon)"
    },

    "iptorrents.com": {
        title: "Copy Video Title         (Click Extension Icon)"
    },

    "mobygames.com": {
        title: "Copy Game Title          (Click Extension Icon)"
    },

    "theporndb.net": {
        title: "Copy Plex Filename       (Click Extension Icon)",
        url: "Copy Plex + Performer    (Shift+Ctrl+F)"
    },

    "proff.no": {
        title: "Copy Company + Orgnr.   (Click Extension Icon)"
    },

    "pornhub.com": {
        title: "Copy PornHub Title       (Click Extension Icon)"
    },

    "soliditet.no": {
        title: "Copy Company + Orgnr.   (Click Extension Icon)",
        url: "Copy Full Company Info   (Shift+Ctrl+F)"
    },

    "open.spotify.com": {
        title: "Copy Spotify Title       (Click Extension Icon)"
    },

    "twitch.tv": {
        title: "Copy Streamer Name   (Click Extension Icon)"
    },

    "x.com": {
        title: "Copy X Username          (Click Extension Icon)"
    },

    "reddit.com": {
        title: "Copy Reddit Title        (Click Extension Icon)"
    },

    "retroachievements.org/user/": {
        title: "Copy User Achievement Points (Click Extension Icon)",
        url: "Copy User + Last Played   (Shift+Ctrl+F)"
    },

    "retroachievements.org/game/": {
        title: "Copy Game Title        (Click Extension Icon)",
        url: "Copy Achievement List   (Shift+Ctrl+F)"
    },

    "youtube.com": {
        title: "Copy YouTube Video Title  (Click Extension Icon)"
    }
};

function getSiteMenuConfig(url) {
    if (!url) {
        return null;
    }

    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname.toLowerCase();
        const fullUrl = `${hostname}${parsedUrl.pathname}`.toLowerCase();

        return (
            Object.entries(customSite).find(
                ([site]) => {
                    if (site.includes("/")) {
                        return fullUrl.startsWith(site);
                    }

                    return (
                        hostname === site ||
                        hostname.endsWith(`.${site}`)
                    );
                }
            )?.[1] || null
        );
    } catch (error) {
        return null;
    }
}

// ============================================================
// CHECK URL
// ============================================================

function isSoliditetUrl(url) {
    if (!url) {
        return false;
    }

    try {
        const hostname = new URL(url).hostname.toLowerCase();

        return (
            hostname === "soliditet.no" ||
            hostname.endsWith(".soliditet.no")
        );
    } catch (error) {
        return false;
    }
}

function isPornDbUrl(url) {
    if (!url) {
        return false;
    }

    try {
        const hostname = new URL(url).hostname.toLowerCase();

        return (
            hostname === "theporndb.net" ||
            hostname.endsWith(".theporndb.net")
        );
    } catch (error) {
        return false;
    }
}

// ============================================================
// UPDATE MENU LABEL
// ============================================================

function updateContextMenuForTab(tab) {
    let titleText = "Copy Title          (Click Extension Icon)";
    let urlText = "Copy URL             (Shift+Ctrl+F)";

    const siteLabels = getSiteMenuConfig(tab?.url);

    if (siteLabels) {
        if (siteLabels.title) {
            titleText = siteLabels.title;
        }

        if (siteLabels.url) {
            urlText = siteLabels.url;
        }
    }

    chrome.contextMenus.update(
        MENU_IDS.TITLE,
        { title: titleText },
        () => {
            if (chrome.runtime.lastError) {
                return;
            }
        }
    );

    chrome.contextMenus.update(
        MENU_IDS.URL,
        { title: urlText },
        () => {
            if (chrome.runtime.lastError) {
                return;
            }
        }
    );
}

// ============================================================
// CREATE CONTEXT MENUS
// ============================================================

function createContextMenus() {
    chrome.contextMenus.removeAll(() => {

        chrome.contextMenus.create({
            id: MENU_IDS.TITLE,
            title: "Copy Title (Click Extension Icon)",
            contexts: ["page"]
        });

        chrome.contextMenus.create({
            id: MENU_IDS.URL,
            title: "Copy URL (Shift+Ctrl+F)",
            contexts: ["page"]
        });

        chrome.contextMenus.create({
            id: MENU_IDS.RAW,
            title: "Copy Raw Title",
            contexts: ["page"]
        });

        chrome.contextMenus.create({
            id: MENU_IDS.TITLE_URL,
            title: "Copy Title + URL",
            contexts: ["page"]
        });

        chrome.contextMenus.create({
            id: MENU_IDS.MARKDOWN,
            title: "-- Markdown Link",
            contexts: ["page"]
        });

        chrome.contextMenus.create({
            id: MENU_IDS.BBCODE,
            title: "-- BBCode Link",
            contexts: ["page"]
        });

        chrome.contextMenus.create({
            id: MENU_IDS.HTML,
            title: "-- HTML Link",
            contexts: ["page"]
        });
    });
}

chrome.runtime.onInstalled.addListener(() => {
    createContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
    createContextMenus();
});


// ============================================================
// UPDATE MENU WHEN ACTIVE TAB CHANGES
// ============================================================

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (chrome.runtime.lastError) {
            return;
        }

        updateContextMenuForTab(tab);
    });
});


// ============================================================
// UPDATE MENU WHEN PAGE NAVIGATES
// ============================================================

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.status === "complete") {
        updateContextMenuForTab(tab);
    }
});


// ============================================================
// RUN CONTENT ACTION
// ============================================================

function runCopyCommand(tabId, action) {
    chrome.tabs.sendMessage(tabId, {
        action: action
    });
}


// ============================================================
// CONTEXT MENU CLICK
// ============================================================

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab?.id) {
        return;
    }

    let action;

    switch (info.menuItemId) {
        case MENU_IDS.TITLE:
            action = "copyTitle";
            break;

        case MENU_IDS.URL:
            action = "copyUrl";
            break;

        case MENU_IDS.RAW:
            action = "copyRawTitle";
            break;

        case MENU_IDS.TITLE_URL:
            action = "copyTitleWithUrl";
            break;

        case MENU_IDS.MARKDOWN:
            action = "copyMarkdown";
            break;

        case MENU_IDS.BBCODE:
            action = "copyBBCode";
            break;

        case MENU_IDS.HTML:
            action = "copyHTML";
            break;

        default:
            return;
    }

    runCopyCommand(tab.id, action);
});

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

chrome.commands.onCommand.addListener((command, tab) => {
    if (!tab?.id) {
        return;
    }

    let action;

    switch (command) {
        case "copy-title":
            action = "copyTitle";
            break;

        case "copy-url":
            action = "copyUrl";
            break;

        case "copy-raw":
            action = "copyRawTitle";
            break;

        case "copy-title-url":
            action = "copyTitleWithUrl";
            break;

        case "copy-markdown":
            action = "copyMarkdown";
            break;

        case "copy-bbcode":
            action = "copyBBCode";
            break;

        case "copy-html":
            action = "copyHTML";
            break;

        default:
            return;
    }

    runCopyCommand(tab.id, action);
});


// ============================================================
// TOOLBAR BUTTON
// ============================================================

chrome.action.onClicked.addListener((tab) => {
    if (!tab?.id) {
        return;
    }

    runCopyCommand(tab.id, "copyTitle");
});


// ============================================================
// CLIPBOARD MESSAGE
// ============================================================

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        if (message.action === "copyToClipboard" && sender.tab) {
            chrome.scripting.executeScript({
                target: { tabId: sender.tab.id },

                func: (text) => {
                    const textArea =
                        document.createElement("textarea");

                    textArea.value = text;
                    document.body.appendChild(textArea);

                    textArea.select();
                    document.execCommand("copy");

                    document.body.removeChild(textArea);

                    console.log(
                        "✅ Successfully copied:",
                        text
                    );
                },

                args: [message.text]
            });
        }
    }
);