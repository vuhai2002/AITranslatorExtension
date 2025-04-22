let currentTheme = 'light';
let currentUILang = 'vi';
// Đánh dấu xem có yêu cầu dịch đang chạy không
let translationInProgress = false;

const _spinnerKeyframes = document.createElement("style");
_spinnerKeyframes.textContent = `
@keyframes spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(_spinnerKeyframes);

// Kiểm tra nếu trang bị chặn
chrome.storage.sync.get(["hoverTranslate", "blockedSites"], (data) => {

    const blockedSites = data.blockedSites || [];

    if (blockedSites.some(site => window.location.hostname.includes(site)) || !data.hoverTranslate) {
        return;
    }

    // Nếu trang không bị chặn, tiếp tục chạy hover dịch
    initHoverTranslate();
});

function initHoverTranslate() {

    let tooltip = null;
    let lastHoveredElement = null;
    let translateTimeout = null;
    let tooltipVisible = false;
    let lastTranslatedText = { original: "", translated: "" }; // Lưu đoạn dịch gần nhất
    let lastMouseEvent = null; // Biến mới để lưu vị trí chuột mới nhất

    // Cập nhật CSS cho tooltip và mũi tên
    const style = document.createElement("style");
    style.textContent = `
    #hover-translate-tooltip {
        position: absolute;
        background: #e3f2fd; /* Xanh nhạt */
        color: #212121; /* Màu chữ tối */
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        max-width: 250px;
        word-wrap: break-word;
        padding: 8px 12px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        text-align: left;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
        transform: scale(0.95);
        pointer-events: none; /* Thêm dòng này để tooltip không can thiệp vào sự kiện chuột */
    }

    /* Mũi tên của tooltip */
    #tooltip-arrow {
        position: absolute;
        bottom: -8px; /* Để mũi tên chỉ xuống dưới */
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid #e3f2fd; /* Cùng màu với tooltip */
        pointer-events: none; /* Thêm dòng này để mũi tên cũng không can thiệp vào sự kiện chuột */
    }
    `;
    document.head.appendChild(style);


    document.addEventListener("mousemove", (event) => {
        // Luôn cập nhật vị trí chuột mới nhất
        lastMouseEvent = event;
        const target = event.target;

        // Chỉ dịch nếu hover vào các thẻ có chữ (loại bỏ img, button, input, v.v.)
        if (!target.matches("h1, h2, h3, h4, h5, h6, h7, a, label, b, span, yt-formatted-string")) {
            hideTooltip();
            return;
        }

        const text = target.innerText.trim();
        if (!text || text.length > 150) return; // Giới hạn chữ dịch

        // Nếu di chuột trong cùng một phần tử, chỉ di chuyển tooltip mà không dịch lại
        if (lastHoveredElement === target) {
            updateTooltipPosition(event);
            return;
        }

        lastHoveredElement = target;

        // Thêm sự kiện mouseout cho phần tử này để ẩn tooltip khi di chuột ra ngoài
        target.addEventListener("mouseout", handleMouseOut, { once: true })

        // Nếu văn bản này trùng với lần dịch trước đó, hiển thị ngay lập tức
        if (lastTranslatedText.original === text) {
            showTooltip(event, lastTranslatedText.translated);
            return;
        }

        // Nếu chưa dịch, gọi API sau một khoảng thời gian
        clearTimeout(translateTimeout);
        translateTimeout = setTimeout(() => {
            chrome.storage.sync.get(["targetLangCode"], (data) => {
                const targetLang = data.targetLangCode || "vi"; // Ngôn ngữ mặc định nếu chưa lưu
                // Sử dụng vị trí chuột hiện tại khi gọi API, không phải vị trí ban đầu
                fetchTranslation(text, targetLang, lastMouseEvent);
            });
        }, 200);
    });

    // Thêm hàm xử lý khi di chuột ra khỏi phần tử
    function handleMouseOut(event) {
        // Xác minh rằng con trỏ thực sự rời khỏi phần tử (không phải vào phần tử con)
        const relatedTarget = event.relatedTarget;
        if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
            return; // Nếu di chuyển vào phần tử con, không làm gì
        }

        // Nếu con trỏ thực sự rời khỏi phần tử, ẩn tooltip
        hideTooltip();
    }

    async function fetchTranslation(text, targetLang, event) {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

        try {
            const response = await fetch(url);
            const result = await response.json();
            const translatedText = result[0][0][0];

            // Lưu bản dịch gần nhất
            lastTranslatedText = { original: text, translated: translatedText };

            // Nếu chuột vẫn trên cùng một phần tử thì hiển thị kết quả
            if (lastHoveredElement && lastHoveredElement.innerText.trim() === text) {
                // Sử dụng vị trí chuột hiện tại thay vì vị trí khi bắt đầu dịch
                const currentMouseEvent = lastMouseEvent || event;
                showTooltip(currentMouseEvent, translatedText);
            }
        } catch (error) { }
    }

    function updateTooltipPosition(event) {
        if (!tooltip) return;

        requestAnimationFrame(() => {
            const tooltipWidth = tooltip.offsetWidth;
            const tooltipHeight = tooltip.offsetHeight;
            const offsetX = 5;
            const offsetY = 10; // Khoảng cách mặc định

            // Tính toán vị trí mặc định (hiển thị phía trên con trỏ)
            let posX = event.pageX - tooltipWidth / 2;
            let posY = event.pageY - tooltipHeight - offsetY;

            // Kiểm tra xem tooltip có vượt khỏi cạnh trên không
            if (posY < window.scrollY) {
                // Nếu vượt khỏi cạnh trên, hiển thị tooltip phía dưới con trỏ
                posY = event.pageY + offsetY + 15;

                // Di chuyển mũi tên lên trên đầu tooltip
                const arrow = tooltip.querySelector("#tooltip-arrow");
                if (arrow) {
                    arrow.style.top = "-8px";
                    arrow.style.bottom = "auto";
                    arrow.style.borderTop = "none";
                    arrow.style.borderBottom = "8px solid #e3f2fd";
                }
            } else {
                // Trường hợp mặc định, hiển thị tooltip phía trên con trỏ
                const arrow = tooltip.querySelector("#tooltip-arrow");
                if (arrow) {
                    arrow.style.bottom = "-8px";
                    arrow.style.top = "auto";
                    arrow.style.borderBottom = "none";
                    arrow.style.borderTop = "8px solid #e3f2fd";
                }
            }

            // Kiểm tra xem tooltip có vượt khỏi cạnh trái không
            if (posX < window.scrollX) {
                posX = window.scrollX + 5;
            }

            // Kiểm tra xem tooltip có vượt khỏi cạnh phải không
            if (posX + tooltipWidth > window.scrollX + window.innerWidth) {
                posX = window.scrollX + window.innerWidth - tooltipWidth - 5;
            }

            tooltip.style.left = `${posX}px`;
            tooltip.style.top = `${posY}px`;
        });
    }

    function showTooltip(event, translatedText) {
        if (!tooltip) {
            tooltip = document.createElement("div");
            tooltip.id = "hover-translate-tooltip";
            tooltip.innerHTML = `<span id="tooltip-text"></span><div id="tooltip-arrow"></div>`;
            document.body.appendChild(tooltip);
        }

        tooltip.querySelector("#tooltip-text").textContent = translatedText;
        updateTooltipPosition(event);

        // Thêm setTimeout để có hiệu ứng mượt mà khi hiển thị
        setTimeout(() => {
            tooltip.style.opacity = "1";
            tooltip.style.transform = "scale(1)";
            tooltipVisible = true;
        }, 10);
    }

    function hideTooltip() {
        if (tooltip && tooltipVisible) {
            tooltip.style.opacity = "0";
            tooltip.style.transform = "scale(0.95)";
            tooltipVisible = false;

            lastHoveredElement = null;
        }
    }
}

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

document.addEventListener("mouseup", (e) => {
    // Use a minimal timeout to allow the browser to finalize the selection state.
    setTimeout(() => {

        if (translationInProgress) {
            return;
        }

        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        // 1. Check if the selection is collapsed (just a cursor) OR if the trimmed text is empty.
        //    If either is true, it's not a valid selection for translation.
        if (selection.isCollapsed || selectedText.length === 0) {
            // Attempt to remove any existing icon if the selection is lost
            const oldIcon = document.getElementById("translate-icon");
            if (oldIcon && e.target !== oldIcon && !translationInProgress) {
                // Sử dụng handleOutsideClick sẽ tốt hơn, tạm thời comment dòng remove này
                // oldIcon.remove();
           }
           return; // Exit early
        }

        // Xóa icon cũ *chỉ khi* tạo icon mới (đảm bảo không xóa spinner)
        const oldIcon = document.getElementById("translate-icon");
        if (oldIcon) {
            oldIcon.remove();
        }

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
        icon.style.transition = "transform 0.2s ease, opacity 0.2s ease";
        icon.style.zIndex = "2147483647";
        icon.style.opacity = "0";

        // Append the icon (simplified)
        document.documentElement.appendChild(icon);

        // Fade icon in
        requestAnimationFrame(() => {
            icon.style.opacity = "1";
        });

        // --- Icon Event Listeners ---

        icon.addEventListener("click", (clickEvent) => {
            clickEvent.stopPropagation(); // Prevent this click from triggering the document's click listener below

            if (translationInProgress) return; // Double-check
            translationInProgress = true;

            // Store position *at the time of the click*
            window.translationPosition = {
                left: window.scrollX + rect.left,
                top: window.scrollY + rect.top,
                bottom: window.scrollY + rect.bottom,
                right: window.scrollX + rect.right,
                width: rect.width,
                height: rect.height
            };

            // Change to spinner
            icon.src = chrome.runtime.getURL("spinner.png");
            icon.style.animation = "spin 1s linear infinite";
            _spinnerKeyframes.isConnected || document.head.appendChild(_spinnerKeyframes); // Ensure keyframes are present

            chrome.runtime.sendMessage({
                action: "translate",
                text: selectedText,
                position: window.translationPosition // Send stored position
            });
        });

        icon.addEventListener("mouseover", () => {
            if (!translationInProgress) { // Don't scale spinner
                icon.style.transform = "scale(1.15)";
            }
        });

        icon.addEventListener("mouseout", () => {
            icon.style.transform = "scale(1)";
        });

        // --- Listener to Remove Icon on Outside Click ---
        // Use a more robust way to handle outside clicks
        const handleOutsideClick = (outsideClickEvent) => {
            const clickedIcon = outsideClickEvent.target === icon;
            const iconExists = document.getElementById("translate-icon") === icon;

            // If the icon still exists AND the click was NOT on the icon itself...
            if (iconExists && !clickedIcon) {
                // ...and if we are NOT currently translating (i.e., it's still the initial icon)...
                if (!translationInProgress) {
                    icon.style.opacity = "0"; // Fade out
                    setTimeout(() => icon.remove(), 200); // Remove after fade
                }
                // Clean up this specific listener
                document.removeEventListener("mousedown", handleOutsideClick, true); // Use capture phase
            } else if (!iconExists) {
                // Icon was removed by other means (e.g., new selection), clean up listener
                document.removeEventListener("mousedown", handleOutsideClick, true);
            }
        };

        // Add the listener in the capture phase to catch clicks before they might be stopped elsewhere.
        // Use mousedown as it often feels more responsive for this kind of dismissal.
        document.addEventListener("mousedown", handleOutsideClick, { capture: true, once: false }); // once: false initially, manually remove later
    }, 50);  // Increased timeout slightly to 50ms, adjust if needed
});

// Also ensure the keyframes are added reliably if not already present
// Check if keyframes are already added before appending
if (!document.head.contains(_spinnerKeyframes)) {
    document.head.appendChild(_spinnerKeyframes);
}

// Xử lý đoạn dịch hiển thị và ẩn khi click ra ngoài
chrome.runtime.onMessage.addListener((message) => {

    if (message.action === "showTranslation") {
        // Xóa kết quả cũ trước khi hiển thị mới
        const oldTranslation = document.getElementById("ai-translation");
        if (oldTranslation) oldTranslation.remove();

        // --- Thêm đoạn code này để xóa icon ---
        const iconToRemove = document.getElementById("translate-icon");
        if (iconToRemove) {
            iconToRemove.style.transition = "opacity 0.3s ease-out"; // Thêm transition cho hiệu ứng mờ dần
            iconToRemove.style.opacity = "0"; // Bắt đầu làm mờ icon
            setTimeout(() => {
                iconToRemove.remove(); // Xóa icon sau khi hiệu ứng hoàn tất
            }, 300); // Thời gian khớp với transition
        }
        // --- Kết thúc đoạn code thêm ---
        // Cho phép tạo icon mới lần sau
        //translationInProgress = false;

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
            translationInProgress = false;
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
        div.style.maxWidth = "600px";
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
        content.style.whiteSpace = "pre-wrap";
        content.style.fontWeight = "400";

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
            // giờ popup đã hiện xong animation → mới reset flag
            translationInProgress = false;
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