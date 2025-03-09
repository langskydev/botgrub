// File: /plugins/owner/promote.js

const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require('fs');
const path = require('path');

let promoteInterval = null; // menyimpan interval aktif

module.exports = async (chiwa, m, chatUpdate, messages, store) => {
    try {
        // Pastikan pesan dikirim lewat private chat
        if (!m.chat.endsWith('@s.whatsapp.net')) return;

        const promotePrefix = "promote|";
        let isPromote = false;
        let promoteText = "";
        let imageBuffer = null; // jika ada gambar

        // Cek pesan teks biasa
        if (m.text && m.text.startsWith(promotePrefix)) {
            isPromote = true;
            promoteText = m.text.slice(promotePrefix.length).trim();
        }
        // Cek pesan gambar dengan caption
        else if (m.message?.imageMessage && m.message.imageMessage.caption && m.message.imageMessage.caption.startsWith(promotePrefix)) {
            isPromote = true;
            promoteText = m.message.imageMessage.caption.slice(promotePrefix.length).trim();
            // Download gambar
            imageBuffer = await downloadMedia(chiwa, m);
        }

        if (!isPromote) return;

        // Cek apakah pengirim merupakan admin
        // Misalnya, admin didefinisikan melalui environment variable OWNER_NUMBERS (pisahkan dengan koma)
        const ownerNumbers = process.env.OWNER_NUMBERS ? process.env.OWNER_NUMBERS.split(',') : [];
        if (!ownerNumbers.includes(m.sender)) {
            // Jika bukan admin, abaikan perintah
            return;
        }

        // Fungsi untuk mengirim pesan promosi ke seluruh grup
        const sendPromote = async () => {
            // Ambil daftar chat yang merupakan grup
            // Asumsi store.chats.all() mengembalikan array chat
            const groups = store.chats.all().filter(chat => chat.id.endsWith('@g.us'));
            for (const group of groups) {
                try {
                    if (imageBuffer) {
                        // Kirim gambar dengan caption
                        await chiwa.sendMessage(group.id, { image: imageBuffer, caption: promoteText });
                    } else {
                        // Kirim pesan teks
                        await chiwa.sendMessage(group.id, { text: promoteText });
                    }
                    console.log(`Promote terkirim ke grup: ${group.id}`);
                } catch (err) {
                    console.error(`Gagal mengirim promote ke ${group.id}:`, err);
                }
            }
        };

        // Kirim pesan promosi langsung (pertama kali)
        await sendPromote();
        m.reply("Promote aktif. Pesan akan dikirim ke seluruh grup setiap 30 menit.");

        // Jika sudah ada interval aktif, clear terlebih dahulu agar tidak menumpuk
        if (promoteInterval) clearInterval(promoteInterval);

        // Set interval untuk mengirim pesan setiap 30 menit (30 x 60.000 ms)
        promoteInterval = setInterval(sendPromote, 30 * 60 * 1000);

    } catch (error) {
        console.error("Error pada plugin promote:", error);
    }
};

// Fungsi untuk mendownload media (gambar)
async function downloadMedia(chiwa, m) {
    try {
        const message = m.message.imageMessage;
        const stream = await downloadContentFromMessage(message, 'image');
        let buffer = Buffer.alloc(0);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    } catch (error) {
        console.error("Gagal mendownload media:", error);
        return null;
    }
}
