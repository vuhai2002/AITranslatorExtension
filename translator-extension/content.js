document.addEventListener("mouseup", (e) => {
    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        // Xóa icon cũ nếu có
        const oldIcon = document.getElementById("translate-icon");
        if (oldIcon) oldIcon.remove();

        if (selectedText.length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect(); // Lấy vị trí của vùng bôi đen

            const icon = document.createElement("img");
            icon.id = "translate-icon";
            icon.src = chrome.runtime.getURL("icon.png"); // Lấy icon từ extension

            icon.style.position = "absolute";
            icon.style.left = `${window.scrollX + rect.left + (rect.width / 2) - 16}px`; // Căn giữa icon
            icon.style.top = `${window.scrollY + rect.bottom + 5}px`; // Đặt icon ngay dưới vùng bôi đen

            icon.style.width = "32px"; // Tăng kích thước icon
            icon.style.height = "32px";
            icon.style.cursor = "pointer";
            icon.style.borderRadius = "50%"; // Icon hoàn toàn tròn
            icon.style.boxShadow = "0px 2px 8px rgba(0,0,0,0.2)";
            icon.style.zIndex = "10000";
            icon.style.backgroundColor = "white";
            icon.style.padding = "4px";
            icon.style.transition = "transform 0.2s ease";

            document.body.appendChild(icon);

            // Lưu vị trí của vùng bôi đen khi click vào icon
            icon.addEventListener("click", () => {
                // Lưu lại chính xác vị trí của vùng bôi đen vào biến toàn cục
                window.translationPosition = {
                    left: window.scrollX + rect.left,
                    top: window.scrollY + rect.top,
                    bottom: window.scrollY + rect.bottom,
                    right: window.scrollX + rect.right,
                    width: rect.width,
                    height: rect.height
                };

                // Chuyển icon thành spinner
                icon.src = chrome.runtime.getURL("spinner.gif"); // Cần thêm file spinner.gif vào extension
                icon.style.animation = "spin 1s linear infinite"; // Xoay vòng

                chrome.runtime.sendMessage({
                    action: "translate",
                    text: selectedText,
                    position: window.translationPosition
                });
                //icon.remove();
            });

            // Hiệu ứng hover
            icon.addEventListener("mouseover", () => {
                icon.style.transform = "scale(1.1)";
            });

            icon.addEventListener("mouseout", () => {
                icon.style.transform = "scale(1)";
            });

            // Xóa icon nếu click ra ngoài
            document.addEventListener("click", (clickEvent) => {
                if (clickEvent.target !== icon) {
                    icon.remove();
                }
            }, { once: true });
        }
    }, 100);
});

