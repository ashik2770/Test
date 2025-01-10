const { Telegraf } = require("telegraf");
const fs = require("fs");

const BOT_TOKEN = "8139201506:AAEtlZ2v0TMiN7wC3hVpTHneChJxPdVV0c8";
const ADMIN_ID = "7442526627"; // অ্যাডমিন টেলিগ্রাম আইডি
const DATA_FILE = "./movies.json";

// বট শুরু
const bot = new Telegraf(BOT_TOKEN);

// JSON ডেটাবেস লোড
const loadData = () => {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");
  return JSON.parse(fs.readFileSync(DATA_FILE));
};

const saveData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// ব্যবহারকারী অনুসন্ধান ফিচার
bot.on("text", (ctx) => {
  const query = ctx.message.text.toLowerCase();
  const movies = loadData();

  // IMDb ID, লিংক, বা নাম দিয়ে অনুসন্ধান
  const movie = movies.find(
    (m) =>
      m.id.toLowerCase() === query ||
      m.imdbLink.toLowerCase() === query ||
      m.name.toLowerCase().includes(query)
  );

  if (movie) {
    const message = `
<b>${movie.name}</b>
⭐ Rating: ${movie.rating}
💵 Box Office: ${movie.boxOffice}
🎬 Release Date: ${movie.releaseDate}
📽️ Trailer: <a href="${movie.trailer}">Watch</a>
📥 Download: 
${movie.downloadLinks.map((link, i) => `${i + 1}. <a href="${link}">Link ${i + 1}</a>`).join("\n")}
    `;

    ctx.replyWithPhoto(movie.image, { caption: message, parse_mode: "HTML" });
  } else {
    ctx.reply("Sorry, no movie found with your query.");
  }
});

// অ্যাডমিন প্যানেল
bot.command("add", (ctx) => {
  if (ctx.message.from.id.toString() !== ADMIN_ID) return ctx.reply("Access Denied!");
  ctx.reply("Send the movie details in the following format:\n\n`Name | IMDb ID | IMDb Link | Image URL | Rating | Box Office | Release Date | Trailer URL | Download Links (comma-separated)`", { parse_mode: "Markdown" });
});

bot.command("view", (ctx) => {
  if (ctx.message.from.id.toString() !== ADMIN_ID) return ctx.reply("Access Denied!");
  const movies = loadData();
  const message = movies.map((m, i) => `${i + 1}. ${m.name} (${m.rating}⭐)`).join("\n");
  ctx.reply(message || "No movies found.");
});

bot.command("delete", (ctx) => {
  if (ctx.message.from.id.toString() !== ADMIN_ID) return ctx.reply("Access Denied!");
  ctx.reply("Send the IMDb ID or Name of the movie to delete.");
});

bot.on("text", (ctx) => {
  if (ctx.message.from.id.toString() !== ADMIN_ID) return;

  const data = ctx.message.text.split("|").map((x) => x.trim());
  if (data.length === 9) {
    const [name, id, imdbLink, image, rating, boxOffice, releaseDate, trailer, downloadLinks] = data;

    const movies = loadData();
    movies.push({
      name,
      id,
      imdbLink,
      image,
      rating,
      boxOffice,
      releaseDate,
      trailer,
      downloadLinks: downloadLinks.split(",").map((link) => link.trim()),
    });

    saveData(movies);
    ctx.reply("Movie added successfully!");
  } else if (ctx.message.text.toLowerCase().startsWith("delete")) {
    const query = ctx.message.text.replace("delete", "").trim().toLowerCase();
    const movies = loadData();
    const updatedMovies = movies.filter(
      (m) => m.id.toLowerCase() !== query && !m.name.toLowerCase().includes(query)
    );

    if (updatedMovies.length < movies.length) {
      saveData(updatedMovies);
      ctx.reply("Movie deleted successfully!");
    } else {
      ctx.reply("No movie found to delete.");
    }
  }
});

// বট চালু করা
bot.launch();
console.log("Bot is running...");
