chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "translate",
        title: "Dịch với AI Translator",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "translate") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: translateSelectedText
        });
    }
});

function translateSelectedText() {
    const text = window.getSelection().toString();
    if (text) {
        chrome.runtime.sendMessage({ action: "translate", text: text });
    }
}

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === "translate") {
        chrome.storage.sync.get(["apiKey", "targetLang"], (data) => {
            const apiKey = data.apiKey;
            const targetLang = data.targetLang || "vi";

            if (!apiKey) {
                chrome.notifications.create({
                    type: "basic",
                    iconUrl: "icon.png",
                    title: "⚠ Lỗi API Key",
                    message: "Bạn chưa nhập API Key! Hãy vào popup để nhập."
                });
                return;
            }

            fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: `Translate accurately and preserve the original meaning of the word or phrase into ${targetLang}, returning only the exact result: ${message.text}` }]
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.choices && data.choices.length > 0) {
                    chrome.tabs.sendMessage(sender.tab.id, { 
                        action: "showTranslation", 
                        translation: data.choices[0].message.content,
                        position: message.position // Gửi vị trí đoạn văn bản
                    });
                }
            })
            .catch(error => console.error("Lỗi:", error));
        });
    }
});