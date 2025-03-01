// Import library Baileys dan modul Node.js
const { makeWASocket, useSingleFileAuthState } = require("@whiskeysockets/baileys");
const readline = require("readline");

// ================================
// 1. SETUP AUTENTIKASI
// ================================
const authFile = "./auth_info.json"; // File untuk menyimpan session login
const { state, saveState } = useSingleFileAuthState(authFile); // Load session jika ada

// ================================
// 2. SETUP INPUT/OUTPUT TERMUX
// ================================
const rl = readline.createInterface({
  input: process.stdin,  // Baca input dari keyboard
  output: process.stdout // Tampilkan output ke terminal
});

// ================================
// 3. KONFIGURASI BOT
// ================================
const config = {
  auth: state, // Gunakan session yang sudah ada
  printQRInTerminal: false, // Jangan tampilkan QR
  mobile: true, // Mode perangkat mobile
  authType: 'md', // Pakai pairing code (bukan QR)
  browser: ["MyBot", "Chrome", "1.0.0"] // Info browser palsu
};

const sock = makeWASocket(config); // Buat koneksi WhatsApp

// ================================
// 4. PROSES PAIRING CODE
// ================================
sock.ev.on("connection.update", async (update) => {
  // Jika perlu pairing
  if (update.isNewLogin) {
    console.log("[!] Sambungkan ke nomor WhatsApp Anda:");
    
    // Minta input nomor WA
    const phoneNumber = await askQuestion("Masukkan nomor (contoh: 628123456789): ");
    
    // Minta pairing code dari WA
    const code = await askQuestion("Masukkan kode pairing dari WA: ");
    
    try {
      // Request pairing code ke WhatsApp
      await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
      console.log("[✓] Cek WhatsApp untuk kode pairing!");
    } catch (error) {
      console.error("[X] Gagal pairing:", error);
    }
  }

  // Jika sudah terkoneksi
  if (update.connection === "open") {
    console.log("[✓] Berhasil terhubung ke WhatsApp!");
  }
});

// ================================
// 5. SIMPAN SESSION LOGIN
// ================================
sock.ev.on("creds.update", saveState); // Simpan session ke auth_info.json

// ================================
// 6. HANDLE PESAN MASUK
// ================================
sock.ev.on("messages.upsert", ({ messages }) => {
  const message = messages[0];
  
  // Hanya proses pesan yang bukan dari bot sendiri
  if (!message.key.fromMe) {
    const text = message.message?.conversation || ""; // Ambil teks pesan
    const sender = message.key.remoteJid; // Ambil nomor pengirim

    // --------------------------------
    // Contoh command dasar
    // --------------------------------
    switch(text.toLowerCase()) {
      case '.ping':
        sock.sendMessage(sender, { text: '🏓 Pong!' });
        break;
        
      case '.menu':
        const menu = `
        *🤖 MENU BOT*
        .ping - Tes respon bot
        .info - Info bot
        .help - Bantuan
        `;
        sock.sendMessage(sender, { text: menu });
        break;
        
      case '.info':
        sock.sendMessage(sender, { 
          text: '🔧 Bot dibuat dengan Baileys\n📁 GitHub: github.com/username/repo'
        });
        break;
        
      default:
        if (text.startsWith('.help')) {
          sock.sendMessage(sender, { text: 'Ketik *.menu* untuk list command' });
        }
    }
  }
});

// ================================
// 7. FUNGSI BANTU UNTUK INPUT
// ================================
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer); // Kembalikan jawaban user
    });
  });
}

console.log("[!] Starting bot...");