// Xử lý đoạn dịch hiển thị và ẩn khi click ra ngoài
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "resetIcon") {
        setTimeout(() => {
            const icon = document.getElementById("translate-icon");
            if (icon) {
                icon.src = chrome.runtime.getURL("icon.png");
                icon.style.animation = "none"; // Dừng xoay vòng
            }
        }, 100); // Delay 100ms để tránh giật lag
    }

    if (message.action === "showTranslation") {
        // Xóa kết quả cũ trước khi hiển thị mới
        const oldTranslation = document.getElementById("ai-translation");
        if (oldTranslation) oldTranslation.remove();

        // Sử dụng vị trí đã lưu từ click vào icon
        const position = message.position;

        // Get theme and language settings
        chrome.storage.sync.get(["uiTheme", "uiLang"], (data) => {
            const theme = data.uiTheme || "light";
            const uiLang = data.uiLang || "vi";
            
            // Tạo container cho popup dịch
            const div = document.createElement("div");
            div.id = "ai-translation";
            
            // Add theme attribute
            div.setAttribute("data-theme", theme);
            div.setAttribute("data-lang", uiLang);

            // Tạo header
            const header = document.createElement("div");
            header.className = "translation-header";

            // Logo và tiêu đề
            const title = document.createElement("div");
            title.className = "translation-title";
            const titleText = uiLang === "en" ? "AI Translation" : "AI Dịch";
            title.innerHTML = '<img src="' + chrome.runtime.getURL("icon.png") + '" class="translation-logo"> ' + titleText;

            // Nút đóng
            const closeButton = document.createElement("button");
            closeButton.className = "translation-close";
            closeButton.innerHTML = "×";
            closeButton.addEventListener("click", () => {
                div.style.opacity = "0";
                div.style.transform = "scale(0.95)";
                setTimeout(() => div.remove(), 300);
            });

            header.appendChild(title);
            header.appendChild(closeButton);
            div.appendChild(header);

            // Nội dung bản dịch - Thêm container riêng cho phần scrollable
            const contentContainer = document.createElement("div");
            contentContainer.className = "translation-content-container";

            const content = document.createElement("div");
            content.className = "translation-content";
            content.textContent = message.translation;

            contentContainer.appendChild(content);
            div.appendChild(contentContainer);

            // Style cho container chính - Apply theme variables via CSS
            div.style.position = "absolute";
            div.style.left = `${position.left}px`;
            div.style.top = `${position.bottom + 10}px`;
            div.style.minWidth = "300px";
            div.style.maxWidth = "500px";
            div.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
            div.style.fontSize = "16px";
            div.style.lineHeight = "1.5";
            div.style.padding = "0";
            div.style.borderRadius = "8px";
            div.style.zIndex = "10000";
            div.style.transition = "opacity 0.3s ease, transform 0.3s ease";
            div.style.opacity = "0";
            div.style.transform = "scale(0.95)";
            div.style.overflow = "hidden"; // Container chính không scroll

            document.body.appendChild(div);

            // Thêm style cho popup dịch để hỗ trợ theme
            const translationStyle = document.createElement('style');
            translationStyle.textContent = `
                #ai-translation[data-theme="light"] {
                    --bg-color: #ffffff;
                    --text-color: #333333;
                    --primary-color: #4a6bef;
                    --primary-dark: #3a57d8;
                    --primary-darker: #2a46c7;
                    --secondary-color: #f7f9ff;
                    --border-color: #e0e6ff;
                    --input-border: #dddddd;
                    --input-bg: #ffffff;
                    --card-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
                    --header-gradient: linear-gradient(45deg, #4a6bef, #5285e8);
                    --scrollbar-track: #f1f1f1;
                    --scrollbar-thumb: #c1c9ff;
                    --hover-overlay: rgba(255, 255, 255, 0.2);
                }
                
                #ai-translation[data-theme="dark"] {
                    --bg-color: #1a1d2e;
                    --text-color: #e0e0e0;
                    --primary-color: #5d7aff;
                    --primary-dark: #4a6bef;
                    --primary-darker: #3a57d8;
                    --secondary-color: #2a2f45;
                    --border-color: #3a3f52;
                    --input-border: #3a3f52;
                    --input-bg: #242738;
                    --card-shadow: 0 5px 25px rgba(0, 0, 0, 0.4);
                    --header-gradient: linear-gradient(45deg, #5d7aff, #7290ff);
                    --scrollbar-track: #2a2f45;
                    --scrollbar-thumb: #4a6bef;
                    --hover-overlay: rgba(93, 122, 255, 0.2);
                }
                
                #ai-translation {
                    background-color: var(--bg-color);
                    color: var(--text-color);
                    box-shadow: var(--card-shadow);
                }
                
                #ai-translation .translation-header {
                    background-color: var(--primary-color);
                    border-bottom: 1px solid var(--primary-dark);
                }
                
                #ai-translation .translation-content-container {
                    background-color: var(--bg-color);
                    color: var(--text-color);
                }
                
                #ai-translation .translation-content-container::-webkit-scrollbar {
                    width: 8px;
                }
                
                #ai-translation .translation-content-container::-webkit-scrollbar-track {
                    background: var(--scrollbar-track);
                    border-radius: 8px;
                }
                
                #ai-translation .translation-content-container::-webkit-scrollbar-thumb {
                    background: var(--scrollbar-thumb);
                    border-radius: 8px;
                }
                
                #ai-translation .translation-content-container::-webkit-scrollbar-thumb:hover {
                    background: var(--primary-color);
                }
                
                #ai-translation .translation-close:hover {
                    background-color: var(--hover-overlay);
                }
            `;
            document.head.appendChild(translationStyle);

            // Hiệu ứng hiện lên sau khi thêm vào DOM
            setTimeout(() => {
                div.style.opacity = "1";
                div.style.transform = "scale(1)";
            }, 10);

            // Xử lý click ra ngoài
            document.addEventListener("mousedown", (clickEvent) => {
                if (clickEvent.target !== div && !div.contains(clickEvent.target)) {
                    div.style.opacity = "0";
                    div.style.transform = "scale(0.95)";
                    setTimeout(() => div.remove(), 300);
                }
            }, { once: true });

            // Đảm bảo popup hiển thị trong viewport
            const rect = div.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Kiểm tra nếu popup vượt quá bên phải màn hình
            if (rect.right > viewportWidth) {
                div.style.left = `${Math.max(0, viewportWidth - rect.width - 20)}px`;
            }

            // Kiểm tra nếu popup vượt quá bên dưới màn hình
            if (rect.bottom > viewportHeight) {
                div.style.top = `${position.top - rect.height - 10}px`;
            }
        });
    }
});

// Không lưu vị trí chuột nữa vì chúng ta sử dụng vị trí của vùng bôi đen