let currentTheme = 'light';
let currentUILang = 'vi';
let translationInProgress = false; // Flag to mark if a translation request is running

const _spinnerKeyframes = document.createElement("style");
_spinnerKeyframes.textContent = `
.lds-spinner,
.lds-spinner div,
.lds-spinner div:after {
  box-sizing: border-box;
}
.lds-spinner {
  color: currentColor;
  display: inline-block;
  position: relative;
  width: 28px;
  height: 28px;
  color: #4a6bef;
}
.lds-spinner div {
  transform-origin: 14px 14px;
  animation: lds-spinner 1.2s linear infinite;
}
.lds-spinner div:after {
  content: " ";
  display: block;
  position: absolute;
  top: 1.12px;
  left: 12.88px;
  width: 2.24px;
  height: 6.16px;
  border-radius: 20%;
  background: currentColor;
}
.lds-spinner div:nth-child(1) {
  transform: rotate(0deg);
  animation-delay: -1.1s;
}
.lds-spinner div:nth-child(2) {
  transform: rotate(30deg);
  animation-delay: -1s;
}
.lds-spinner div:nth-child(3) {
  transform: rotate(60deg);
  animation-delay: -0.9s;
}
.lds-spinner div:nth-child(4) {
  transform: rotate(90deg);
  animation-delay: -0.8s;
}
.lds-spinner div:nth-child(5) {
  transform: rotate(120deg);
  animation-delay: -0.7s;
}
.lds-spinner div:nth-child(6) {
  transform: rotate(150deg);
  animation-delay: -0.6s;
}
.lds-spinner div:nth-child(7) {
  transform: rotate(180deg);
  animation-delay: -0.5s;
}
.lds-spinner div:nth-child(8) {
  transform: rotate(210deg);
  animation-delay: -0.4s;
}
.lds-spinner div:nth-child(9) {
  transform: rotate(240deg);
  animation-delay: -0.3s;
}
.lds-spinner div:nth-child(10) {
  transform: rotate(270deg);
  animation-delay: -0.2s;
}
.lds-spinner div:nth-child(11) {
  transform: rotate(300deg);
  animation-delay: -0.1s;
}
.lds-spinner div:nth-child(12) {
  transform: rotate(330deg);
  animation-delay: 0s;
}
@keyframes lds-spinner {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
`;

document.head.appendChild(_spinnerKeyframes);

// Check if the page is blocked
chrome.storage.sync.get(["hoverTranslate", "blockedSites"], (data) => {

    const blockedSites = data.blockedSites || [];

    if (window.location.hostname.includes('facebook.com') ||
        blockedSites.some(site => window.location.hostname.includes(site)) ||
        !data.hoverTranslate) {
        return;
    }

    // If the page is not blocked, continue running hover translate
    initHoverTranslate();
});

