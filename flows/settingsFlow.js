// ============================================
// flows/settingsFlow.js - Settings & Support
// ============================================

const { Markup } = require('telegraf');
const { loadLanguage } = require('../utils/i18n');
const { getUserData, updateUserData } = require('../utils/db');

async function settingsFlow(ctx, bot, getSession, showLanguageSelection, showMainMenu) {
    const userId = ctx.from.id;
    const userData = await getUserData(userId);
    const language = userData?.language || 'en';
    const texts = loadLanguage(language);
    
    const supportUsername = process.env.SUPPORT_USERNAME || 'your_support_bot';
    
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🌐 Change Language', 'settings_language')],
        [Markup.button.url(texts.contact_support, `https://t.me/${supportUsername}`)],
        [Markup.button.callback(texts.back, 'back_to_main')]
    ]);
    
    await ctx.editMessageText(
        '⚙️ **Settings**\n\n' +
        'Choose an option:',
        { 
            parse_mode: 'Markdown',
            ...keyboard
        }
    );
}

module.exports = { settingsFlow };
