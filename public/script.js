// --- STATE / KEADAAN ---
// allSessions: Array dari { id, title, messages: [], timestamp }
let allSessions = JSON.parse(localStorage.getItem('gemini_sessions')) || [];
let currentSessionId = null;

// File sementara untuk pesan saat ini
let selectedFiles = [];
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key') || '';

const chatBox = document.getElementById('chat-box');
const welcomeScreen = document.getElementById('welcome-screen');
const historyListEl = document.getElementById('history-list');
const userInput = document.getElementById('user-input');
const fileInput = document.getElementById('file-input');
const filePreview = document.getElementById('file-preview');

if (GEMINI_API_KEY) document.getElementById('api-key-input').value = GEMINI_API_KEY;

// --- INISIALISASI ---
window.addEventListener('DOMContentLoaded', () => {
  // Konfigurasi Marked untuk custom code blocks
  const renderer = new marked.Renderer();
  renderer.code = function (code, language) {
    const lang = language || 'plaintext';
    const validLang = hljs.getLanguage(lang) ? lang : 'plaintext';
    const highlighted = hljs.highlight(code, { language: validLang }).value;

    return `
      <div class="code-block-wrapper">
        <div class="code-header">
          <span class="code-lang">${lang}</span>
          <button class="code-copy-btn" onclick="copyCode(this)">
            <span class="material-symbols-rounded">content_copy</span> Copy
          </button>
        </div>
        <pre><code class="hljs language-${validLang}">${highlighted}</code></pre>
        <div style="display:none" class="raw-code">${encodeURIComponent(code)}</div>
      </div>
    `;
  };
  marked.setOptions({ renderer: renderer });

  renderSidebar();
  // Mulai di welcome screen (state chat baru)
  // Kecuali jika ingin load session terakhir:
  // if(allSessions.length > 0) loadSession(allSessions[allSessions.length-1].id);
});

