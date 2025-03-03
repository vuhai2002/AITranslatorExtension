document.addEventListener("DOMContentLoaded", () => {
    // Load API Key nếu có
    chrome.storage.sync.get(["apiKey", "targetLang"], (data) => {
        if (data.apiKey) {
            document.getElementById("apiKey").value = data.apiKey;
        }
        if (data.targetLang) {
            document.getElementById("targetLanguage").value = data.targetLang;
        }
    });

    // Lưu API Key
    document.getElementById("saveApiKey").addEventListener("click", () => {
        const key = document.getElementById("apiKey").value.trim();
        if (!key) {
            alert("Vui lòng nhập API Key!");
            return;
        }
        chrome.storage.sync.set({ apiKey: key }, () => {
            alert("✅ API Key đã được lưu!");
        });
    });

    // Lưu Ngôn ngữ Đích
    document.getElementById("saveSettings").addEventListener("click", () => {
        const lang = document.getElementById("targetLanguage").value;
        chrome.storage.sync.set({ targetLang: lang }, () => {
            alert("✅ Ngôn ngữ đích đã được lưu!");
        });
    });
});
