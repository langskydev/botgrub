const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// Fungsi untuk melakukan backup database badwords
const backupBadword = () => {
  // Path file database badwords
  const dbPath = path.join(__dirname, '../../database/badwords.json');
  
  // Pastikan file database badwords ada
  if (!fs.existsSync(dbPath)) {
    console.error('File database badwords tidak ditemukan:', dbPath);
    return;
  }

  // Folder tujuan backup untuk badwords
  const backupDir = path.join(__dirname, '../../database/backup/badword');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Hapus semua file backup lama dalam folder backup badwords
  const files = fs.readdirSync(backupDir);
  files.forEach(file => {
    fs.unlinkSync(path.join(backupDir, file));
  });

  // Buat nama file backup dengan format timestamp
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
  const backupFileName = `badwords_backup_${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFileName);

  // Copy file database badwords ke folder backup
  fs.copyFileSync(dbPath, backupPath);
  console.log(`Backup badwords telah dibuat: ${backupFileName}`);
};

// Jadwalkan cron job untuk backup setiap hari pukul 11:35
cron.schedule('35 11 * * *', () => {
  backupBadword();
});

console.log('Cron job backup badwords telah dijadwalkan pada pukul 11:35 setiap hari.');

module.exports = backupBadword;
