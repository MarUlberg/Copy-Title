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
