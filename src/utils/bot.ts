import TelegramBot from 'node-telegram-bot-api';

const TOKEN = '7045190919:AAGVnqTuSWin24s6LVFIjialXSfPl808yT8';

const bot = new TelegramBot(TOKEN, { polling: true });

export default bot;
