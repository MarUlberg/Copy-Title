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
    TITLE_URL: "copy-title-url",
    URL: "copy-url",
    MARKDOWN: "copy-markdown",
    RAW: "copy-raw"
};


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
    let titleText;
    let titleUrlText;

    if (isPornDbUrl(tab?.url)) {
        titleText = "Copy Plex Filename  (Click Extension Icon)";
        titleUrlText = "Copy Plex + Performer  (Shift+Ctrl+F)";
    } else {
        titleText = "Copy Title          (Click Extension Icon)";

        titleUrlText = isSoliditetUrl(tab?.url)
            ? "Copy Company Info      (Shift+Ctrl+F)"
            : "Copy Title + URL      (Shift+Ctrl+F)";
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
        MENU_IDS.TITLE_URL,
        { title: titleUrlText },
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

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {

        chrome.contextMenus.create({
            id: MENU_IDS.TITLE,
            title: "Copy Title          (Click Extension Icon)",
            contexts: ["page"]
        });

        chrome.contextMenus.create({
            id: MENU_IDS.TITLE_URL,
            title: "Copy Title + URL      (Shift+Ctrl+F)",
            contexts: ["page"]
        });

        chrome.contextMenus.create({
            id: MENU_IDS.URL,
            title: "Copy URL",
            contexts: ["page"]
        });

        chrome.contextMenus.create({
            id: MENU_IDS.MARKDOWN,
            title: "Copy Markdown",
            contexts: ["page"]
        });

        chrome.contextMenus.create({
            id: MENU_IDS.RAW,
            title: "Copy RAW Title",
            contexts: ["page"]
        });
    });
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
    chrome.scripting.executeScript(
        {
            target: { tabId },
            files: ["content.js"]
        },
        () => {
            if (chrome.runtime.lastError) {
                console.error(
                    "❌ Failed to load content.js:",
                    chrome.runtime.lastError.message
                );
                return;
            }

            chrome.tabs.sendMessage(tabId, {
                action: action
            });
        }
    );
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

        case MENU_IDS.TITLE_URL:
            action = isSoliditetUrl(tab.url)
                ? "copySoliditetFull"
                : "copyTitleWithUrl";
            break;

        case MENU_IDS.MARKDOWN:
            action = "copyMarkdown";
            break;

        case MENU_IDS.RAW:
            action = "copyRawTitle";
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

        case "copy-title-url":
            action = isSoliditetUrl(tab.url)
                ? "copySoliditetFull"
                : "copyTitleWithUrl";
            break;

        case "copy-markdown":
            action = "copyMarkdown";
            break;

        case "copy-raw":
            action = "copyRawTitle";
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

    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            files: ["content.js"]
        },
        () => {
            if (chrome.runtime.lastError) {
                console.error(
                    "❌ Failed to load content.js:",
                    chrome.runtime.lastError.message
                );
                return;
            }

            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    if (typeof processPageTitle === "function") {
                        processPageTitle();
                    } else {
                        console.error(
                            "❌ processPageTitle is not defined in content.js"
                        );
                    }
                }
            });
        }
    );
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