const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// Fungsi untuk melakukan backup database produk
const backupProduk = () => {
  // Path file database produk
  const dbPath = path.join(__dirname, '../../database/produk.json');
  // Pastikan file database ada
  if (!fs.existsSync(dbPath)) {
    console.error('File database produk tidak ditemukan:', dbPath);
    return;
  }

  // Folder tujuan backup
  const backupDir = path.join(__dirname, '../../database/backup/produk');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Hapus semua file backup lama
  const files = fs.readdirSync(backupDir);
  files.forEach(file => {
    fs.unlinkSync(path.join(backupDir, file));
  });

  // Buat nama file backup dengan timestamp
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
  const backupFileName = `produk_backup_${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFileName);

  // Copy file database ke folder backup
  fs.copyFileSync(dbPath, backupPath);
  console.log(`Backup produk telah dibuat: ${backupFileName}`);
};

// Jadwalkan cron job untuk backup setiap hari pukul 11:35
cron.schedule('35 11 * * *', () => {
  backupProduk();
});

console.log('Cron job backup produk telah dijadwalkan pada pukul 11:35 setiap hari.');
module.exports = backupProduk;
