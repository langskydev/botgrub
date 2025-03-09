const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const levenshtein = require('fast-levenshtein');

// Integrasi backup job untuk produk dan badword
try {
  require('./plugins/backup/backup.js');
} catch (e) {
  console.error('Gagal menjalankan backup produk:', e);
}
try {
  require('./plugins/backup/backupBadword.js');
} catch (e) {
  console.error('Gagal menjalankan backup badword:', e);
}

module.exports = chiwa = async (chiwa, m, chatUpdate, messages, store) => {
  const prefix = process.env.PREFIX;

  // Jika pesan berasal dari private chat dan dikirim oleh owner,
  // proses perintah produk, badword, dan promote
  if (!m.isGroup && m.sender.includes(process.env.OWNER_NUMBER)) {
    if (m.text) {
      // Perintah manage produk: add|, edit|, delete|
      if (
        m.text.startsWith("add|") ||
        m.text.startsWith("edit|") ||
        m.text.startsWith("delete|")
      ) {
        require("./plugins/owner/manageproduk")(chiwa, m);
        return;
      }
      // Perintah badword: addbadword|, editbadword|, deletebadword|
      if (
        m.text.startsWith("addbadword|") ||
        m.text.startsWith("editbadword|") ||
        m.text.startsWith("deletebadword|")
      ) {
        require("./plugins/owner/badword")(chiwa, m, m.text);
        return;
      }  
    }
  }

  // Proses pesan dari grup target (misalnya, perintah untuk grup)
  const targetGroupId = process.env.GROUP_ID;
  if (!m.isGroup || m.chat !== targetGroupId) return;

  const isOwner = m.sender.includes(process.env.OWNER_NUMBER);
  const groupMetadata = await chiwa.groupMetadata(m.chat).catch(e => { });
  const groupName = groupMetadata?.subject || targetGroupId;

  var body = m?.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
    ? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id
    : m?.message?.conversation ||
    m?.message?.imageMessage?.caption ||
    m?.message?.videoMessage?.caption ||
    m?.message?.extendedTextMessage?.text ||
    m?.message?.buttonsResponseMessage?.selectedButtonId ||
    m?.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m?.message?.templateButtonReplyMessage?.selectedId ||
    m?.message?.buttonsResponseMessage?.selectedButtonId ||
    m?.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m?.text || "";

  const args = body.trim().split(/ +/).slice(1);
  var budy = (typeof m.text == 'string' ? m.text : '');
  const text = args.join(" ");
  const isCmd = body.startsWith(prefix);
  let rawCommand = body.trim().split(" ")[0].toLowerCase();
  let command = isCmd ? rawCommand.slice(prefix.length) : rawCommand;

  const time = moment(Date.now()).tz('Asia/Jakarta').locale('id').format('HH:mm:ss z');
  if (m.message) {
    console.log(
      '\x1b[1;31m~\x1b[1;37m>',
      `[ \x1b[1;32m${groupName} 🔥\x1b[1;37m]`,
      time,
      chalk.green(budy.slice(0, 100) || m.mtype),
      'from',
      chalk.green(m.pushName || ''),
      'args:',
      chalk.green(text.length)
    );
  }

  try {
    switch (command) {
      case 'list': {
        // Greeting berdasarkan waktu
        const currentTime = moment().tz('Asia/Jakarta');
        const jam = currentTime.format('HH:mm:ss');
        const tanggal = currentTime.format('DD/MM/YYYY');
        const hour = currentTime.hour();
        let greeting = "Halo";
        if (hour >= 5 && hour < 12) {
          greeting = "Selamat pagi";
        } else if (hour >= 12 && hour < 18) {
          greeting = "Selamat siang";
        } else {
          greeting = "Selamat malam";
        }

        // Baca file database produk
        const dbPath = path.join(__dirname, 'database', 'produk.json');
        let dataProduk = [];
        if (fs.existsSync(dbPath)) {
          try {
            dataProduk = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          } catch (err) {
            console.error("Error membaca produk.json:", err);
          }
        }

        // Bangun pesan list produk
        let pesanList = "┌──⭓「 LIST PRODUK ✓⃝ 」\n";
        pesanList += `│ ${greeting} @${m.sender.split('@')[0]} \n`;
        if (dataProduk.length > 0) {
          dataProduk.forEach((produk, index) => {
            pesanList += `│${index + 1}. 🛍 ${produk.nama}\n`;
          });
        } else {
          pesanList += "│ Tidak ada produk yang tersedia\n";
        }
        pesanList += "└────────────⭓\n";
        pesanList += `GRUP : ${groupName}\n`;
        pesanList += `JAM : ⏰ ${jam}\n`;
        pesanList += `TANGGAL : 📆 ${tanggal}\n\n`;
        pesanList += "NOTE : \nUntuk melihat produk berdasarkan nomor, atau ketik nama produk yang ada pada list di atas.";

        m.reply(pesanList);
        break;
      }
      case 'cl': {
        let pluginPath = path.join(__dirname, 'plugins', 'grup', 'cl.js');
        if (fs.existsSync(pluginPath)) {
          require(pluginPath)(chiwa, m, true, text, isOwner, command, prefix);
        } else {
          m.reply("Fitur penutupan grup tidak tersedia.");
        }
        break;
      }
      case 'op': {
        let pluginPath = path.join(__dirname, 'plugins', 'grup', 'op.js');
        if (fs.existsSync(pluginPath)) {
          require(pluginPath)(chiwa, m, true, text, isOwner, command, prefix);
        } else {
          m.reply("Fitur pembukaan grup tidak tersedia.");
        }
        break;
      }
      case 'h': { // Fitur hidetag
        let pluginPath = path.join(__dirname, 'plugins', 'grup', 'hidetag.js');
        if (fs.existsSync(pluginPath)) {
          require(pluginPath)(chiwa, m, true, text, isOwner, command, prefix);
        } else {
          m.reply("Fitur hidetag tidak tersedia.");
        }
        break;
      }
      default:
        break;
    }

    // -- Fitur Pemesanan (Pending) --
    if (
      m.isGroup &&
      m.message?.extendedTextMessage?.contextInfo?.quotedMessage &&
      m.text.trim().toLowerCase() === 'p'
    ) {
      let isAdmin = false;
      if (groupMetadata && groupMetadata.participants) {
        const participant = groupMetadata.participants.find(p => p.id === m.sender);
        if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
          isAdmin = true;
        }
      }
      if (isAdmin) {
        await require('./plugins/store/pending')(chiwa, m, groupMetadata);
        return;
      }
    }

    // -- Fitur Pemesanan (Done) --
    if (
      m.isGroup &&
      m.message?.extendedTextMessage?.contextInfo?.quotedMessage &&
      m.text.trim().toLowerCase() === 'd'
    ) {
      let isAdmin = false;
      if (groupMetadata && groupMetadata.participants) {
        const participant = groupMetadata.participants.find(p => p.id === m.sender);
        if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
          isAdmin = true;
        }
      }
      if (isAdmin) {
        await require('./plugins/store/done')(chiwa, m, groupMetadata);
        return;
      }
    }

    // -- Proses Pemilihan Produk Berdasarkan Nomor atau Nama --
    if (!isCmd && budy && !['p', 'd'].includes(budy.trim().toLowerCase())) {
      const dbPath = path.join(__dirname, 'database', 'produk.json');
      let dataProduk = [];
      if (fs.existsSync(dbPath)) {
        try {
          dataProduk = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        } catch (err) {
          console.error("Error membaca produk.json:", err);
        }
      }
      if (dataProduk.length > 0) {
        let produkDetail = null;
        if (!isNaN(budy.trim())) {
          const idx = parseInt(budy.trim(), 10) - 1;
          if (idx >= 0 && idx < dataProduk.length) {
            produkDetail = dataProduk[idx];
          }
        } else {
          produkDetail = dataProduk.find(p => p.nama.toLowerCase() === budy.toLowerCase());
          if (!produkDetail) {
            produkDetail = dataProduk.find(p => p.nama.toLowerCase().includes(budy.toLowerCase()));
          }
        }
        if (produkDetail) {
          if (produkDetail.image && fs.existsSync(produkDetail.image)) {
            const buffer = fs.readFileSync(produkDetail.image);
            await chiwa.sendMessage(m.chat, { image: buffer, caption: produkDetail.harga }, { quoted: m });
          } else {
            m.reply(`${produkDetail.harga}`);
          }
        }
      }
    }
  } catch (e) {
    console.error("Error processing command:", e);
  }

  // -- Integrasi Fitur Link Detection --
  const linkDetectionPath = path.join(__dirname, 'plugins', 'grup', 'linkDetection.js');
  if (fs.existsSync(linkDetectionPath)) {
    require(linkDetectionPath)(chiwa, m, false, text, isOwner, command, prefix);
  }

  // -- Integrasi Fitur Badword Detection --
  const badwordDetectionPath = path.join(__dirname, 'plugins', 'grup', 'badwordDetection.js');
  if (fs.existsSync(badwordDetectionPath)) {
    require(badwordDetectionPath)(chiwa, m, false, text, isOwner, command, prefix);
  }
};

//
// File watchers untuk update file secara otomatis
//
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});

let menuFile = require.resolve('./database/menu.json');
fs.watchFile(menuFile, () => {
  fs.unwatchFile(menuFile);
  console.log(chalk.redBright(`Update ./database/menu.json`));
  delete require.cache[menuFile];
  require(menuFile);
});
