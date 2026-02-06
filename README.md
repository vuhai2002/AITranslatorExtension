# 🌐 AI Translator - Chrome Extension

<p align="center">
  <img src="translator-extension/icon.png" alt="AI Translator Logo" width="128" height="128">
</p>

<p align="center">
  <strong>Dịch Thông Minh Bằng AI GPT</strong><br>
  Dịch nhanh văn bản với AI. Hover để dịch tức thì, bôi đen để dịch nhanh, hỗ trợ UI Tiếng Việt & Dark Mode.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.2-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/manifest-v3-green.svg" alt="Manifest V3">
  <img src="https://img.shields.io/badge/license-MIT-orange.svg" alt="License">
</p>

---

## 📋 Mục Lục

- [✨ Tính Năng](#-tính-năng)
- [🖼️ Ảnh Chụp Màn Hình](#️-ảnh-chụp-màn-hình)
- [🛠️ Cài Đặt](#️-cài-đặt)
- [📖 Hướng Dẫn Sử Dụng](#-hướng-dẫn-sử-dụng)
- [⚙️ Cấu Hình](#️-cấu-hình)
- [🏗️ Cấu Trúc Dự Án](#️-cấu-trúc-dự-án)
- [🔧 Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [🤝 Đóng Góp](#-đóng-góp)
- [📄 Giấy Phép](#-giấy-phép)

---

## ✨ Tính Năng

### 🎯 Tính Năng Chính

| Tính Năng | Mô Tả |
|-----------|-------|
| **🖱️ Dịch Khi Hover** | Di chuột qua văn bản để xem bản dịch tức thì trong tooltip |
| **📝 Dịch Khi Bôi Đen** | Chọn văn bản và nhấp vào biểu tượng dịch để xem bản dịch đầy đủ |
| **🌍 Hỗ Trợ 50+ Ngôn Ngữ** | Dịch sang/từ hơn 50 ngôn ngữ phổ biến trên thế giới |
| **🎨 Chế Độ Tối/Sáng** | Hỗ trợ Dark Mode và Light Mode theo sở thích |
| **🇻🇳 UI Tiếng Việt** | Giao diện hoàn toàn bằng tiếng Việt (có thể chuyển sang tiếng Anh) |
| **🔒 Chặn Trang Web** | Tắt tính năng hover translate trên các trang web cụ thể |
| **📋 Menu Context** | Nhấp chuột phải để dịch văn bản đã chọn |

### 🌐 Ngôn Ngữ Hỗ Trợ

Extension hỗ trợ dịch sang/từ hơn **50 ngôn ngữ** bao gồm:

<details>
<summary>📌 Xem danh sách đầy đủ</summary>

| Nhóm | Ngôn Ngữ |
|------|----------|
| **Châu Á** | Tiếng Việt, Tiếng Anh, Tiếng Trung (Giản thể & Phồn thể), Tiếng Nhật, Tiếng Hàn, Tiếng Thái, Tiếng Lào, Tiếng Khmer, Tiếng Myanmar, Tiếng Hindi, Tiếng Bengali, Tiếng Tamil, Tiếng Telugu, Tiếng Malayalam, Tiếng Punjabi, Tiếng Urdu |
| **Châu Âu** | Tiếng Đức, Tiếng Pháp, Tiếng Tây Ban Nha, Tiếng Bồ Đào Nha, Tiếng Ý, Tiếng Hà Lan, Tiếng Nga, Tiếng Ba Lan, Tiếng Séc, Tiếng Hungary, Tiếng Romania, Tiếng Bulgaria, Tiếng Hy Lạp, Tiếng Thổ Nhĩ Kỳ, Tiếng Ukraine, Tiếng Serbia, Tiếng Croatia, Tiếng Slovak, Tiếng Slovenia, Tiếng Lithuania, Tiếng Latvia, Tiếng Estonia, Tiếng Phần Lan, Tiếng Thụy Điển, Tiếng Na Uy, Tiếng Đan Mạch |
| **Trung Đông** | Tiếng Ả Rập, Tiếng Hebrew, Tiếng Ba Tư, Tiếng Kurdish |
| **Đông Nam Á** | Tiếng Indonesia, Tiếng Malaysia, Tiếng Filipino |
| **Khác** | Tiếng Swahili, Tiếng Afrikaans, Tiếng Malta, Tiếng Sinhala, Tiếng Hmong |

</details>

---

## 🖼️ Ảnh Chụp Màn Hình

### Giao Diện Popup (Light Mode)
```
┌─────────────────────────────────────┐
│  🌐  AI Translator                  │
├─────────────────────────────────────┤
│  Giao diện:    ☀️ ────●─── 🌙       │
│  Ngôn ngữ UI:  VI ────●─── EN       │
├─────────────────────────────────────┤
│  Dịch sang:   [Tiếng Việt     ▼]   │
│  ☑ Tra cứu khi di chuột            │
│  ☐ Tắt dịch khi di chuột trên...   │
├─────────────────────────────────────┤
│  ℹ️ Chọn văn bản và nhấp vào biểu   │
│  tượng dịch để dịch tức thì        │
│  Translate model: gpt-4.1 nano     │
├─────────────────────────────────────┤
│         [  Lưu cài đặt  ]          │
└─────────────────────────────────────┘
```

### Tính Năng Dịch Khi Hover
Khi di chuột qua văn bản tiếng nước ngoài, tooltip hiển thị bản dịch:
```
              ┌────────────────────┐
              │   Xin chào!        │
              │        ▼           │
              └────────────────────┘
        "Hello World" ← (văn bản gốc)
```

### Tính Năng Dịch Khi Bôi Đen
1. Bôi đen văn bản cần dịch
2. Nhấp vào biểu tượng 🌐 xuất hiện
3. Xem kết quả trong popup đẹp mắt

---

## 🛠️ Cài Đặt

### Cài Đặt Từ Source Code

1. **Clone repository**
   ```bash
   git clone https://github.com/vuhai2002/AITranslatorExtension.git
   ```

2. **Mở Chrome Extensions**
   - Truy cập `chrome://extensions/`
   - Bật **Developer mode** (góc trên bên phải)

3. **Load extension**
   - Nhấp vào **Load unpacked**
   - Chọn thư mục `translator-extension`

4. **Sử dụng**
   - Biểu tượng extension sẽ xuất hiện trên toolbar của Chrome
   - Nhấp vào để mở popup cài đặt

---

## 📖 Hướng Dẫn Sử Dụng

### 1️⃣ Dịch Khi Di Chuột (Hover Translate)

> **Lưu ý:** Tính năng này phải được bật trong cài đặt

1. Di chuyển con trỏ chuột đến văn bản cần dịch
2. Đợi khoảng 200ms
3. Tooltip với bản dịch sẽ xuất hiện phía trên con trỏ

**Các element hỗ trợ:**
- Headings (h1-h7)
- Links, Labels, Buttons
- Paragraphs, Spans
- Table cells, Sections
- YouTube formatted strings

### 2️⃣ Dịch Khi Bôi Đen (Select Translate)

1. **Bôi đen** văn bản cần dịch
2. Biểu tượng 🌐 nhỏ sẽ xuất hiện ngay dưới vùng chọn
3. **Nhấp** vào biểu tượng
4. Spinner loading hiển thị trong khi chờ
5. Popup kết quả xuất hiện với:
   - Header màu xanh với logo
   - Nút đóng (×)
   - Nội dung dịch có thể scroll

### 3️⃣ Dịch Từ Context Menu

1. **Bôi đen** văn bản cần dịch
2. **Nhấp chuột phải**
3. Chọn **"Dịch với AI Translator"**

---

## ⚙️ Cấu Hình

### Cài Đặt Trong Popup

| Tùy Chọn | Mô Tả | Mặc Định |
|----------|-------|----------|
| **Giao diện** | Chọn Light Mode hoặc Dark Mode | Light |
| **Ngôn ngữ UI** | Tiếng Việt hoặc English | Tiếng Việt |
| **Dịch sang** | Ngôn ngữ đích cho bản dịch | Tiếng Việt |
| **Tra cứu khi di chuột** | Bật/tắt tính năng hover translate | Tắt |
| **Tắt dịch trên trang này** | Chặn hover translate trên trang hiện tại | Tắt |

### API Dịch Thuật

Extension sử dụng 2 nguồn dịch:

| Service | Endpoint | Mô Tả |
|---------|----------|-------|
| **Google Translate** | `translate.googleapis.com` | Dùng cho hover translate (miễn phí, nhanh) |
| **Custom API** | `translate.vuhai.me` | Dùng cho select translate (GPT-4.1 nano, Microsoft Translator) |

---

## 🏗️ Cấu Trúc Dự Án

```
AITranslatorExtension/
├── 📄 README.md                    # File này
├── 📄 .gitignore                   # Git ignore rules
│
└── 📁 translator-extension/        # Source code của extension
    ├── 📄 manifest.json            # Chrome extension manifest (v3)
    ├── 📄 background.js            # Service worker xử lý logic nền
    ├── 📄 content.js               # Content script chạy trên mọi trang
    ├── 📄 popup.html               # Giao diện popup khi click icon
    ├── 📄 popup.js                 # Logic cho popup
    ├── 📄 styles.css               # Styles cho popup
    └── 🖼️ icon.png                 # Logo của extension (16x16, 48x48, 128x128)
```

### Chi Tiết Các File

| File | Chức Năng |
|------|-----------|
| **manifest.json** | Cấu hình extension: permissions, scripts, icons, version |
| **background.js** | Service worker: xử lý context menu, gọi API dịch, gửi kết quả về content script |
| **content.js** | Chạy trên mọi trang web: hover translate, select translate, hiển thị popup kết quả |
| **popup.html** | Giao diện cài đặt: theme toggle, language selector, checkboxes |
| **popup.js** | Logic popup: lưu/load settings từ chrome.storage.sync |
| **styles.css** | CSS variables cho light/dark theme, animations, responsive design |

---

## 🔧 Công Nghệ Sử Dụng

### Core Technologies

| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|-----------|----------|
| **Chrome Extension Manifest** | v3 | Cấu trúc extension hiện đại |
| **JavaScript ES6+** | - | Logic và DOM manipulation |
| **CSS3** | - | Styling với CSS Variables, Animations |
| **HTML5** | - | Cấu trúc popup |

### Chrome APIs Sử Dụng

```javascript
// Storage - Lưu trữ settings
chrome.storage.sync.get()
chrome.storage.sync.set()
chrome.storage.onChanged.addListener()

// Context Menus - Menu chuột phải
chrome.contextMenus.create()
chrome.contextMenus.onClicked.addListener()

// Scripting - Chạy script trong tab
chrome.scripting.executeScript()

// Messaging - Giao tiếp giữa các script
chrome.runtime.sendMessage()
chrome.runtime.onMessage.addListener()
chrome.tabs.sendMessage()

// Tabs - Tương tác với tabs
chrome.tabs.query()
chrome.tabs.reload()
```

### External APIs

| API | URL | Mục Đích |
|-----|-----|----------|
| Google Translate (Unofficial) | `translate.googleapis.com/translate_a/single` | Hover translate |
| Custom Translation API | `translate.vuhai.me/api/translate` | Select translate với GPT-4.1 |

---

## 🎨 Thiết Kế UI/UX

### Color Palette

#### Light Theme
```css
--bg-color: #ffffff;
--text-color: #333333;
--primary-color: #4a6bef;
--secondary-color: #f7f9ff;
--border-color: #e0e6ff;
```

#### Dark Theme
```css
--bg-color: #152039;
--text-color: #e0e0e0;
--primary-color: #5d7aff;
--secondary-color: #2a2f45;
--border-color: #3a3f52;
```

### Animations

- **Fade In/Out** - Cho tooltips và popups
- **Scale** - Cho hover effects trên icons
- **Slide In** - Cho thông báo thành công
- **Spinner** - Loading animation 12-dot CSS spinner

---

## 🔒 Quyền Yêu Cầu (Permissions)

| Permission | Lý Do |
|------------|-------|
| **storage** | Lưu trữ cài đặt người dùng |
| **contextMenus** | Tạo menu "Dịch với AI Translator" khi right-click |
| **activeTab** | Truy cập tab hiện tại để lấy văn bản đã chọn |
| **scripting** | Chạy script để đọc selection khi dùng context menu |

---

## 🐛 Xử Lý Lỗi

Extension xử lý các trường hợp lỗi sau:

| Lỗi | Xử Lý |
|-----|-------|
| **Mạng không ổn định** | Ẩn tooltip/spinner, không hiển thị lỗi |
| **API trả về lỗi** | Gửi message `translationFailed`, ẩn spinner |
| **Văn bản quá dài** | Giới hạn 249 ký tự cho hover translate |
| **Ngôn ngữ nguồn = đích** | Không hiển thị tooltip (tránh dịch thừa) |
| **Facebook blocked** | Tự động tắt hover translate trên facebook.com |

---

## 🚀 Tối Ưu Hiệu Năng

- **Debounce** - Hover translate có delay 200ms
- **Cache** - Lưu bản dịch gần nhất để tránh gọi API lại
- **Lazy Loading** - Tooltip chỉ tạo khi cần
- **Event Delegation** - Sử dụng một listener cho nhiều elements
- **RequestAnimationFrame** - Smooth positioning cho tooltip

---

## 🤝 Đóng Góp

Mọi đóng góp đều được hoan nghênh! Hãy:

1. **Fork** repository này
2. Tạo **branch** mới (`git checkout -b feature/TinhNangMoi`)
3. **Commit** thay đổi (`git commit -m 'Thêm tính năng mới'`)
4. **Push** lên branch (`git push origin feature/TinhNangMoi`)
5. Tạo **Pull Request**

### Báo Lỗi

Nếu gặp lỗi, vui lòng tạo [Issue](https://github.com/vuhai2002/AITranslatorExtension/issues) với:
- Mô tả lỗi chi tiết
- Các bước tái tạo lỗi
- Screenshots (nếu có)
- Phiên bản Chrome và OS

---

## 📄 Giấy Phép

Dự án này được phát hành dưới giấy phép **MIT License**.

---

## 👨‍💻 Tác Giả

**Vũ Hải**

- 🌐 Website: [vuhai.me](https://vuhai.me)
- 📧 Email: contact@vuhai.me
- 🐙 GitHub: [@vuhai2002](https://github.com/vuhai2002)

---

<p align="center">
  Made with ❤️ in Vietnam 🇻🇳
</p>

<p align="center">
  <a href="#-ai-translator---chrome-extension">⬆️ Quay lại đầu trang</a>
</p>
