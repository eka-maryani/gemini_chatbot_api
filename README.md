# 🌸 Gemini Bloom AI - Chatbot Cerdas dengan UI Cantik

Aplikasi chatbot berbasis Google Gemini AI dengan antarmuka yang elegan, feminine, dan modern. Dibangun dengan Node.js, Express, dan vanilla JavaScript dengan tema "Blush & Bloom" yang memukau.

![Gemini Bloom AI](https://img.shields.io/badge/Gemini-AI-ff80ab?style=for-the-badge&logo=google&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## ✨ Fitur Utama

### 🎨 **UI/UX Premium**
- **Tema Blush & Bloom**: Desain feminine dengan warna pastel pink dan efek glassmorphism
- **Animasi Smooth**: Transisi halus dan micro-animations yang memanjakan mata
- **Responsive Design**: Tampilan sempurna di desktop dan mobile

### 🤖 **Kemampuan AI**
- **Multi-Model Support**: Pilih dari 5 model Gemini (Flash 2.5, Flash 2.5 Lite, Pro 2.5, Pro 3.0, Flash 2.0 Exp)
- **Multimodal Input**: Kirim teks, gambar, PDF, dan file lainnya
- **Image Generation**: Generate gambar dengan perintah natural language
- **Voice Input**: Bicara langsung ke chatbot menggunakan mikrofon
- **Code Highlighting**: Syntax highlighting otomatis untuk kode dengan tombol copy

### 💬 **Manajemen Chat**
- **Session History**: Semua percakapan tersimpan di browser
- **Inline Editing**: Edit pesan yang sudah dikirim
- **Regenerate Response**: Minta AI untuk memberikan jawaban baru
- **Export Chat**: Bagikan atau download percakapan
- **Rating System**: Beri feedback dengan thumbs up/down

### 🔐 **Keamanan & Privasi**
- **Dynamic API Key**: Atur API key dari frontend tanpa edit kode
- **Password Toggle**: Lihat/sembunyikan API key dengan icon mata
- **Local Storage**: Data tersimpan di browser, tidak di server
- **Delete Option**: Hapus API key kapan saja

---

## 🚀 Instalasi & Setup

### Prasyarat
- **Node.js** versi 18 atau lebih baru
- **NPM** atau **Yarn**
- **Google Gemini API Key** (gratis dari [Google AI Studio](https://aistudio.google.com/app/apikey))

### Langkah Instalasi

1. **Clone atau Download Project**
   ```bash
   cd gemini_chatbot_api
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables** (Opsional)
   
   Buat file `.env` di root folder:
   ```env
   GEMINI_API_KEY=your_api_key_here
   PORT=3000
   ```
   
   > **Catatan**: API key juga bisa diatur dari frontend melalui menu Settings, jadi file `.env` tidak wajib.

4. **Jalankan Server**
   ```bash
   npm start
   ```

5. **Buka Browser**
   
   Akses aplikasi di: `http://localhost:3000`

---

## 📖 Cara Penggunaan

### 1️⃣ **Setup API Key**

**Opsi A: Dari Frontend (Recommended)**
1. Klik icon **Settings** di sidebar kiri bawah
2. Masukkan API key Gemini Anda
3. Klik tombol mata untuk melihat/sembunyikan key
4. Klik **Save**

**Opsi B: Dari File `.env`**
1. Buat file `.env` di folder `starter`
2. Tambahkan: `GEMINI_API_KEY=your_key_here`
3. Restart server

### 2️⃣ **Mulai Chat**

1. **Ketik Pesan**: Tulis pertanyaan atau perintah di input box
2. **Pilih Model**: Klik dropdown di sebelah kiri tombol send untuk memilih model AI
3. **Voice Input**: Klik icon mikrofon untuk berbicara
4. **Attach Files**: Klik icon paperclip untuk upload gambar/dokumen
5. **Send**: Tekan Enter atau klik tombol send

### 3️⃣ **Generate Gambar**

Gunakan kata kunci berikut dalam pesan Anda:
- "create image of..."
- "generate image..."
- "draw..."
- "buat gambar..."
- "buatkan gambar..."

Contoh:
```
Buat gambar pemandangan gunung saat sunset dengan gaya anime
```

### 4️⃣ **Fitur Lanjutan**

**Edit Pesan**
- Hover pada pesan user → Klik icon **edit**
- Ubah teks → Klik **check** untuk save

**Regenerate Response**
- Hover pada pesan bot → Klik icon **refresh**
- Prompt akan dimuat ulang di input box

**Copy & Share**
- Klik icon **copy** untuk salin teks
- Klik icon **share** untuk export/download

**Rating**
- Klik **thumbs up** untuk feedback positif
- Klik **thumbs down** untuk feedback negatif

---

## 🎨 Kustomisasi

### Mengubah Tema Warna

Edit file `public/style.css` pada bagian `:root`:

```css
:root {
  --bg-color: #fdfbfd;              /* Background utama */
  --accent-pink: #ff80ab;           /* Warna accent */
  --text-dark: #5d4037;             /* Warna teks */
  --primary-gradient: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%);
}
```

### Menambah Model Baru

Edit file `public/index.html` pada bagian dropdown:

```html
<div class="dropdown-option" onclick="selectModel('model-id', 'Model Name', this)">
  <span>Model Name</span>
  <span class="material-symbols-rounded option-check">check</span>
</div>
```

### Mengubah Port Server

Edit file `.env`:
```env
PORT=8080
```

Atau langsung di `index.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

---

## 🛠️ Teknologi yang Digunakan

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Web framework
- **@google/genai** - Google Gemini AI SDK
- **dotenv** - Environment variables
- **cors** - Cross-Origin Resource Sharing

### Frontend
- **Vanilla JavaScript** - No framework, pure JS
- **Marked.js** (v4.3.0) - Markdown parser
- **Highlight.js** - Syntax highlighting untuk code blocks
- **Material Symbols** - Icon library dari Google
- **Google Fonts** - Playfair Display & Quicksand

### Styling
- **Pure CSS** - No framework, custom styling
- **Glassmorphism** - Efek kaca blur modern
- **CSS Animations** - Smooth transitions & keyframes
- **Flexbox & Grid** - Layout responsive

---

## 📁 Struktur Project

```
starter/
├── index.js                 # Backend server (Express + Gemini API)
├── package.json             # Dependencies & scripts
├── .env                     # Environment variables (optional)
├── README.md                # Dokumentasi ini
│
└── public/                  # Frontend files
    ├── index.html           # HTML structure
    ├── style.css            # Styling & animations
    └── script.js            # Frontend logic & API calls
```

---

## 🔧 API Endpoints

### `POST /api/chat`

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "model", "content": "Hi there!" }
  ],
  "files": [
    { "data": "base64_string", "mimeType": "image/png" }
  ],
  "model": "gemini-2.5-flash"
}
```

**Request Headers:**
```
Content-Type: application/json
x-gemini-api-key: your_api_key_here
```

**Response (Text):**
```json
{
  "result": "AI response text here..."
}
```

**Response (Image):**
```json
{
  "image": "base64_encoded_image_data"
}
```

**Error Response:**
```json
{
  "error": "Error message here"
}
```

---

## 🐛 Troubleshooting

### Server tidak bisa start
```bash
# Pastikan Node.js terinstall
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### API Key tidak bekerja
1. Pastikan API key valid dari [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Cek apakah key tersimpan di Settings atau `.env`
3. Refresh halaman setelah save API key

### Quota Exceeded Error
- Gemini API memiliki limit gratis per hari
- Tunggu beberapa saat atau upgrade ke paid plan
- Coba model yang lebih ringan (Flash 2.5 Lite)

### Voice Input tidak bekerja
- Fitur ini hanya bekerja di browser berbasis Chromium (Chrome, Edge, Brave)
- Pastikan browser memiliki akses ke mikrofon
- Coba di HTTPS atau localhost

### File upload gagal
- Maksimal ukuran file: ~10MB (tergantung model)
- Format yang didukung: image/*, .pdf, .txt
- Pastikan file tidak corrupt

---

## 🎯 Roadmap & Future Features

- [ ] Streaming responses (real-time typing effect)
- [ ] Export chat ke PDF/Markdown
- [ ] Dark mode toggle manual
- [ ] Multi-language support
- [ ] Voice output (Text-to-Speech)
- [ ] Plugin system untuk custom tools
- [ ] Cloud sync untuk chat history
- [ ] Collaborative chat rooms

---

## 📄 License

Project ini menggunakan **MIT License**. Anda bebas untuk:
- ✅ Menggunakan untuk project pribadi atau komersial
- ✅ Memodifikasi sesuai kebutuhan
- ✅ Mendistribusikan ulang
- ✅ Menjual sebagai bagian dari produk Anda

**Syarat**: Sertakan copyright notice dan license text dalam distribusi.

---

## 🙏 Credits & Acknowledgments

- **Google Gemini AI** - Powerful AI models
- **Material Symbols** - Beautiful icon library
- **Marked.js & Highlight.js** - Markdown & code rendering
- **Google Fonts** - Typography excellence

---

## 💌 Kontribusi

Kontribusi sangat diterima! Jika Anda ingin berkontribusi:

1. Fork repository ini
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

---

## 📞 Support & Contact

Jika ada pertanyaan atau butuh bantuan:
- 🐛 **Bug Reports**: Buat issue di GitHub
- 💡 **Feature Requests**: Buat issue dengan label "enhancement"
- 📧 **Email**: [your-email@example.com]
- 💬 **Discord**: [Your Discord Server]

---

## ⭐ Star This Project!

Jika project ini bermanfaat, jangan lupa kasih **star** ⭐ di GitHub!

---

<div align="center">
  <p>Made with 💖 by <strong>Your Name</strong></p>
  <p>Powered by <strong>Google Gemini AI</strong></p>
  
  <br>
  
  **Happy Chatting! 🌸✨**
</div>
