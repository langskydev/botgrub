// File: /plugins/owner/badword.js

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/badwords.json');

// Fungsi untuk membaca data badword dari file
function loadBadwords() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([]));
  }
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (err) {
    console.error("Error membaca file badwords:", err);
    return [];
  }
}

// Fungsi untuk menyimpan data badword ke file
function saveBadwords(badwords) {
  fs.writeFileSync(dbPath, JSON.stringify(badwords, null, 2));
}

module.exports = async (chiwa, m, text) => {
  // Fitur ini hanya dapat digunakan melalui private chat oleh owner
  if (m.isGroup) return;
  if (!m.sender.includes(process.env.OWNER_NUMBER)) return;

  // Format perintah:
  // Add:    addbadword|badword1|badword2|badword3|...
  // Edit:   editbadword|oldBadword|newBadword
  // Delete: deletebadword|badword
  const parts = text.split('|').map(part => part.trim());
  const command = parts[0].toLowerCase();

  let badwords = loadBadwords();

  if (command === 'addbadword') {
    if (parts.length < 2) {
      m.reply("Format salah. Gunakan: addbadword|badword1|badword2|...");
      return;
    }
    // Tambahkan setiap badword jika belum ada
    const newWords = parts.slice(1).filter(word => word.length > 0);
    newWords.forEach(word => {
      if (!badwords.includes(word)) {
        badwords.push(word);
      }
    });
    saveBadwords(badwords);
    m.reply(`Berhasil menambahkan badword:\n${newWords.join(', ')}`);
  } else if (command === 'editbadword') {
    if (parts.length !== 3) {
      m.reply("Format salah. Gunakan: editbadword|oldBadword|newBadword");
      return;
    }
    const oldWord = parts[1];
    const newWord = parts[2];
    const index = badwords.findIndex(word => word === oldWord);
    if (index === -1) {
      m.reply(`Badword "${oldWord}" tidak ditemukan.`);
      return;
    }
    badwords[index] = newWord;
    saveBadwords(badwords);
    m.reply(`Berhasil mengubah badword "${oldWord}" menjadi "${newWord}"`);
  } else if (command === 'deletebadword') {
    if (parts.length !== 2) {
      m.reply("Format salah. Gunakan: deletebadword|badword");
      return;
    }
    const wordToDelete = parts[1];
    const newBadwords = badwords.filter(word => word !== wordToDelete);
    if (newBadwords.length === badwords.length) {
      m.reply(`Badword "${wordToDelete}" tidak ditemukan.`);
      return;
    }
    saveBadwords(newBadwords);
    m.reply(`Berhasil menghapus badword "${wordToDelete}"`);
  } else {
    m.reply("Perintah tidak dikenali. Gunakan addbadword, editbadword, atau deletebadword.");
  }
};
