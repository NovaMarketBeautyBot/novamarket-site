const TelegramBot = require('node-telegram-bot-api');
const nodemailer = require('nodemailer');
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Почта, куда будут приходить заявки
const OWNER_EMAIL = 'zhankeldy.gissa@icloud.com';

// Настройка почты iCloud
const transporter = nodemailer.createTransport({
  host: 'smtp.mail.me.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER, // zhankeldy.gissa@icloud.com
    pass: process.env.EMAIL_PASS  // пароль для приложения, не обычный пароль!
  }
});

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
  if (data === 'contact') return bot.sendMessage(chatId, '📞 Напишите нам сюда, мы ответим в течение 15 минут!\n\n📍 Костанай\n⏰ Ежедневно 09:00 - 20:00\n📧 zhankeldy.gissa@icloud.com');
  
  if (data.startsWith('service_')) {
    const key = data.replace('service_', '');
    const s = SERVICES[key];
    userState[chatId] = { service: s };
    return bot.sendMessage(chatId, `${s.name}\n\n💰 Цена: ${s.price}\n⏰ Время: ${s.time}\n\nХотите записаться?`, {
      reply_markup: { inline_keyboard: [[{ text: '✅ Записаться', callback_data: 'book' }],[{ text: '⬅️ Назад', callback_data: 'back_main' }]] }
    });
  }

  if (data === 'book') {
    userState[chatId].step = 'name';
    return bot.sendMessage(chatId, 'Отлично! Как вас зовут? Напишите имя:');
  }
});

bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/')) return;
  const chatId = msg.chat.id;
  const st = userState[chatId];
  if (!st || !st.step) return;

  if (st.step === 'name') {
    st.name = msg.text;
    st.step = 'phone';
    return bot.sendMessage(chatId, `${st.name}, напишите ваш номер телефона:`);
  }
  if (st.step === 'phone') {
    st.phone = msg.text;
    st.step = 'date';
    return bot.sendMessage(chatId, 'На какую дату и время хотите записаться? Например: Завтра в 14:00');
  }
  if (st.step === 'date') {
    st.date = msg.text;
    
    // Отправляем на почту
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: OWNER_EMAIL,
        subject: `💇 Новая запись NovaMarket - ${st.service.name}`,
        text: `Новая запись!\n\nУслуга: ${st.service.name}\nЦена: ${st.service.price}\nИмя: ${st.name}\nТелефон: ${st.phone}\nКогда: ${st.date}\n\nОтветьте клиенту для подтверждения.`
      });
      console.log('Email sent to', OWNER_EMAIL);
    } catch (e) {
      console.log('Email error:', e.message);
    }

    bot.sendMessage(chatId, `✅ *Заявка принята!*\n\n💇 Услуга: ${st.service.name}\n💰 Цена: ${st.service.price}\n👤 Имя: ${st.name}\n📞 Телефон: ${st.phone}\n📅 Когда: ${st.date}\n\nМы свяжемся с вами для подтверждения! Спасибо, что выбрали NovaMarket ✨`, { parse_mode: 'Markdown' });
    delete userState[chatId];
  }
});

console.log('Bot started - NovaMarket - Email mode');
