document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get(["targetLang"], (data) => {
        if (data.targetLang) {
            document.getElementById("targetLanguage").value = data.targetLang;
        }
    });

    document.getElementById("saveSettings").addEventListener("click", () => {
        const lang = document.getElementById("targetLanguage").value;
        chrome.storage.sync.set({ targetLang: lang }, () => {
            alert("✅ Ngôn ngữ đích đã được lưu!");
        });
    });
});