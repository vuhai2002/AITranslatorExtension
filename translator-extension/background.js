// Khởi tạo extension
chrome.runtime.onInstalled.addListener(() => {
    // Thiết lập giá trị mặc định
    chrome.storage.sync.set({
        uiTheme: "light", 
        uiLang: "vi",
        targetLang: "vi"
    });

    // Tạo menu ngữ cảnh
    chrome.contextMenus.create({
        id: "translate",
        title: "Dịch với AI Translator",
        contexts: ["selection"]
    });
});

// Xử lý click vào menu ngữ cảnh
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "translate") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: translateSelectedText
        });
    }
});

// Hàm dịch văn bản được chọn
function translateSelectedText() {
    const text = window.getSelection().toString();
    if (text) {
        chrome.runtime.sendMessage({ action: "translate", text: text });
    }
}

// Xử lý yêu cầu dịch
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === "translate") {
        chrome.storage.sync.get(["targetLangName"], (data) => {
            const targetLang = data.targetLangName || "Vietnamese";

            // Gọi đến server API của bạn thay vì OpenAI trực tiếp
            fetch("https://translate.vuhai.me/api/translate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: message.text,
                    targetLang: targetLang,
                    service: "openai" // hoặc "microsoft"
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.translation) {
                    chrome.tabs.sendMessage(sender.tab.id, { 
                        action: "showTranslation", 
                        translation: data.translation,
                        position: message.position
                    });
                }
            })
            .catch(error => console.error("Translation error:", error));
        });
        return true; // Để giữ kết nối mở cho response không đồng bộ
    }
});