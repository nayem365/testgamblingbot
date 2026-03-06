// ============================================
// index.js - Main Bot Entry Point (FIXED)
// ============================================

require('dotenv').config();

const { Telegraf, Markup } = require('telegraf');
const { connectDB, saveUser, getUserData, updateUserData, saveSubmission, updateSubmissionStatusaj } = require('./utils/db');
const { promoFlow } = require('./flows/promoFlow');
const { 
    playerFlow, 
    handlePlayerCountrySelection,
    handleDepositOld,
    handleWithdrawal,
    handleBangladeshCountry,
    handleIndiaCountry,
    askUserId,
    askPlayerIdForWithdrawal,
    showDatePickerForWithdrawal,
    showPlayerConfirmation
} = require('./flows/playerFlow');
const { agentFlow } = require('./flows/agentFlow');
const { settingsFlow } = require('./flows/settingsFlow');
const { loadLanguage, getFlag } = require('./utils/i18n');
const { logToAdmin, createAssetFolders } = require('./utils/helpers');
const fs = require('fs').promises;
const path = require('path');
const XLSX = require('xlsx');

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Admin chat IDs (comma-separated in env)
const ADMIN_CHAT_IDS = process.env.ADMIN_CHAT_IDS?.split(',') || [];

console.log('🤖 Bot starting with config:');
console.log(`📱 Admin IDs: ${ADMIN_CHAT_IDS.join(', ')}`);

// ============================================
// DATABASE CONNECTION
// ============================================

let dbConnected = false;

(async () => {
    try {
        console.log('📦 Connecting to MongoDB...');
        await connectDB();
        dbConnected = true;
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error('❌ Failed to connect to database:', error);
        dbConnected = false;
    }
})();

// ============================================
// MIDDLEWARE & SESSION HANDLING
// ============================================

const sessions = new Map();

const getSession = (userId) => {
    if (!sessions.has(userId)) {
        sessions.set(userId, { state: 'idle', data: {} });
    }
    return sessions.get(userId);
};

const clearSession = (userId) => {
    if (sessions.has(userId)) {
        const session = sessions.get(userId);
        session.state = 'idle';
        session.data = {};
        session.processing = false;
        session.submitting = false;
    }
};

