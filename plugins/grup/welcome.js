const { createCanvas, loadImage } = require("canvas");
const moment = require("moment-timezone");
const path = require("path");

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  let words = text.split(" ");
  let line = "";
  let lines = [];

  for (let i = 0; i < words.length; i++) {
    let testLine = line + words[i] + " ";
    let testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && i > 0) {
      lines.push(line);
      line = words[i] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  // Gambar setiap baris teks
  lines.forEach((lineText, index) => {
    ctx.fillText(lineText, x, y + index * lineHeight);
  });

  return lines.length * lineHeight; // Kembalikan tinggi total teks
}

async function createWelcomeImages(
  groupName,
  countMember,
  userPhone,
  username,
  userProfile,
  tagline
) {
  const imagePath = path.join(__dirname, "../../assets/img/welcome-image.png");

  const imageBasic = await loadImage(imagePath);
  const canvas = createCanvas(imageBasic.width, imageBasic.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(imageBasic, 0, 0, canvas.width, canvas.height);

  // 🔹 Text Group Name
  ctx.fillStyle = "black";
  ctx.font = "800 40px Arial";
  ctx.fillText(groupName.toUpperCase(), 59, 155);

  // 🔹 Text Count Member
  ctx.fillStyle = "black";
  ctx.font = "380 23px Poppins";
  ctx.fillText(`"${countMember}"`, 408, 225);

  // 🔹 User Profile
  const imageProfile = await loadImage(userProfile);
  let x = 720,
    y = 125,
    radius = 90; // Atur posisi & ukuran lingkaran

  ctx.save(); // Simpan state canvas sebelum membuat clip
  ctx.beginPath();
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2); // Buat lingkaran
  ctx.clip(); // Gunakan lingkaran sebagai clip mask

  // 🔹 Gambar kedua akan berbentuk lingkaran
  ctx.drawImage(imageProfile, x, y, radius * 2, radius * 2);

  ctx.restore(); // Kembalikan state canvas ke sebelum clip

  // 🔹 Tagline
  ctx.fillStyle = "white";
  ctx.font = "italic 14px Arial";
  ctx.fillText(`${groupName} ${tagline}`, 20, imageBasic.height - 20);

  // 🔹 Username and Phone
  let boxWidth = 300;
  let boxHeight = 100;
  let boxX = 665;
  let boxY = 300;

  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

  ctx.fillStyle = "white";
  ctx.font = "italic 30px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let phone = "6282384370310";
  ctx.font = "italic bold 25px Arial";
  wrapText(
    ctx,
    username,
    boxX + boxWidth / 2,
    boxY + boxHeight / 2,
    boxWidth - 20,
    40
  );

  // Langsung kembalikan buffer tanpa menyimpan file
  return canvas.toBuffer("image/png");
}

module.exports = async (chiwa, update) => {
  if (update.action !== "add") return;

  // Ambil metadata grup untuk mendapatkan nama grup
  let groupMetadata = await chiwa.groupMetadata(update.id).catch((e) => null);
  if (!groupMetadata) {
    console.error("Gagal mengambil metadata grup untuk welcome message.");
    return;
  }
  let groupName = groupMetadata.subject;

  // Iterasi setiap peserta baru
  for (const participant of update.participants) {
    // get the name of the participant
    let userJid = update.participants[0];
    let phoneNumber = userJid.split("@")[0];

    const username = chiwa.getName(userJid, true);

    // get user profile
    let profile = path.join(__dirname, "../../assets/img/user-profile.jpg");

    try {
      profile = await chiwa.profilePictureUrl(userJid, "image");
    } catch (err) {
      console.log("⚠️ Foto profil tidak tersedia.");
    }

    let countMember = groupMetadata.participants.length;

    // Format pesan welcome
    let welcomeMessage = `🎉 Selamat Datang di ${groupName}! 🎉\n\nHai, @${
      participant.split("@")[0]
    } user yang baru masuk grub! 👋 Senang kamu bergabung di sini. Untuk melihat daftar harga dan aplikasi yang tersedia, ketik "list".\n\nJika ada pertanyaan, jangan ragu untuk bertanya. Selamat berbelanja! 🚀`;

    let tagline = "adalah layanan terbaik untuk Anda!";

    // Kirim pesan welcome dengan mention
    const welcomeImage = await createWelcomeImages(
      groupName,
      countMember,
      phoneNumber,
      username,
      profile,
      tagline
    );
    await chiwa.sendMessage(update.id, {
      image: welcomeImage,
      caption: welcomeMessage,
      mentions: [participant],
    });
  }
};
