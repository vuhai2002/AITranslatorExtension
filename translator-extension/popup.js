document.addEventListener("DOMContentLoaded", () => {
    let settings = {}; // Dùng để lưu giá trị tạm, chỉ lưu vào storage khi bấm Save

    // Load all saved settings từ storage
    chrome.storage.sync.get(["targetLangCode", "targetLangName", "uiTheme", "uiLang", "hoverTranslate"], (data) => {
        settings = { ...data }; // Lưu trạng thái ban đầu vào biến settings

        // Cập nhật UI với dữ liệu đã lưu
        if (data.targetLangCode) {
            document.getElementById("targetLanguage").value = data.targetLangCode;
        }
        document.getElementById("themeToggle").checked = data.uiTheme === 'dark';
        applyTheme(data.uiTheme || 'light');

        document.getElementById("langToggle").checked = data.uiLang === 'en';
        applyUILanguage(data.uiLang || 'vi');

        document.getElementById("hoverTranslateToggle").checked = data.hoverTranslate || false;
    });

    // Khi thay đổi nhưng chưa nhấn Save, chỉ cập nhật `settings`, không lưu vào storage ngay
    document.getElementById("themeToggle").addEventListener("change", (e) => {
        settings.uiTheme = e.target.checked ? 'dark' : 'light';
        applyTheme(settings.uiTheme);
    });

    document.getElementById("langToggle").addEventListener("change", (e) => {
        settings.uiLang = e.target.checked ? 'en' : 'vi';
        applyUILanguage(settings.uiLang);
    });

    document.getElementById("hoverTranslateToggle").addEventListener("change", (e) => {
        settings.hoverTranslate = e.target.checked;
    });

    document.getElementById("targetLanguage").addEventListener("change", (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        settings.targetLangCode = selectedOption.value; // Lưu mã ngôn ngữ cho Google Translate
        settings.targetLangName = selectedOption.getAttribute("data-name"); // Lưu tên cho ChatGPT API
    });

    // Khi bấm "Save Settings", lưu toàn bộ cài đặt vào storage
    document.getElementById("saveSettings").addEventListener("click", () => {
        chrome.storage.sync.set({
            targetLangCode: settings.targetLangCode, // Dùng cho Google Translate
            targetLangName: settings.targetLangName, // Dùng cho ChatGPT API
            uiTheme: settings.uiTheme,
            uiLang: settings.uiLang,
            hoverTranslate: settings.hoverTranslate
        }, () => {
            console.log("Settings saved:", settings);
            
            applyTheme(settings.uiTheme);
            applyUILanguage(settings.uiLang);

            const successMessageEl = document.getElementById("successMessage");
            successMessageEl.textContent = settings.uiLang === 'en'
                ? "✅ Settings saved successfully!"
                : "✅ Đã lưu cài đặt thành công!";
            successMessageEl.classList.remove("hidden");
            successMessageEl.classList.add("visible");

            setTimeout(() => {
                successMessageEl.classList.remove("visible");
                successMessageEl.classList.add("hidden");
            }, 3000);
        });;
    });
});

// Apply the selected theme to the popup
function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
}

// Apply the selected UI language
function applyUILanguage(lang) {
    document.body.setAttribute('data-lang', lang);

    // Cập nhật tất cả các phần tử có data-vi và data-en
    const translatableElements = document.querySelectorAll('[data-vi][data-en]');
    translatableElements.forEach(element => {
        if (lang === "en") {
            element.textContent = element.getAttribute("data-en");
        } else {
            element.textContent = element.getAttribute("data-vi");
        }
    });
}