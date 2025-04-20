const API_KEY = ""; // Đặt API Key cố định tại đây

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
            const targetLang = data.targetLangName || "vi";

            fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: `Dịch chính xác và giữ nguyên ý nghĩa gốc của từ hoặc đoạn sau sang ${targetLang}, trả về đúng kết quả. Trả lời bằng ${targetLang}: ${message.text}` }]
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.choices && data.choices.length > 0) {
                    chrome.tabs.sendMessage(sender.tab.id, { 
                        action: "showTranslation", 
                        translation: data.choices[0].message.content,
                        position: message.position
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