// Helper function to generate Case ID
function generateCaseId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CASE-${timestamp}-${random}`;
}

// ============================================
// START COMMAND
// ============================================

bot.start(async (ctx) => {
    try {
        const userId = ctx.from.id;
        const userName = ctx.from.first_name || ctx.from.username || 'User';
        const username = ctx.from.username || null;
        
        console.log(`👤 New user started: ${userName} (${userId})`);
        
        clearSession(userId);
        
        const existingUser = await getUserData(userId);
        if (existingUser && existingUser.phone) {
            return showMainMenu(ctx, existingUser.language || 'en');
        }
        
        const session = getSession(userId);
        session.state = 'waiting_phone';
        session.data.name = userName;
        session.data.username = username;
        
        await ctx.reply(
            'Hello! Welcome to 7Starswin Bot! 🎰\n\n' +
            'Please share your phone number to get started.',
            Markup.keyboard([
                Markup.button.contactRequest('📱 Share Phone Number')
            ]).resize()
        );
    } catch (error) {
        console.error('Error in start command:', error);
        await ctx.reply('Sorry, something went wrong. Please try again.').catch(e => {});
    }
});

// Handle phone number sharing
bot.on('contact', async (ctx) => {
    try {
        const userId = ctx.from.id;
        const session = getSession(userId);
        
        if (session.state !== 'waiting_phone') return;
        
        const phone = ctx.message.contact.phone_number;
        const name = ctx.from.first_name || ctx.from.username || 'User';
        const username = ctx.from.username || null;
        
        session.data.phone = phone;
        await saveUser({ userId, name, phone, username });
        
        const adminMessage = `📞 New User Registration\n\n` +
            `Name: ${name}\n` +
            `Username: ${username ? `@${username}` : 'No username'}\n` +
            `User ID: ${userId}\n` +
            `Phone: ${phone}\n` +
            `Date: ${new Date().toLocaleString()}`;
        
        await logToAdmin(bot, ADMIN_CHAT_IDS, adminMessage);
        
        session.state = 'waiting_language';
        await showLanguageSelection(ctx);
    } catch (error) {
        console.error('Error in contact handler:', error);
        await ctx.reply('Sorry, something went wrong. Please try again.').catch(e => {});
    }
});

// Language selection
async function showLanguageSelection(ctx) {
    const keyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback('🇺🇸 English', 'bot_lang_en'),
            Markup.button.callback('🇧🇩 Bangla', 'bot_lang_bn')
        ],
        [
            Markup.button.callback('🇮🇳 हिंदी', 'bot_lang_hi')
        ]
    ]);
    
    await ctx.reply(
        '🌐 **Language Selection**\n\nPlease select your preferred language:',
        {
            parse_mode: 'Markdown',
            ...keyboard
        }
    );
}

// Handle BOT language selection
bot.action(/bot_lang_(.+)/, async (ctx) => {
    try {
        const userId = ctx.from.id;
        const session = getSession(userId);
        const language = ctx.match[1];
        
        if (!['en', 'bn', 'hi'].includes(language)) {
            return ctx.answerCbQuery('Language not available');
        }
        
        if (session.state === 'changing_language') {
            const texts = loadLanguage(language);
            await updateUserData(userId, { language });
            await ctx.reply(texts.language_changed);
            session.state = 'idle';
            setTimeout(() => showMainMenu(ctx, language), 1000);
            return;
        }
        
        session.data.language = language;
        await updateUserData(userId, { language });
        
        await ctx.reply('Language selected! ✅');
        await showMainMenu(ctx, language);
    } catch (error) {
        console.error('Error in language selection:', error);
        await ctx.reply('Sorry, something went wrong.').catch(e => {});
    }
});

// ============================================
// MAIN MENU
// ============================================

async function showMainMenu(ctx, language = 'en') {
    const texts = loadLanguage(language);
    const userName = ctx.from.first_name || ctx.from.username || 'User';
    
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(`🧑‍💼 ${texts.player}`, 'menu_player')],
        [Markup.button.callback(`🤝 ${texts.affiliate}`, 'menu_affiliate')],
        [Markup.button.callback(`💰 ${texts.agent}`, 'menu_agent')],
        [Markup.button.callback(`⚙️ ${texts.settings}`, 'menu_settings')]
    ]);
    
    const welcomeMessage = `Hello! ${userName}, Welcome To 7Starswin Bot\n\n${texts.choose_option}`;
    
    await ctx.reply(welcomeMessage, keyboard);
}

// Handle main menu selections
bot.action('menu_player', async (ctx) => {
    try {
        await playerFlow(ctx, bot, ADMIN_CHAT_IDS, getSession, clearSession);
    } catch (error) {
        console.error('Player flow error:', error);
        await ctx.reply('⚠️ Error starting player flow. Please try again.');
    }
});

bot.action('menu_affiliate', async (ctx) => {
    try {
        await promoFlow(ctx, bot, ADMIN_CHAT_IDS, getSession, clearSession);
    } catch (error) {
        console.error('Affiliate flow error:', error);
        await ctx.reply('⚠️ Error starting affiliate flow. Please try again.');
    }
});

bot.action('menu_agent', async (ctx) => {
    try {
        await agentFlow(ctx, bot, ADMIN_CHAT_IDS, getSession, clearSession);
    } catch (error) {
        console.error('Agent flow error:', error);
        await ctx.reply('⚠️ Error starting agent flow. Please try again.');
    }
});

bot.action('menu_settings', async (ctx) => {
    try {
        await settingsFlow(ctx, bot, getSession, showLanguageSelection, showMainMenu);
    } catch (error) {
        console.error('Settings flow error:', error);
        await ctx.reply('⚠️ Error opening settings. Please try again.');
    }
});

// Back to main menu
bot.action('back_to_main', async (ctx) => {
    try {
        const userId = ctx.from.id;
        const userData = await getUserData(userId);
        clearSession(userId);
        await ctx.reply('Returning to main menu...');
        await showMainMenu(ctx, userData?.language || 'en');
    } catch (error) {
        console.error('Back to main menu error:', error);
        await ctx.reply('⚠️ Error returning to main menu.');
    }
});

// Admin command
bot.command('admin', async (ctx) => {
    try {
        const userId = ctx.from.id;
        
        if (!ADMIN_CHAT_IDS.includes(userId.toString())) {
            return ctx.reply('⛔ Access denied.');
        }
        
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📢 Broadcast Message', 'admin_broadcast_start')],
            [Markup.button.callback('📊 User Statistics', 'admin_stats')],
            [
                Markup.button.callback('📋 Export Users', 'admin_export_basic'),
                Markup.button.callback('📈 Export Detailed', 'admin_export_detailed')
            ]
        ]);
        
        await ctx.reply('🔧 **Admin Panel**\n\nSelect an option:', keyboard);
    } catch (error) {
        console.error('Admin command error:', error);
        await ctx.reply('⚠️ Error opening admin panel.');
    }
});

// Test command to check if bot is alive
bot.command('ping', async (ctx) => {
    await ctx.reply('🏓 Pong! Bot is alive!');
});

// Health check command
bot.command('health', async (ctx) => {
    const userId = ctx.from.id;
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    await ctx.reply(
        `🤖 **Bot Health Check**\n\n` +
        `Status: ✅ Online\n` +
        `Uptime: ${hours}h ${minutes}m\n` +
        `Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}\n` +
        `User ID: ${userId}\n` +
        `Timestamp: ${new Date().toLocaleString()}`
    );
});

// ============================================
// ERROR HANDLING
// ============================================

bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    if (err.code === 403 || err.description?.includes('blocked')) {
        console.log(`User ${ctx.from?.id} blocked the bot`);
        return;
    }
});

// Handle graceful shutdown
process.once('SIGINT', () => {
    console.log('🤖 Bot stopping (SIGINT)...');
    bot.stop('SIGINT');
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('🤖 Bot stopping (SIGTERM)...');
    bot.stop('SIGTERM');
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

// ============================================
// START BOT
// ============================================

async function startBot() {
    try {
        await createAssetFolders();
        
        console.log('🤖 Starting bot...');
        
        // Launch bot with proper error handling
        await bot.launch({
            dropPendingUpdates: true
        });
        
        console.log('✅ Bot launched successfully!');
        console.log(`📱 Bot username: @${bot.botInfo?.username}`);
        console.log(`🆔 Bot ID: ${bot.botInfo?.id}`);
        
        // Keep the process alive
        setInterval(() => {
            console.log('💓 Bot heartbeat - ', new Date().toISOString());
        }, 60000); // Log every minute
        
    } catch (error) {
        console.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
}

// Start the bot
startBot();

// Export for testing
module.exports = { bot };
