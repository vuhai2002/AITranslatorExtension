// Initialize extension defaults
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        uiTheme: "light",
        uiLang: "vi",
        targetLang: "vi"
    });

    chrome.contextMenus.create({
        id: "translate",
        title: "Dịch với AI Translator",
        contexts: ["selection"]
    });
});

// Context menu handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "translate") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: translateSelectedText
        });
    }
});

// Helper executed in the page to read selection
function translateSelectedText() {
    const text = window.getSelection().toString();
    if (text) {
        chrome.runtime.sendMessage({ action: "translate", text });
    }
}

// Listen for translation requests
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === "translate") {
        chrome.storage.sync.get(["targetLangCode"], (data) => {
            const targetLang = data.targetLangCode || "vi";
            const tabId = sender?.tab?.id;

            let failureNotified = false;
            const notifyFailure = () => {
                if (failureNotified || !tabId) return;
                failureNotified = true;
                chrome.tabs.sendMessage(tabId, { action: "translationFailed" });
            };

            fetch("https://translate.vuhai.me/api/translate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: message.text,
                    targetLang,
                    service: "microsoft" // or "openai"
                })
            })
                .then(async (response) => {
                    if (!response.ok) {
                        notifyFailure();
                        throw new Error(`Translation request failed with status ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    if (data.translation && tabId) {
                        chrome.tabs.sendMessage(tabId, {
                            action: "showTranslation",
                            translation: data.translation,
                            position: message.position
                        });
                    } else {
                        notifyFailure();
                    }
                })
                .catch((error) => {
                    console.error("Translation error:", error);
                    notifyFailure();
                });
        });

        // Keep the message channel alive for async response
        return true;
    }
});