function initHoverTranslate() {

    let tooltip = null;
    let lastHoveredElement = null;
    let translateTimeout = null;
    let tooltipVisible = false;
    let lastTranslatedText = { original: "", translated: "" }; // Save the most recent translation
    let lastMouseEvent = null; // Store the latest mouse position

    // Update CSS for the tooltip and arrow
    const style = document.createElement("style");
    style.textContent = `
    #hover-translate-tooltip {
        position: absolute;
        background: #e3f2fd; /* Light blue */
        color: #212121; /* Dark text */
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        max-width: 200px;
        word-wrap: break-word;
        padding: 5px 8px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        text-align: center;
        z-index: 100000300;
        opacity: 0;
        transition: opacity 0.15s ease-in-out;
        pointer-events: none;
    }

    /* Tooltip arrow */
    #tooltip-arrow {
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid #e3f2fd;
        pointer-events: none;
        margin-bottom: 2px;
    }
    `;
    document.head.appendChild(style);

    document.addEventListener("scroll", () => {
        // Hide tooltip when scrolling
        hideTooltip();
    });

    document.addEventListener("mousemove", (event) => {
        // Always update the latest mouse position
        lastMouseEvent = event;
        const target = event.target;

        // Translate only when hovering elements with text (skip img, button, input, etc.)
        if (!target.matches("h1, h2, h3, h4, h5, h6, h7, a, label, b, header, yt-formatted-string, button, section, td, span, p")) {
            hideTooltip();
            return;
        }

        if ((target.tagName === 'SPAN' && target.parentElement && target.parentElement.tagName === 'SPAN') || (target.tagName === 'SPAN' && target.parentElement && target.parentElement.tagName === 'DIV')) {
            hideTooltip();
            return; // Skip span inside span
        }

        // Check if the cursor is over text
        const text = target.innerText?.trim();
        if (!text || text.length > 249) return; // Limit translation length

        // Get mouse position in viewport coordinates
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        // Check whether the cursor is on a text node
        const isOverText = isMouseOverTextNode(target, mouseX, mouseY);

        if (!isOverText) {
            hideTooltip();
            return;
        }

        // If hovering the same element, just move the tooltip without re-translating
        if (lastHoveredElement === target) {
            updateTooltipPosition(event);
            return;
        }

        lastHoveredElement = target;

        // Add mouseout handler to hide the tooltip when leaving the element
        target.addEventListener("mouseout", handleMouseOut, { once: true })

        // If this text matches the previous translation, show immediately
        if (lastTranslatedText.original === text && lastTranslatedText.translated) {
            showTooltip(event, lastTranslatedText.translated);
            return;
        }

        // If not translated yet, call the API after a short delay
        clearTimeout(translateTimeout);

        try {
            translateTimeout = setTimeout(() => {
                chrome.storage.sync.get(["targetLangCode"], (data) => {
                    const targetLang = data.targetLangCode || "vi"; // Default language if none saved
                    // Use the current mouse position when calling the API
                    fetchTranslation(text, targetLang, lastMouseEvent);
                });
            }, 200);
        } catch (error) { }
    });

    // Check whether the cursor is over a text node
    function isMouseOverTextNode(element, mouseX, mouseY) {
        // Get all text nodes in the element
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        // Tolerance to expand detection area (px)
        const tolerance = 5; // Add 5px around each text node

        let textNode;
        while (textNode = walker.nextNode()) {
            // Skip empty or whitespace-only nodes
            if (!textNode.textContent.trim()) continue;

            try {
                const range = document.createRange();
                range.selectNodeContents(textNode);

                const rects = range.getClientRects();

                // Check if the cursor is inside any expanded rect
                for (let i = 0; i < rects.length; i++) {
                    const rect = rects[i];
                    if (
                        mouseX >= (rect.left - tolerance) &&
                        mouseX <= (rect.right + tolerance) &&
                        mouseY >= (rect.top - tolerance) &&
                        mouseY <= (rect.bottom + tolerance)
                    ) {
                        return true;
                    }
                }
            } catch (e) { }
        }

        return false;
    }

    document.documentElement.addEventListener('mouseleave', () => {
        // When the mouse leaves the page, hide the tooltip and clear the timeout
        hideTooltip();
        clearTimeout(translateTimeout);
        lastHoveredElement = null; // Ensure reset
    });

    // Handle when the mouse leaves the element
    function handleMouseOut(event) {
        // Confirm the pointer actually left (not entering a child)
        const relatedTarget = event.relatedTarget;
        if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
            return; // Do nothing if moving into a child element
        }

        // If the pointer truly left the element, hide the tooltip
        hideTooltip();
    }

    async function fetchTranslation(text, targetLang, event) {
        try {
            // const response = await fetch("https://translate.vuhai.me/api/translate", {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json"
            //     },
            //     body: JSON.stringify({
            //         text: text,
            //         targetLang: targetLang,
            //         service: "microsoft" // Sử dụng Microsoft Translator
            //     })
            // });

            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            const result = await response.json();

            // Get source language code (auto-detected). Usually result[2].
            const detectedLangRaw = Array.isArray(result) && typeof result[2] === "string" ? result[2] : null;

            // Normalize language code (vi, en-US -> vi, en)
            const norm = (s) => (s || "").toLowerCase().split("-")[0];

            // If source language matches targetLang => do not show tooltip
            if (norm(detectedLangRaw) === norm(targetLang)) {
                // Remember the last attempt so it is not shown again
                lastTranslatedText = { original: text, translated: "" };
                hideTooltip();
                return;
            }


            // Get all translated parts (Google splits by sentence) and combine them
            const translatedText = Array.isArray(result) && Array.isArray(result[0])
                ? result[0]
                    .map((part) => (Array.isArray(part) && typeof part[0] === "string") ? part[0] : "")
                    .join("")
                    .trim()
                : "";

            if (translatedText) {
                // Save the most recent translation
                lastTranslatedText = { original: text, translated: translatedText };

                // If the mouse is still on the same element, show the result
                if (lastHoveredElement && lastHoveredElement.innerText?.trim() === text) {
                    // Use the latest mouse position instead of the initial one
                    const currentMouseEvent = lastMouseEvent || event;
                    showTooltip(currentMouseEvent, translatedText);
                }
            } else {
                // No translation retrieved — hide tooltip
                lastTranslatedText = { original: text, translated: "" };
                hideTooltip();
            }
        } catch (error) { 
            // Network/parse error — hide tooltip to avoid UI hanging
            hideTooltip();
        }
    }

    function updateTooltipPosition(event) {
        if (!tooltip) return;

        requestAnimationFrame(() => {
            const tooltipWidth = tooltip.offsetWidth;
            const tooltipHeight = tooltip.offsetHeight;
            const offsetX = 5;
            const offsetY = 14; // Default distance

            // Default position (show above cursor)
            let posX = event.pageX - tooltipWidth / 2;
            let posY = event.pageY - tooltipHeight - offsetY;

            // Check if tooltip overflows the top edge
            if (posY < window.scrollY) {
                // If it overflows top, show tooltip below the cursor
                posY = event.pageY + offsetY + 8;

                // Move the arrow to the top of the tooltip
                const arrow = tooltip.querySelector("#tooltip-arrow");
                if (arrow) {
                    arrow.style.top = "-6px";
                    arrow.style.bottom = "auto";
                    arrow.style.borderTop = "none";
                    arrow.style.borderBottom = "6px solid #e3f2fd";
                    arrow.style.marginTop = "2px";
                    arrow.style.marginBottom = "0";
                }
            } else {
                // Default case: show tooltip above the cursor
                const arrow = tooltip.querySelector("#tooltip-arrow");
                if (arrow) {
                    arrow.style.bottom = "-6px";
                    arrow.style.top = "auto";
                    arrow.style.borderBottom = "none";
                    arrow.style.borderTop = "6px solid #e3f2fd";
                    arrow.style.marginBottom = "2px";
                    arrow.style.marginTop = "0";
                }
            }

            // Check if tooltip overflows the left edge
            if (posX < window.scrollX) {
                posX = window.scrollX + 5;
            }

            // Check if tooltip overflows the right edge
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

        // Add setTimeout for smooth show effect
        setTimeout(() => {
            tooltip.style.opacity = "1";
            tooltipVisible = true;
        }, 10);
    }

    function hideTooltip() {
        if (tooltip && tooltipVisible) {
            tooltip.style.opacity = "0";
            tooltipVisible = false;

            lastHoveredElement = null;
        }
    }
}

// Get values from storage on initialization
chrome.storage.sync.get(['uiTheme', 'uiLang'], (data) => {
    currentTheme = data.uiTheme || 'light';
    currentUILang = data.uiLang || 'vi';
});

// Listen for storage changes
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
                // Using handleOutsideClick would be better; temporarily comment this remove line
                // oldIcon.remove();
            }
            return; // Exit early
        }

        // Remove old icon *only when* creating a new icon (ensure spinner is not removed)
        const oldIcon = document.getElementById("translate-icon");
        if (oldIcon) {
            oldIcon.remove();
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect(); // Get the position of the highlighted area

        const icon = document.createElement("div"); // Changed from img to div
        icon.id = "translate-icon";
        icon.style.position = "absolute";
        icon.style.left = `${window.scrollX + rect.left + (rect.width / 2) - 14}px`; // Centered
        icon.style.top = `${window.scrollY + rect.bottom + 5}px`;
        icon.style.width = "28px";
        icon.style.height = "28px";
        icon.style.cursor = "pointer";
        icon.style.transition = "transform 0.2s ease, opacity 0.15s ease";
        icon.style.zIndex = "2147483647";
        icon.style.opacity = "0.8";
        icon.style.backgroundImage = `url(${chrome.runtime.getURL("icon.png")})`; // Use background image instead
        icon.style.backgroundSize = "cover";
        icon.style.backgroundPosition = "center";

        // Append the icon
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

            // Remove the image and replace with a CSS spinner
            icon.innerHTML = ''; // Clear the image
            icon.style.backgroundImage = 'none';

            // Create the spinner HTML structure
            const spinner = document.createElement('div');
            spinner.className = 'lds-spinner';
            // Create the 12 divs needed for the spinner
            for (let i = 0; i < 12; i++) {
                const div = document.createElement('div');
                spinner.appendChild(div);
            }

            icon.appendChild(spinner);

            // Ensure spinner styles are injected
            _spinnerKeyframes.isConnected || document.head.appendChild(_spinnerKeyframes);

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

// Handle showing and hiding translation when clicking outside
chrome.runtime.onMessage.addListener((message) => {

    if (message.action === "showTranslation") {
        // Remove the previous result before showing a new one
        const oldTranslation = document.getElementById("ai-translation");
        if (oldTranslation) oldTranslation.remove();

        // --- Add this block to remove the icon ---
        const iconToRemove = document.getElementById("translate-icon");
        if (iconToRemove) {
            iconToRemove.style.transition = "opacity 0.15s ease-out"; // Add transition for fade-out effect
            iconToRemove.style.opacity = "0"; // Start fading the icon
            setTimeout(() => {
                iconToRemove.remove(); // Remove icon after the effect completes
            }, 150); // Duration matches the transition
        }
        // --- End of added block ---

        // Allow creating a new icon next time
        //translationInProgress = false;

        // Use the stored position from the icon click
        const position = message.position;

        // Create container for translation popup
        const div = document.createElement("div");
        div.id = "ai-translation";

        // Create header
        const header = document.createElement("div");
        header.className = "translation-header";

        // Logo and title
        const title = document.createElement("div");
        title.className = "translation-title";
        title.innerHTML = '<img src="' + chrome.runtime.getURL("icon.png") + '" class="translation-logo"> AI Translation';

        // Close button
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

        // Translation content - separate scrollable container
        const contentContainer = document.createElement("div");
        contentContainer.className = "translation-content-container";

        const content = document.createElement("div");
        content.className = "translation-content";
        content.textContent = message.translation;

        contentContainer.appendChild(content);
        div.appendChild(contentContainer);

        // Styling for main container
        div.style.position = "absolute";
        div.style.left = `${position.left}px`;
        div.style.top = `${position.bottom + 10}px`;
        div.style.minWidth = "300px";
        div.style.maxWidth = "600px";
        div.style.backgroundColor = currentTheme === 'dark' ? '#152039' : 'white';
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
        div.style.overflow = "hidden"; // Main container does not scroll

        // Styling for header
        header.style.padding = "10px 15px";
        header.style.backgroundColor = "#4a6bef";
        header.style.color = "white";
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";
        header.style.borderBottom = "1px solid #3a57d8";
        header.style.flexShrink = "0"; // Do not shrink

        // Styling for title
        title.style.display = "flex";
        title.style.alignItems = "center";
        title.style.fontWeight = "bold";
        title.style.fontSize = "14px";
        title.style.whiteSpace = "nowrap"; // Prevent wrapping

        // Styling for logo
        const logo = title.querySelector(".translation-logo");
        if (logo) {
            logo.style.width = "18px";
            logo.style.height = "18px";
            logo.style.marginRight = "8px";
            logo.style.backgroundColor = "white";
            logo.style.borderRadius = "50%";
            logo.style.padding = "2px";
        }

        // Styling for close button
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

        // Styling for content container (scrollable part)
        contentContainer.style.maxHeight = "250px"; // Limit height
        contentContainer.style.overflowY = "auto"; // Allow vertical scrolling
        contentContainer.style.overflowX = "hidden"; // Disable horizontal scroll
        contentContainer.style.padding = "15px";

        // Styling for content
        content.style.fontSize = "16px";
        content.style.wordBreak = "break-word"; // Handle long words
        content.style.whiteSpace = "pre-wrap";
        content.style.fontWeight = "400";

        document.body.appendChild(div);

        // Add scrollbar style for Chrome
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

        // Show effect after adding to DOM
        setTimeout(() => {
            div.style.opacity = "1";
            div.style.transform = "scale(1)";
            // Popup animation finished → now reset flag
            translationInProgress = false;
        }, 10);

        // Handle outside click
        document.addEventListener("mousedown", (clickEvent) => {
            if (clickEvent.target !== div && !div.contains(clickEvent.target)) {
                div.style.opacity = "0";
                div.style.transform = "scale(0.95)";
                setTimeout(() => div.remove(), 300);
            }
        }, { once: true });

        // Ensure popup is inside viewport
        const rect = div.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Check if popup goes beyond the right edge
        if (rect.right > viewportWidth) {
            div.style.left = `${Math.max(0, viewportWidth - rect.width - 20)}px`;
        }

        // Check if popup goes beyond the bottom edge
        if (rect.bottom > viewportHeight) {
            div.style.top = `${position.top - rect.height - 10}px`;
        }
    }
});