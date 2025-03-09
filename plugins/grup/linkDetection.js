// File: /plugins/grup/linkDetection.js

const fs = require('fs');
const path = require('path');

// Objek untuk menyimpan jumlah pelanggaran tiap user (bisa disimpan di memori, atau di file untuk persistensi)
let userLinkCount = {};

module.exports = async (chiwa, m, isFromPlugin = false, text, isOwner, command, prefix) => {
  try {
    // Pastikan plugin hanya dijalankan pada grup
    if (!m.isGroup) return;
    
    const groupId = m.chat;
    const sender = m.sender;

    // Ambil metadata grup untuk mengecek status admin
    let groupMetadata = await chiwa.groupMetadata(groupId).catch(e => {});
    let participant = groupMetadata?.participants?.find(p => p.id === sender);
    // Jika properti admin ada, berarti user adalah admin (nilai bisa berupa "admin" atau "superadmin")
    if (participant && participant.admin) {
      // Jangan lakukan apa-apa jika pesan berasal dari admin
      console.log(`Pesan dari admin (${sender}), link tidak akan dihapus.`);
      return;
    }
    
    // Regex untuk mendeteksi link
    const linkRegex = /(?:https?:\/\/|wa\.me\/|www\.)/i;

    // Ambil teks pesan dari berbagai kemungkinan tipe pesan
    let body = m.text ||
               (m.message && m.message.conversation) ||
               (m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.text) ||
               "";
    
    if (linkRegex.test(body)) {
      // Buat objek key lengkap jika diperlukan
      const messageKey = {
        remoteJid: m.chat,
        fromMe: m.key.fromMe,
        id: m.key.id,
        participant: m.key.participant || ''
      };

      // Hapus pesan yang mengandung link menggunakan sendMessage dengan parameter delete
      try {
        await chiwa.sendMessage(groupId, { delete: messageKey });
      } catch (err) {
        console.error("Error deleting message:", err);
      }
      
      // Tambahkan peringatan untuk pengirim
      if (!userLinkCount[sender]) {
        userLinkCount[sender] = 1;
      } else {
        userLinkCount[sender]++;
      }
      
      // Kirim pesan peringatan
      const warnMessage = 
`🎭 GRUP INI DIAWASI! 🎭  
@${sender.split('@')[0]} yang mengirimkan link, aku melihatmu mengirim link...  

💀 Sayang sekali, tapi aturan tetap aturan! 💀  
🚷 Link dihapus otomatis. Jangan ulangi jika tak ingin di kick!`;
      
      await chiwa.sendMessage(groupId, { text: warnMessage, mentions: [sender] }, { quoted: m });
      
      // Jika sudah mencapai 3 peringatan, kick user dari grup
      if (userLinkCount[sender] >= 3) {
        try {
          await chiwa.groupParticipantsUpdate(groupId, [sender], 'remove');
          // Reset hitungan setelah kick
          userLinkCount[sender] = 0;
        } catch (err) {
          console.error("Gagal mengeluarkan user:", err);
        }
      }
    }
  } catch (e) {
    console.error("Error pada plugin linkDetection:", e);
  }
};
