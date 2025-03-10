// File: /plugins/owner/promote.js
require("dotenv").config();

module.exports = async (chiwa, msg) => {
  // Pastikan message adalah reply
  try {
    const chatId = msg.key.remoteJid;

    // Cek apakah pesan adalah reply
    if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
      return chiwa.sendMessage(chatId, {
        text: "❌ Mohon reply pesan yang ingin diteruskan.",
      });
    }

    // Ambil pesan yang direply
    const quotedMessage =
      msg.message.extendedTextMessage.contextInfo.quotedMessage;
    const quotedType = Object.keys(quotedMessage)[0]; // Tipe pesan (text, imageMessage, videoMessage, dll.)

    // Ambil semua grup di mana bot menjadi admin/member
    let groups = await chiwa.groupFetchAllParticipating();
    let groupIds = Object.keys(groups);

    if (groupIds.length === 0) {
      return chiwa.sendMessage(chatId, {
        text: "Bot tidak terdaftar dalam grup manapun.",
      });
    }

    // Kirim ke semua grup
    for (let groupId of groupIds) {
      if (groupId == process.env.GROUP_ID) continue;
      try {
        // Cek apakah yang dikirim adalah media atau teks
        if (
          quotedType === "conversation" ||
          quotedType === "extendedTextMessage"
        ) {
          const textMessage =
            quotedMessage.conversation ||
            quotedMessage.extendedTextMessage.text;
          await chiwa.sendMessage(groupId, { text: textMessage });
        } else if (quotedType.endsWith("Message")) {
          // Jika media (image, video, audio, document)
          const mediaMessage = quotedMessage[quotedType];

          if (!quotedMessage.imageMessage)
            return chiwa.sendMessage(chatId, {
              text: "❌ Jenis pesan tidak didukung.",
            });

          const textMessage = quotedMessage.imageMessage.caption;

          // Download media
          const buffer = await chiwa.downloadMediaMessage(mediaMessage);
          if (!buffer) {
            return chiwa.sendMessage(chatId, {
              text: "❌ Gagal mendownload media.",
            });
          }

          await chiwa.sendMessage(groupId, {
            image: buffer,
            caption: textMessage || "",
          });
        } else {
          return chiwa.sendMessage(chatId, {
            text: "❌ Jenis pesan tidak didukung.",
          });
        }

        console.log(`✅ Pesan diteruskan ke grup: ${groups[groupId].subject}`);

        // Tambahkan delay sebelum lanjut ke grup berikutnya
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 detik jeda
      } catch (err) {
        console.error(
          `❌ Gagal meneruskan pesan ke grup ${groups[groupId].subject}:`,
          err
        );
      }
    }

    // Konfirmasi ke pengirim bahwa pesan berhasil diteruskan
    await chiwa.sendMessage(chatId, {
      text: `✅ Pesan berhasil diteruskan ke ${groupIds.length} grup.`,
    });
  } catch (error) {
    console.error("❌ Gagal meneruskan pesan:", error);
    await chiwa.sendMessage(msg.key.remoteJid, {
      text: "❌ Gagal meneruskan pesan.",
    });
  }
};