window.copyCode = (btn) => {
  const wrapper = btn.closest('.code-block-wrapper');
  const rawCode = decodeURIComponent(wrapper.querySelector('.raw-code').innerText);

  navigator.clipboard.writeText(rawCode).then(() => {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<span class="material-symbols-rounded">check</span> Copied`;
    btn.style.color = 'var(--accent-success)';
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.color = '';
    }, 2000);
  });
};

// --- LOGIKA SIDEBAR ---
function renderSidebar() {
  historyListEl.innerHTML = '';
  // Urutkan dari yang terbaru
  const sorted = [...allSessions].sort((a, b) => b.timestamp - a.timestamp);

  if (sorted.length === 0) {
    historyListEl.innerHTML = `<div style="padding:10px; text-align:center; color:var(--text-muted); font-size:0.85rem"><i>No chats yet</i></div>`;
    return;
  }

  sorted.forEach(session => {
    const div = document.createElement('div');
    div.className = `history-item ${session.id === currentSessionId ? 'active' : ''}`;
    div.innerHTML = `
          <span class="material-symbols-rounded icon">chat_bubble_outline</span>
          <span class="title">${session.title}</span>
          <span class="material-symbols-rounded delete-btn" onclick="deleteSession(event, '${session.id}')">delete</span>
        `;
    div.onclick = (e) => {
      // Cegah trigger jika tombol delete diklik
      if (e.target.classList.contains('delete-btn') || e.target.innerText === 'delete') return;
      loadSession(session.id);
    };
    historyListEl.appendChild(div);
  });
}

function createNewSession(firstUserMsg) {
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const title = firstUserMsg.length > 25 ? firstUserMsg.substring(0, 25) + '...' : firstUserMsg;

  const newSession = {
    id: id,
    title: title,
    messages: [],
    timestamp: Date.now()
  };

  allSessions.push(newSession);
  currentSessionId = id;
  saveAllSessions();
  renderSidebar();
  return newSession;
}

function saveToCurrentSession(role, content, attachments = []) {
  if (!currentSessionId) return; // Seharusnya tidak terjadi

  const sessionIdx = allSessions.findIndex(s => s.id === currentSessionId);
  if (sessionIdx === -1) return;

  const msgObj = {
    id: `msg-${Date.now()}-${Math.random()}`,
    role: role,
    content: content,
    attachments: attachments,
    timestamp: Date.now()
  };

  allSessions[sessionIdx].messages.push(msgObj);
  // Update timestamp agar pindah ke atas
  allSessions[sessionIdx].timestamp = Date.now();
  saveAllSessions();
  renderSidebar(); // Re-render untuk tampilkan active state/order yang diupdate
  return msgObj;
}

function loadSession(id) {
  const session = allSessions.find(s => s.id === id);
  if (!session) return;

  currentSessionId = id;
  welcomeScreen.style.display = 'none';
  chatBox.innerHTML = ''; // Clear view

  // Render messages
  session.messages.forEach(msg => renderMessage(msg));

  renderSidebar(); // Update class active
  if (window.innerWidth <= 768) document.querySelector('.sidebar').classList.remove('open');
  showToast(`Loaded: ${session.title}`, 'info');
}

window.deleteSession = async (e, id) => {
  e.stopPropagation();
  const confirmed = await showConfirm("Delete Chat?", "This conversation will be gone forever.");
  if (!confirmed) return;

  allSessions = allSessions.filter(s => s.id !== id);
  saveAllSessions();

  if (currentSessionId === id) {
    startNewChat(true); // Reset UI jika chat aktif dihapus
  } else {
    renderSidebar();
  }
  showToast('Chat deleted', 'success');
}

window.startNewChat = (force = false) => {
  // Reset UI ke kosong, jangan hapus apapun
  currentSessionId = null;
  chatBox.innerHTML = '';
  chatBox.appendChild(welcomeScreen);
  welcomeScreen.style.display = 'flex';
  selectedFiles = [];
  renderFiles();
  renderSidebar(); // Hapus class active
  if (window.innerWidth <= 768) document.querySelector('.sidebar').classList.remove('open');
  if (!force) showToast('New conversation started', 'info');
}

function saveAllSessions() {
  localStorage.setItem('gemini_sessions', JSON.stringify(allSessions));
}

// --- PENANGANAN CHAT ---
const formElement = document.getElementById('chat-form');
formElement.onsubmit = async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text && selectedFiles.length === 0) return;

  welcomeScreen.style.display = 'none';

  // 1. Cek apakah perlu session baru
  if (!currentSessionId) {
    createNewSession(text || "Image Upload");
  }

  // 2. Simpan & Render Pesan User
  const userMsgObj = saveToCurrentSession('user', text, selectedFiles.map(f => f.name));
  renderMessage(userMsgObj);

  const currentText = text;
  const currentFiles = [...selectedFiles];
  userInput.value = ''; selectedFiles = []; renderFiles();

  // 3. UI Loading Bot
  const botId = `bot-${Date.now()}`;
  // Catatan: Kita tidak simpan loading indicator ke session history
  renderMessage({ id: botId, role: 'bot', content: '<div class="typing-dots"><span></span><span></span><span></span></div>', timestamp: Date.now() }, true);

  // Proses Files
  const filesData = await Promise.all(currentFiles.map(f => new Promise(r => {
    const reader = new FileReader(); reader.onload = e => r({ data: e.target.result.split(',')[1], mimeType: f.type }); reader.readAsDataURL(f);
  })));

  try {
    // Dapatkan history untuk konteks (opsional: kirim beberapa pesan terakhir)
    const currentSession = allSessions.find(s => s.id === currentSessionId);
    const historyPayload = currentSession.messages.slice(0, -1).map(m => ({ role: m.role === 'bot' ? 'model' : 'user', content: m.content }));

    const isPreview = window.location.protocol === 'blob:' || window.location.hostname.includes('usercontent.goog');
    const API_URL = isPreview ? 'http://localhost:3000/api/chat' : '/api/chat';

    const res = await fetch(API_URL, {
      method: 'POST', headers: {
        'Content-Type': 'application/json',
        'x-gemini-api-key': GEMINI_API_KEY // Send key from settings
      },
      // Kirim pesan saat ini + history (disederhanakan di sini untuk demo, idealnya backend yang handle history)
      body: JSON.stringify({
        messages: [...historyPayload, { role: 'user', content: currentText }], // Sending full context
        files: filesData,
        model: document.getElementById('model-select').value // Kirim model yang dipilih (sekarang dari hidden input)
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server Error (${res.status})`);
    }
    const data = await res.json();

    const botEl = document.getElementById(botId);
    let content = data.image ? `<p>Image generated ✨</p><img src="data:image/png;base64,${data.image}" style="max-width:100%; border-radius:12px; margin-top:10px;">` : marked.parse(String(data.result || ""));

    // Update UI
    botEl.querySelector('.msg-content').innerHTML = content;
    renderActions(botEl, 'bot', botId, Date.now());

    // 4. Simpan Response Bot ke Session
    // Kita perlu update ID di DOM agar cocok dengan ID yang disimpan jika ingin konsistensi,
    // tapi di sini kita simpan object baru saja
    const botMsgObj = {
      id: botId,
      role: 'bot',
      content: content,
      timestamp: Date.now()
    };
    // Push manual ke session daripada pakai saveToCurrentSession untuk hindari re-rendering
    const sessionIdx = allSessions.findIndex(s => s.id === currentSessionId);
    if (sessionIdx > -1) {
      allSessions[sessionIdx].messages.push(botMsgObj);
      saveAllSessions();
    }

  } catch (err) {
    const botEl = document.getElementById(botId);
    if (botEl) {
      let msg = err.message;
      if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Quota")) {
        msg = "RESOURCE_EXHAUSTED: Quota Exceeded, try again.....";
      }
      botEl.querySelector('.msg-content').innerText = msg;
    }
  }
};

