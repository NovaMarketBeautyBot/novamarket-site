const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.get('/', (req, res) => res.send('Bot is alive'));
app.listen(process.env.PORT || 3000);

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Привет! Бот NovaMarket работает ✅');
});

console.log('Bot started');
