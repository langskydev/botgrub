const fs = require('fs');
const path = require('path');

module.exports = async (chiwa, m) => {
  // Pastikan pesan berasal dari private chat dan pengirim adalah owner
  if (m.isGroup) return;
  if (!m.sender.includes(process.env.OWNER_NUMBER)) return;

  // Path file database produk
  const dbPath = path.join(__dirname, "../../database/produk.json");
  let dataProduk = [];
  if (fs.existsSync(dbPath)) {
    try {
      dataProduk = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (err) {
      dataProduk = [];
    }
  }

  // Jika pesan mengandung gambar (imageMessage)
  if (m.message?.imageMessage) {
    // Ambil caption dari imageMessage
    const caption = (m.message.imageMessage.caption || "").trim();
    if (!caption.includes('|')) {
      return chiwa.sendText(m.sender, "Format salah. Gunakan: add|nama produk|harga produk pada caption gambar.");
    }
    const parts = caption.split("|");
    if (parts.length < 3) {
      return chiwa.sendText(m.sender, "Format salah. Gunakan: add|nama produk|harga produk pada caption gambar.");
    }
    const command = parts[0].toLowerCase();
    if (command !== 'add') {
      return chiwa.sendText(m.sender, "Perintah tidak dikenal. Gunakan add, edit, atau delete.");
    }
    const namaProduk = parts[1].trim();
    const hargaProduk = parts[2].trim();

    // Download gambar menggunakan downloadMediaMessage (bawaan baileys)
    const buffer = await chiwa.downloadMediaMessage(m.message.imageMessage);
    // Tentukan nama file yang unik dan path penyimpanan di folder "./assets/img/"
    const fileName = `${Date.now()}-${m.sender.split('@')[0]}.jpg`;
    const imagePath = path.join(__dirname, '../../assets/img', fileName);
    fs.writeFileSync(imagePath, buffer);

    // Buat produk baru dengan gambar
    const produkBaru = {
      nama: namaProduk,
      harga: hargaProduk,
      image: imagePath,
      tanggalDitambahkan: new Date().toISOString()
    };

    dataProduk.push(produkBaru);
    fs.writeFileSync(dbPath, JSON.stringify(dataProduk, null, 2));
    return chiwa.sendText(m.sender, `Produk "${namaProduk}" dengan harga "${hargaProduk}" dan gambar berhasil ditambahkan.`);
  } else {
    // Proses pesan teks biasa
    const pesan = (typeof m.text === 'string' ? m.text : '').trim();
    if (!pesan.includes('|')) return; // pastikan ada pemisah

    // Pisahkan perintah berdasarkan karakter "|"
    const parts = pesan.split("|");
    const command = parts[0].toLowerCase();
    if (command !== 'add') {
      return chiwa.sendText(m.sender, "Perintah tidak dikenal. Gunakan add, edit, atau delete.");
    }
    if (parts.length < 3) {
      return chiwa.sendText(m.sender, "Format salah. Gunakan: add|nama produk|harga produk");
    }
    const namaProduk = parts[1].trim();
    const hargaProduk = parts[2].trim();

    const produkBaru = {
      nama: namaProduk,
      harga: hargaProduk,
      tanggalDitambahkan: new Date().toISOString()
    };

    dataProduk.push(produkBaru);
    fs.writeFileSync(dbPath, JSON.stringify(dataProduk, null, 2));
    return chiwa.sendText(m.sender, `Produk "${namaProduk}" dengan harga "${hargaProduk}" berhasil ditambahkan.`);
  }
};
