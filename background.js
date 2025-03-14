chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"] // Ensure content.js is loaded
    }, () => {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                if (typeof processPageTitle === "function") {
                    processPageTitle();
                } else {
                    console.error("❌ processPageTitle is not defined in content.js");
                }
            }
        });
    });
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "copyToClipboard" && sender.tab) {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            func: (text) => {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                console.log("✅ Successfully copied:", text);
            },
            args: [message.text]
        });
    }
});
