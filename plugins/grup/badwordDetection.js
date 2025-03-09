// File: /plugins/grup/badwordDetection.js

const fs = require('fs');
const path = require('path');

module.exports = async (chiwa, m, isFromPlugin = false, text, isOwner, command, prefix) => {
  try {
    // Pastikan plugin hanya dijalankan di grup
    if (!m.isGroup) return;
    
    const groupId = m.chat;
    const sender = m.sender;

    // Ambil metadata grup untuk mengecek status admin
    let groupMetadata = await chiwa.groupMetadata(groupId).catch(e => {});
    let participant = groupMetadata?.participants?.find(p => p.id === sender);
    // Jika pesan berasal dari admin, abaikan pemeriksaan badword
    if (participant && participant.admin) {
      console.log(`Pesan dari admin (${sender}), badword tidak diproses.`);
      return;
    }
    
    // Ambil teks pesan dari berbagai tipe pesan
    let body = m.text ||
               (m.message && m.message.conversation) ||
               (m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.text) ||
               "";
    if (!body) return;
    
    // Baca file badwords dari database
    const badwordFile = path.join(__dirname, '../../database/badwords.json');
    if (!fs.existsSync(badwordFile)) {
      console.error("File badwords tidak ditemukan:", badwordFile);
      return;
    }
    let badwords = [];
    try {
      badwords = JSON.parse(fs.readFileSync(badwordFile, 'utf8'));
    } catch (err) {
      console.error("Error membaca file badwords:", err);
      return;
    }
    
    // Cek apakah pesan mengandung badword (case-insensitive)
    let lowerText = body.toLowerCase();
    let found = badwords.some(word => lowerText.includes(word.toLowerCase()));
    if (!found) return;
    
    // Buat objek key lengkap untuk penghapusan pesan
    const messageKey = {
      remoteJid: m.chat,
      fromMe: m.key.fromMe,
      id: m.key.id,
      participant: m.key.participant || ''
    };

    // Hapus pesan yang mengandung badword
    try {
      await chiwa.sendMessage(groupId, { delete: messageKey });
    } catch (err) {
      console.error("Error deleting message:", err);
    }
    
    // Kirim pesan peringatan ke grup dengan mention ke pengirim
    const warnMessage = 
`🤖 SISTEM DETEKSI AKTIF! 🤖  
@${sender.split('@')[0]} yang mengetikan kata badword, aku melihatmu berkata kasar...  

⚠️ Hati-hati, sistem mencatat semua pelanggaran!  
Jangan sampai aku harus melaporkan ini ke admin. 🤫`;
    
    await chiwa.sendMessage(groupId, { text: warnMessage, mentions: [sender] }, { quoted: m });
    
  } catch (e) {
    console.error("Error pada plugin badwordDetection:", e);
  }
};
