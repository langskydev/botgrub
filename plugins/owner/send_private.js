// File: /plugins/owner/promote_private.js
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

    // Ambil group target
    const command = msg.message?.extendedTextMessage?.text.split("|");
    const target = command[1];
    if (!target) {
      return chiwa.sendMessage(chatId, {
        text: "❌ Mohon masukkan grup target.",
      });
    }

    // Ambil pesan yang direply
    const quotedMessage =
      msg.message.extendedTextMessage.contextInfo.quotedMessage;
    const quotedType = Object.keys(quotedMessage)[0]; // Tipe pesan (text, imageMessage, videoMessage, dll.)

    // Ambil semua grup
    let groups = await chiwa.groupFetchAllParticipating();
    let groupArray = Object.values(groups);

    let targetGroup = groupArray.find((group) => group.subject === target);

    if (!targetGroup) {
      return chiwa.sendMessage(chatId, {
        text: "❌ Grup tidak di temukan.",
      });
    }

    console.log(targetGroup);

    const participants = targetGroup.participants;

    for (let participant of participants) {
      try {
        // Cek apakah yang dikirim adalah media atau teks
        if (
          quotedType === "conversation" ||
          quotedType === "extendedTextMessage"
        ) {
          const textMessage =
            quotedMessage.conversation ||
            quotedMessage.extendedTextMessage.text;
          await chiwa.sendMessage(participant.id, { text: textMessage });
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

          await chiwa.sendMessage(participant.id, {
            image: buffer,
            caption: textMessage || "",
          });
        } else {
          return chiwa.sendMessage(chatId, {
            text: "❌ Jenis pesan tidak didukung.",
          });
        }

        console.log(
          `✅ Pesan diteruskan ke pengguna : ${participant.id} dari grup ${target}`
        );

        // Tambahkan delay sebelum lanjut ke grup berikutnya
        await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 detik jeda
      } catch (err) {
        console.error(
          `❌ Gagal meneruskan pesan ke pengguna ${participant.id} dari grup ${target}:`,
          err
        );
      }
    }

    // Konfirmasi ke pengirim bahwa pesan berhasil diteruskan
    await chiwa.sendMessage(chatId, {
      text: `✅ Pesan berhasil diteruskan ke ${participants.length} pengguna dari grup ${target}.`,
    });
  } catch (error) {
    console.error("❌ Gagal meneruskan pesan:", error);
    await chiwa.sendMessage(msg.key.remoteJid, {
      text: "❌ Gagal meneruskan pesan.",
    });
  }
};
