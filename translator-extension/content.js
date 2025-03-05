let currentTheme = 'light';
let currentUILang = 'vi';
let keepAliveInterval;

// Lấy giá trị từ storage khi khởi tạo
chrome.storage.sync.get(['uiTheme', 'uiLang'], (data) => {
    currentTheme = data.uiTheme || 'light';
    currentUILang = data.uiLang || 'vi';
});

// Lắng nghe thay đổi storage
chrome.storage.onChanged.addListener((changes) => {
    if (changes.uiTheme) currentTheme = changes.uiTheme.newValue;
    if (changes.uiLang) currentUILang = changes.uiLang.newValue;
});

/*****************/
function startKeepAlive() {
    if (!keepAliveInterval) {
        keepAliveInterval = setInterval(() => {
            chrome.runtime.sendMessage({ action: "ping" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn("⚠️ Không thể gửi tin nhắn.");
                    clearInterval(keepAliveInterval);
                    keepAliveInterval = null;
                }
            });
        }, 30000); // Gửi mỗi 30 giây khi user hoạt động
    }
}

function stopKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }
}

// Chỉ kích hoạt gửi tin nhắn khi user có hoạt động
document.addEventListener("mousemove", startKeepAlive);
document.addEventListener("keydown", startKeepAlive);
document.addEventListener("blur", stopKeepAlive);
document.addEventListener("focus", startKeepAlive);
/*****************/

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

            icon.style.width = "28px"; // Tăng kích thước icon
            icon.style.height = "28px";
            icon.style.cursor = "pointer";
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
                icon.src = chrome.runtime.getURL("spinner.png");
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

        // Tạo container cho popup dịch
        const div = document.createElement("div");
        div.id = "ai-translation";

        // Tạo header
        const header = document.createElement("div");
        header.className = "translation-header";

        // Logo và tiêu đề
        const title = document.createElement("div");
        title.className = "translation-title";
        title.innerHTML = '<img src="' + chrome.runtime.getURL("icon.png") + '" class="translation-logo"> AI Translation';

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

        // Style cho container chính
        div.style.position = "absolute";
        div.style.left = `${position.left}px`;
        div.style.top = `${position.bottom + 10}px`;
        div.style.minWidth = "300px";
        div.style.maxWidth = "500px";
        div.style.backgroundColor = currentTheme === 'dark' ? '#1a1d2e' : 'white';
        div.style.color = currentTheme === 'dark' ? '#e0e0e0' : '#333';
        div.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        div.style.fontSize = "16px";
        div.style.lineHeight = "1.5";
        div.style.padding = "0";
        div.style.borderRadius = "8px";
        div.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
        div.style.zIndex = "10000";
        div.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        div.style.opacity = "0";
        div.style.transform = "scale(0.95)";
        div.style.overflow = "hidden"; // Container chính không scroll

        // Style cho header
        header.style.padding = "10px 15px";
        header.style.backgroundColor = "#4a6bef";
        header.style.color = "white";
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";
        header.style.borderBottom = "1px solid #3a57d8";
        header.style.flexShrink = "0"; // Không co lại

        // Style cho title
        title.style.display = "flex";
        title.style.alignItems = "center";
        title.style.fontWeight = "bold";
        title.style.fontSize = "14px";
        title.style.whiteSpace = "nowrap"; // Ngăn xuống dòng

        // Style cho logo
        const logo = title.querySelector(".translation-logo");
        if (logo) {
            logo.style.width = "18px";
            logo.style.height = "18px";
            logo.style.marginRight = "8px";
            logo.style.backgroundColor = "white";
            logo.style.borderRadius = "50%";
            logo.style.padding = "2px";
        }

        // Style cho nút đóng
        closeButton.style.background = "none";
        closeButton.style.border = "none";
        closeButton.style.color = "white";
        closeButton.style.fontSize = "20px";
        closeButton.style.cursor = "pointer";
        closeButton.style.padding = "0 5px";
        closeButton.style.lineHeight = "1";
        closeButton.style.fontWeight = "bold";
        closeButton.style.display = "flex";
        closeButton.style.alignItems = "center";
        closeButton.style.justifyContent = "center";
        closeButton.style.width = "24px";
        closeButton.style.height = "24px";
        closeButton.style.borderRadius = "50%";
        closeButton.style.transition = "background-color 0.2s";

        // Style cho container nội dung (phần scrollable)
        contentContainer.style.maxHeight = "250px"; // Giới hạn chiều cao
        contentContainer.style.overflowY = "auto"; // Cho phép cuộn dọc
        contentContainer.style.overflowX = "hidden"; // Không cuộn ngang
        contentContainer.style.padding = "15px";

        // Style cho content
        content.style.fontSize = "16px";
        content.style.wordBreak = "break-word"; // Xử lý từ dài

        document.body.appendChild(div);

        // Thêm style cho scrollbar Chrome
        const scrollbarStyle = document.createElement('style');
        scrollbarStyle.textContent = `
            .translation-content-container::-webkit-scrollbar {
            width: 8px;
        }
            .translation-content-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 8px;
        }
            .translation-content-container::-webkit-scrollbar-thumb {
            background: #c1c9ff;
            border-radius: 8px;
        }
            .translation-content-container::-webkit-scrollbar-thumb:hover {
            background: #4a6bef;
        }
        `;
        document.head.appendChild(scrollbarStyle);

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
    }
});

// Không lưu vị trí chuột nữa vì chúng ta sử dụng vị trí của vùng bôi đen