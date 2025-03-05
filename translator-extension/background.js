const API_KEY = "sk-proj-abc"; // Đặt API Key cố định tại đây

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "translate",
        title: "Dịch với AI Translator",
        contexts: ["selection"]
    });

    chrome.alarms.create("keepAlive", { periodInMinutes: 5 });
});

chrome.runtime.onStartup.addListener(() => {
    chrome.alarms.create("keepAlive", { periodInMinutes: 5 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "keepAlive") {
        console.log("running");

        // Ping chính extension để đảm bảo nó không bị tắt
        chrome.runtime.sendMessage({ action: "keepAlive" }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn("Không thể gửi ping giữ background script hoạt động.");
            }
        });
    }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "translate") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: translateSelectedText
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "ping") {
        console.log("running");
        sendResponse({ status: "alive" });
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
                    messages: [{ role: "user", content: `Dịch chính xác và giữ nguyên ý nghĩa gốc của từ hoặc đoạn sau sang ${targetLang}, trả về đúng kết quả: ${message.text}` }]
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