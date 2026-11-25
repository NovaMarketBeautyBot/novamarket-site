const TelegramBot = require('node-telegram-bot-api');
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const SERVICES = {
  'w_cut': { name: '💇‍♀️ Женская стрижка', price: '6 000 ₸', time: '1 час' },
  'm_cut': { name: '💇‍♂️ Мужская стрижка', price: '4 000 ₸', time: '40 мин' },
  'k_cut': { name: '👧 Детская стрижка', price: '3 500 ₸', time: '40 мин' },
  'manicure': { name: '💅 Маникюр без покрытия', price: '4 000 ₸', time: '1 час' },
  'manicure_gel': { name: '💅 Маникюр с гель-лаком', price: '7 000 ₸', time: '1,5 часа' },
  'nails': { name: '💅 Наращивание ногтей', price: '10 000 ₸', time: '2 часа' },
  'pedicure': { name: '🦶 Педикюр', price: '8 000 ₸', time: '1,5 часа' },
  'color': { name: '🎨 Окрашивание в один тон', price: '15 000 ₸', time: '2 часа' },
  'balayage': { name: '✨ Мелирование / Балаяж', price: 'от 20 000 ₸', time: '3 часа' },
};

let userState = {};

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `✨ Добро пожаловать в *NovaMarket*!\n\nСтрижки и маникюр в Костанае 💇‍♀️💅\n\nВыберите, что хотите сделать:`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '💇‍♀️ Стрижки', callback_data: 'cat_cut' }],
        [{ text: '💅 Маникюр и педикюр', callback_data: 'cat_nails' }],
        [{ text: '🎨 Окрашивание', callback_data: 'cat_color' }],
        [{ text: '📞 Связаться с нами', callback_data: 'contact' }],
      ]
    }
  });
});

function showServices(chatId, keys, back) {
  let kb = keys.map(k => [{ text: `${SERVICES[k].name} — ${SERVICES[k].price}`, callback_data: 'service_' + k }]);
  kb.push([{ text: '⬅️ Назад', callback_data: back }]);
  bot.sendMessage(chatId, 'Выберите услугу:', { reply_markup: { inline_keyboard: kb } });
}

bot.on('callback_query', async (q) => {
  const chatId = q.message.chat.id;
  const data = q.data;
  await bot.answerCallbackQuery(q.id);

  if (data === 'cat_cut') return showServices(chatId, ['w_cut','m_cut','k_cut'], 'back_main');
  if (data === 'cat_nails') return showServices(chatId, ['manicure','manicure_gel','nails','pedicure'], 'back_main');
  if (data === 'cat_color') return showServices(chatId, ['color','balayage'], 'back_main');
  if (data === 'back_main') return bot.sendMessage(chatId, 'Выберите категорию:', { reply_markup: { inline_keyboard: [[{text:'💇‍♀️ Стрижки', callback_data:'cat_cut'}],[{text:'💅 Маникюр и педикюр', callback_data:'cat_nails'}],[{text:'🎨 Окрашивание', callback_data:'cat_color'}]] } });
  if (data === 'contact') return bot.sendMessage(chatId, '📞 Напишите нам сюда, мы ответим в течение 15 минут!\n\n📍 Костанай\n⏰ Ежедневно 09:00 - 20:00');
  
  if (data.startsWith('service_')) {
    const key = data.replace('service_', '');
    const s = SERVICES[key];
    userState[chatId] = { service: s };
    return bot.sendMessage(chatId, `${s.name}\n\n💰 Цена: ${s.price}\n⏰ Время: ${s.time}\n\nХотите записаться?`, {
      reply_markup: { inline_keyboard: [[{ text: '✅ Записаться', callback_data: 'book' }],[{ text: '⬅️ Назад', callback_data: 'back_main' }]] }
    });
  }

  if (data === 'b