// --- HELPER UI BERSAMA ---
function renderMessage(msg, isLoading = false) {
  const wrapper = document.createElement('div');
  wrapper.className = `message-wrapper wrapper-${msg.role}`;
  wrapper.id = msg.id;

  const row = document.createElement('div'); row.className = 'message-row';
  const avatar = document.createElement('div'); avatar.className = `msg-avatar ${msg.role}`;
  avatar.innerHTML = msg.role === 'user' ? 'U' : '<span class="material-symbols-rounded">auto_awesome</span>';

  const bubble = document.createElement('div'); bubble.className = 'msg-content';
  let attachHTML = (msg.attachments && msg.attachments.length > 0) ? `<div style="font-size:0.8rem; opacity:0.7; margin-bottom:4px">📎 ${msg.attachments.length} file(s)</div>` : '';
  bubble.innerHTML = attachHTML + (isLoading ? msg.content : msg.content);

  row.appendChild(avatar); row.appendChild(bubble);
  wrapper.appendChild(row); chatBox.appendChild(wrapper);

  if (!isLoading) renderActions(wrapper, msg.role, msg.id, msg.timestamp);
  scrollToBottom();
}

function renderActions(wrapper, role, id, ts) {
  const actionsBar = document.createElement('div'); actionsBar.className = 'message-actions';
  const timeStr = ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const timeEl = `<span class="timestamp">${timeStr}</span>`;

  let buttons = '';
  if (role === 'user') {
    buttons = `
          <div class="action-btn-icon" onclick="startInlineEdit('${id}')" title="Edit"><span class="material-symbols-rounded">edit</span></div>
          <div class="action-btn-icon" onclick="copyText('${id}', this)" title="Copy"><span class="material-symbols-rounded">content_copy</span></div>
          ${timeEl}`;
  } else {
    buttons = `
          ${timeEl}
          <div class="action-btn-icon" onclick="toggleRate(this, 'up')" title="Good"><span class="material-symbols-rounded">thumb_up</span></div>
          <div class="action-btn-icon" onclick="toggleRate(this, 'down')" title="Bad"><span class="material-symbols-rounded">thumb_down</span></div>
          <div class="action-btn-icon" onclick="regenerate('${id}')" title="Redi"><span class="material-symbols-rounded">refresh</span></div>
          <div class="action-btn-icon" onclick="shareContent('${id}')" title="Share"><span class="material-symbols-rounded">ios_share</span></div>
          <div class="action-btn-icon" onclick="copyText('${id}', this)" title="Copy"><span class="material-symbols-rounded">content_copy</span></div>`;
  }
  actionsBar.innerHTML = buttons;
  wrapper.appendChild(actionsBar);
}

