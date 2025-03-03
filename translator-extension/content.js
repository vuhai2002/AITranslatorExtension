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
            icon.style.left = `${window.scrollX + rect.left + (rect.width / 2) - 14}px`; // Căn giữa icon (icon rộng 28px)
            icon.style.top = `${window.scrollY + rect.bottom + 5}px`; // Đặt icon ngay dưới vùng bôi đen

            icon.style.width = "28px"; // Điều chỉnh kích thước icon
            icon.style.height = "28px";
            icon.style.cursor = "pointer";
            icon.style.borderRadius = "30%"; // Làm icon tròn hơn nếu cần
            icon.style.boxShadow = "0px 2px 5px rgba(0,0,0,0.3)";
            icon.style.zIndex = "10000";

            document.body.appendChild(icon);

            icon.addEventListener("click", () => {
                chrome.runtime.sendMessage({ action: "translate", text: selectedText, position: rect });
                icon.remove();
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
    if (message.action === "showTranslation") {
        // Xóa kết quả cũ trước khi hiển thị mới
        const oldTranslation = document.getElementById("ai-translation");
        if (oldTranslation) oldTranslation.remove();

        const div = document.createElement("div");
        div.id = "ai-translation";
        div.innerText = message.translation;
        div.style.position = "absolute";
        div.style.left = `${window.scrollX + message.position.left}px`;
        div.style.top = `${window.scrollY + message.position.bottom + 5}px`;
        div.style.backgroundColor = "yellow";
        div.style.padding = "8px";
        div.style.borderRadius = "5px";
        div.style.zIndex = "10000";

        // Hiệu ứng xuất hiện mượt mà
        div.style.opacity = "0";
        div.style.transition = "opacity 0.3s ease-in-out";
        document.body.appendChild(div);
        setTimeout(() => {
            div.style.opacity = "1";
        }, 50);

        // Xóa đoạn dịch khi click ra ngoài
        document.addEventListener("click", (clickEvent) => {
            if (clickEvent.target !== div) {
                div.style.opacity = "0";
                setTimeout(() => {
                    div.remove();
                }, 300);
            }
        }, { once: true });
    }
});

// Lưu vị trí chuột để hiển thị chính xác
document.addEventListener("mousemove", (e) => {
    window.lastMouseX = e.pageX;
    window.lastMouseY = e.pageY;
});
