const API_KEY = "sk-proj-abc"; // Đặt API Key cố định tại đây

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
        chrome.storage.sync.get(["targetLang"], (data) => {
            const targetLang = data.targetLang || "vi";

            fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: `Dịch chính xác và giữ nguyên ý nghĩa gốc của từ hoặc cụm từ sang ${targetLang}: ${message.text}` }]
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

                    // Gửi tín hiệu để cập nhật lại icon sau khi dịch xong
                    chrome.tabs.sendMessage(sender.tab.id, { 
                        action: "resetIcon"
                    });
                }
            })
            .catch(error => console.error("Lỗi:", error));
        });
    }
});