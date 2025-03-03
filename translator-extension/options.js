document.getElementById("saveApiKey").addEventListener("click", () => {
    const key = document.getElementById("apiKey").value;
    chrome.storage.sync.set({ apiKey: key }, () => {
        alert("Đã lưu API Key!");
    });
});