// --- INTERAKSI UI ---
window.toggleSidebar = () => document.querySelector('.sidebar').classList.toggle('open');
window.openSettings = () => { const m = document.getElementById('settings-modal'); m.style.display = 'flex'; setTimeout(() => m.classList.add('active'), 10); }
window.closeSettings = () => { const m = document.getElementById('settings-modal'); m.classList.remove('active'); setTimeout(() => m.style.display = 'none', 300); }
window.closeOnOutside = (e) => { if (e.target.id === 'settings-modal') closeSettings(); }
window.saveApiKey = () => {
  const k = document.getElementById('api-key-input').value.trim();
  if (k) { localStorage.setItem('gemini_api_key', k); GEMINI_API_KEY = k; showToast('Key Saved', 'success'); closeSettings(); }
};
window.deleteApiKey = () => {
  localStorage.removeItem('gemini_api_key');
  GEMINI_API_KEY = '';
  document.getElementById('api-key-input').value = '';
  showToast('Key Deleted', 'info');
  closeSettings();
};
window.toggleApiKeyVisibility = () => {
  const input = document.getElementById('api-key-input');
  const icon = document.querySelector('.toggle-password');
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerText = 'visibility_off';
  } else {
    input.type = 'password';
    icon.innerText = 'visibility';
  }
};

// Input Suara
window.startVoiceInput = () => {
  if (!('webkitSpeechRecognition' in window)) {
    showToast('Voice input not supported', 'error');
    return;
  }
  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US'; // Default ke English, bisa dibuat dinamis
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const btn = document.getElementById('mic-btn');
  btn.classList.add('listening');

  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userInput.value += (userInput.value ? ' ' : '') + transcript;
    userInput.focus();
    btn.classList.remove('listening');
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error', event.error);
    btn.classList.remove('listening');
    showToast('Voice input failed', 'error');
  };

  recognition.onend = () => {
    btn.classList.remove('listening');
  };
};

// Logika Custom Dropdown
window.toggleDropdown = (e) => {
  e.stopPropagation();
  const options = document.getElementById('dropdown-options');
  options.classList.toggle('show');
};

window.selectModel = (value, text, element) => {
  document.getElementById('model-select').value = value;
  document.getElementById('dropdown-selected-text').innerText = text;

  // Update class selected
  const options = document.querySelectorAll('.dropdown-option');
  options.forEach(opt => opt.classList.remove('selected'));
  if (element) {
    element.classList.add('selected');
  }

  // Tutup dropdown
  document.getElementById('dropdown-options').classList.remove('show');
};

// Tutup dropdown saat klik di luar
window.addEventListener('click', (e) => {
  const dropdown = document.getElementById('custom-model-dropdown');
  if (dropdown && !dropdown.contains(e.target)) {
    document.getElementById('dropdown-options').classList.remove('show');
  }
});

window.setInput = (t) => { userInput.value = t; userInput.focus(); }

// Toast
function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container'); const t = document.createElement('div'); t.className = `toast ${type}`;
  let icon = 'info'; if (type === 'success') icon = 'check_circle'; if (type === 'error') icon = 'error';
  t.innerHTML = `<span class="material-symbols-rounded toast-icon">${icon}</span><div class="toast-content"><div class="toast-title">${type.toUpperCase()}</div><div class="toast-msg">${msg}</div></div><span class="material-symbols-rounded toast-close" onclick="this.parentElement.remove()">close</span>`;
  c.appendChild(t); requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { if (t.parentElement) { t.classList.remove('show'); setTimeout(() => t.remove(), 400); } }, 3000);
}

// Confirm
function showConfirm(title, desc) {
  return new Promise(resolve => {
    const o = document.getElementById('custom-confirm');
    document.getElementById('confirm-title').innerText = title; document.getElementById('confirm-desc').innerText = desc;
    o.style.display = 'flex'; setTimeout(() => o.classList.add('active'), 10);
    const cleanup = () => { o.classList.remove('active'); setTimeout(() => o.style.display = 'none', 300); };
    document.getElementById('confirm-ok').onclick = () => { cleanup(); resolve(true); };
    document.getElementById('confirm-cancel').onclick = () => { cleanup(); resolve(false); };
  });
}

// Misc Actions / Aksi Lain-lain
window.copyText = (id, btn) => {
  try {
    // Retrieve the message element safely using getElementById (avoids selector issues with dots in IDs)
    const msgEl = document.getElementById(id);
    if (!msgEl) throw new Error('Message element not found');
    const txt = msgEl.querySelector('.msg-content').innerText;

    // Attempt modern Clipboard API first
    navigator.clipboard.writeText(txt)
      .then(() => {
        const org = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-rounded" style="color:var(--accent-success)">check</span>';
        showToast('Copied', 'success');
        setTimeout(() => btn.innerHTML = org, 1500);
      })
      .catch(err => {
        // Fallback for browsers without Clipboard API or when permission denied
        console.warn('Clipboard API failed, using fallback', err);
        fallbackCopyText(txt, btn);
      });
  } catch (e) {
    console.error('Copy failed:', e);
    showToast('Copy gagal – periksa console', 'error');
  }
};

