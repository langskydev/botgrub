// File: /plugins/grup/hidetag.js

const fs = require('fs');
const path = require('path');

module.exports = async (chiwa, m, isFromPlugin = false, text, isOwner, command, prefix) => {
  try {
    // Pastikan hanya diproses di dalam grup
    if (!m.isGroup) return;

    // Ambil metadata grup untuk mendapatkan daftar peserta dan status admin
    let groupMetadata = await chiwa.groupMetadata(m.chat);
    let participant = groupMetadata.participants.find(p => p.id === m.sender);
    
    // Pastikan pengirim adalah admin
    if (!participant || !participant.admin) {
      console.log(`Fitur hidetag hanya dapat digunakan oleh admin.`);
      return;
    }
    
    // Pastikan teks tidak kosong
    if (!text || text.trim().length === 0) {
      m.reply("Silakan masukkan teks untuk dihidetag!");
      return;
    }
    
    // Ambil semua member grup
    let allMembers = groupMetadata.participants.map(p => p.id);
    
    // Kirim pesan ulang dengan teks yang diberikan dan tag semua member
    await chiwa.sendMessage(m.chat, { text: text, mentions: allMembers });
    
  } catch (err) {
    console.error("Error pada plugin hidetag:", err);
  }
};
