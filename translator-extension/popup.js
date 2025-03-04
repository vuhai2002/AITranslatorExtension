document.addEventListener("DOMContentLoaded", () => {
    // Load all saved settings
    chrome.storage.sync.get(["targetLang", "uiTheme", "uiLang"], (data) => {
        // Set target language
        if (data.targetLang) {
            document.getElementById("targetLanguage").value = data.targetLang;
        }
        
        // Set theme
        const isDarkTheme = data.uiTheme === 'dark';
        document.getElementById("themeToggle").checked = isDarkTheme;
        applyTheme(isDarkTheme ? 'dark' : 'light');
        
        // Set UI language
        const isEnglish = data.uiLang === 'en';
        document.getElementById("langToggle").checked = isEnglish;
        applyUILanguage(isEnglish ? 'en' : 'vi');
    });

    // Theme toggle listener
    document.getElementById("themeToggle").addEventListener("change", (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        applyTheme(theme);
    });
    
    // Language toggle listener
    document.getElementById("langToggle").addEventListener("change", (e) => {
        const lang = e.target.checked ? 'en' : 'vi';
        applyUILanguage(lang);
    });

    // Save settings button listener
    document.getElementById("saveSettings").addEventListener("click", () => {
        const targetLang = document.getElementById("targetLanguage").value;
        const uiTheme = document.getElementById("themeToggle").checked ? 'dark' : 'light';
        const uiLang = document.getElementById("langToggle").checked ? 'en' : 'vi';
        
        chrome.storage.sync.set({ 
            targetLang: targetLang,
            uiTheme: uiTheme,
            uiLang: uiLang
        }, () => {
            const successMessage = uiLang === 'en' ? 
                "✅ Settings saved successfully!" : 
                "✅ Đã lưu cài đặt thành công!";
            alert(successMessage);
        });
    });
});

// Apply the selected theme to the popup
function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
}

// Apply the selected UI language
function applyUILanguage(lang) {
    document.body.setAttribute('data-lang', lang);
    
    // Update all translatable elements
    const translatableElements = document.querySelectorAll('[data-vi][data-en]');
    translatableElements.forEach(element => {
        element.textContent = element.getAttribute(`data-${lang}`);
    });
}