// Fallback copy using a temporary textarea (works in older browsers)
function fallbackCopyText(text, btn) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      const org = btn.innerHTML;
      btn.innerHTML = '<span class="material-symbols-rounded" style="color:var(--accent-success)">check</span>';
      showToast('Copied (fallback)', 'success');
      setTimeout(() => btn.innerHTML = org, 1500);
    } else {
      throw new Error('execCommand copy failed');
    }
  } catch (e) {
    console.error('Fallback copy failed:', e);
    showToast('Copy gagal', 'error');
  } finally {
    document.body.removeChild(textarea);
  }
}
// ... (Logika Edit, Share mirip dengan sebelumnya, disesuaikan untuk update allSessions)
window.shareContent = (id) => {
  const txt = document.querySelector(`#${id} .msg-content`).innerText;
  if (navigator.share) navigator.share({ title: 'Bloom', text: txt });
  else {
    const b = new Blob([txt], { type: 'text/plain' }); const u = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = u; a.download = `chat.txt`; a.click();
    showToast('Downloaded', 'success');
  }
}

// Mulai Inline Edit
window.startInlineEdit = (id) => {
  const wrapper = document.getElementById(id);
  const bubble = wrapper.querySelector('.msg-content');
  const originalHTML = bubble.innerHTML;
  const rawText = bubble.innerText.replace(/📎 \d+ file\(s\)\n/, '').trim();
  if (bubble.querySelector('textarea')) return;

  bubble.innerHTML = `<div class="edit-mode-wrapper"><textarea class="edit-textarea" rows="2">${rawText}</textarea><div class="edit-controls"><button class="btn-cancel" onclick="this.parentElement.parentElement.parentElement.innerHTML = '${escapeHtml(originalHTML)}'"><span class="material-symbols-rounded" style="font-size:16px">close</span></button><button class="btn-save" onclick="saveInlineEdit('${id}', this)"><span class="material-symbols-rounded" style="font-size:16px">check</span></button></div></div>`;
  bubble.querySelector('textarea').focus();
}
window.saveInlineEdit = (id, btn) => {
  const val = btn.closest('.edit-mode-wrapper').querySelector('textarea').value;
  const bubble = btn.closest('.msg-content');
  bubble.innerHTML = val.replace(/\n/g, '<br>');

  // Update di Session
  const sIdx = allSessions.findIndex(s => s.id === currentSessionId);
  if (sIdx > -1) {
    const mIdx = allSessions[sIdx].messages.findIndex(m => m.id === id);
    if (mIdx > -1) {
      allSessions[sIdx].messages[mIdx].content = val;
      saveAllSessions();
    }
  }
  showToast('Updated', 'success');
}
window.regenerate = (id) => {
  const s = allSessions.find(s => s.id === currentSessionId);
  const mIdx = s.messages.findIndex(m => m.id === id);
  if (mIdx > 0 && s.messages[mIdx - 1].role === 'user') {
    userInput.value = s.messages[mIdx - 1].content;
    userInput.focus();
    showToast('Prompt reloaded', 'info');
  }
}
window.toggleRate = (btn, type) => {
  const p = btn.parentElement; p.querySelectorAll('.action-btn-icon').forEach(b => b.classList.remove('active-up', 'active-down'));
  btn.classList.add(type === 'up' ? 'active-up' : 'active-down'); showToast('Feedback recorded', 'info');
}

function escapeHtml(unsafe) { return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }

// Penanganan File
fileInput.addEventListener('change', () => {
  selectedFiles = Array.from(fileInput.files);
  renderFiles();
});

function renderFiles() {
  filePreview.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const chip = document.createElement('div');
    chip.className = 'file-chip';
    chip.innerHTML = `<span class="material-symbols-rounded" style="font-size:16px">description</span> ${file.name} <span class="material-symbols-rounded" style="cursor:pointer; font-size:16px" onclick="removeFile(${index})">close</span>`;
    filePreview.appendChild(chip);
  });
}

window.removeFile = (index) => {
  selectedFiles.splice(index, 1);
  renderFiles();
}

function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}
