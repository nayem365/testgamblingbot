// ============================================
// index.js - Main Bot Entry Point (UPDATED with Username & Case ID)
// ============================================

require('dotenv').config();

const { Telegraf, Markup } = require('telegraf');
const { connectDB, saveUser, getUserData, updateUserData, saveSubmission, updateSubmissionStatus } = require('./utils/db');
const { promoFlow } = require('./flows/promoFlow');
const { 
    playerFlow, 
    handlePlayerCountrySelection,
    handleDepositOld,
    handleDepositNew,
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
const { validatePhone, logToAdmin, ensureFolder, createAssetFolders } = require('./utils/helpers');
const fs = require('fs').promises;
const path = require('path');
const activeConnections = new Map();
const XLSX = require('xlsx');

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Admin chat IDs (comma-separated in env)
const ADMIN_CHAT_IDS = process.env.ADMIN_CHAT_IDS?.split(',') || [];

// ============================================
// DATABASE CONNECTION - FIXED: WAIT FOR CONNECTION
// ============================================

// Connect to MongoDB and wait for it before proceeding
(async () => {
    try {
        console.log('📦 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error('❌ Failed to connect to database:', error);
        process.exit(1);
    }
})();

// ============================================
// MIDDLEWARE & SESSION HANDLING
// ============================================

// Simple session storage (use Redis in production)
const sessions = new Map();

const getSession = (userId) => {
    if (!sessions.has(userId)) {
        sessions.set(userId, { state: 'idle', data: {} });
    }
    return sessions.get(userId);
};

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// FIX: Add session cleanup to prevent duplicate messages
const clearSession = (userId) => {
    if (sessions.has(userId)) {
        const session = sessions.get(userId);
        session.state = 'idle';
        session.data = {};
        session.processing = false;
        session.submitting = false;
    }
};

// ============================================
// Helper function to generate Case ID
// ============================================
function generateCaseId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CASE-${timestamp}-${random}`;
}

// ============================================
// START COMMAND & PHONE COLLECTION (UPDATED)
// ============================================

bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const userName = ctx.from.first_name || ctx.from.username || 'User';
    const username = ctx.from.username || null;
    
    clearSession(userId);
    
    // Check if user already exists
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
});

// Handle phone number sharing (UPDATED)
bot.on('contact', async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);
    
    if (session.state !== 'waiting_phone') return;
    
    const phone = ctx.message.contact.phone_number;
    const name = ctx.from.first_name || ctx.from.username || 'User';
    const username = ctx.from.username || null;
    
    // Save phone to session and database
    session.data.phone = phone;
    await saveUser({ userId, name, phone, username });
    
    // Notify admins
    const adminMessage = `📞 New User Registration\n\n` +
        `Name: ${name}\n` +
        `Username: ${username ? `@${username}` : 'No username'}\n` +
        `User ID: ${userId}\n` +
        `Phone: ${phone}\n` +
        `Date: ${new Date().toLocaleString()}`;
    
    await logToAdmin(bot, ADMIN_CHAT_IDS, adminMessage);
    
    // Ask for language selection
    session.state = 'waiting_language';
    await showLanguageSelection(ctx);
});

// Language selection - Only show English, Bengali (Bangladeshi), and Hindi (Indian)
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
    const userId = ctx.from.id;
    const session = getSession(userId);
    const language = ctx.match[1];
    
    // Only allow en, bn, hi languages
    if (!['en', 'bn', 'hi'].includes(language)) {
        return ctx.answerCbQuery('Language not available');
    }
    
    if (session.state === 'changing_language') {
        const texts = loadLanguage(language);
        
        // Update language in database
        await updateUserData(userId, { language });
        
        await ctx.reply(texts.language_changed);
        
        // Clear session and show main menu
        session.state = 'idle';
        setTimeout(() => showMainMenu(ctx, language), 1000);
        
        return;
    }
    
    // Default language selection for new users
    session.data.language = language;
    await updateUserData(userId, { language });
    
    await ctx.reply('Language selected! ✅');
    await showMainMenu(ctx, language);
});

// Handle text input for forms
bot.on('text', async (ctx, next) => {
    const userId = ctx.from.id;
    const session = getSession(userId);
    const text = ctx.message.text.trim();
    const userData = await getUserData(userId);
    const texts = loadLanguage(userData?.language || 'en');
    
    if (!session.state || session.state === 'idle') return next();
    
    // FIX: Add state validation to prevent duplicate processing
    if (session.processing) {
        return; // Skip if already processing
    }
    session.processing = true;
    
    try {
        switch (session.state) {
            case 'waiting_promo_code':
                // Validate promo code length - UPDATED TO 10 CHARACTERS
                if (text.length > 10) {
                    await ctx.reply('⚠️ Promo code must be 10 characters or less. Please try again.');
                    return;
                }
                
                if (!/^[A-Za-z0-9]+$/.test(text)) {
                    await ctx.reply('⚠️ Promo code can only contain letters and numbers. Please try again.');
                    return;
                }
                
                try {
                    session.data.promoCode = text.toUpperCase();
                    session.state = 'processing_banners';
                    
                    // Process and deliver banners with promo code
                    const { deliverPromoMaterials } = require('./flows/promoFlow');
                    await deliverPromoMaterials(ctx, bot, ADMIN_CHAT_IDS, session, userId);
                    clearSession(userId);
                } catch (error) {
                    console.error('Promo code processing error:', error);
                    await ctx.reply('⚠️ Error processing your promo code. Please try again.');
                    clearSession(userId);
                }
                break;
                
            case 'waiting_user_id':
                // Validate that it's only numbers
                if (!/^\d+$/.test(text)) {
                    await ctx.reply(texts.invalid_user_id);
                    return;
                }
                session.data.gameUserId = text;
                
                // Check which flow to follow based on payment system
                const paymentSystem = session.data.paymentSystem;
                
                if (paymentSystem === 'MoneyGo') {
                    session.state = 'waiting_moneygo_id';
                    await ctx.reply(
                        `💰 **${session.data.issueType} - MoneyGo**\n\nYour MoneyGo ID (BDT/USD):`,
                        { parse_mode: 'Markdown' }
                    );
                } else if (paymentSystem === 'Binance') {
                    session.state = 'waiting_binance_email';
                    await ctx.reply(
                        `💰 **${session.data.issueType} - Binance**\n\nEnter Your Binance Email:`,
                        { parse_mode: 'Markdown' }
                    );
                } else if (paymentSystem === 'PhonePe') {
                    session.state = 'waiting_phonepe_id';
                    await ctx.reply(
                        `💰 **${session.data.issueType} - PhonePe**\n\nYour PhonePe ID:`,
                        { parse_mode: 'Markdown' }
                    );
                } else if (paymentSystem === 'PayTM UPI') {
                    session.state = 'waiting_paytm_upi_id';
                    await ctx.reply(
                        `💰 **${session.data.issueType} - PayTM UPI**\n\nPayTM UPI ID:`,
                        { parse_mode: 'Markdown' }
                    );
                } else {
                    // For bKash, Nagad, Rocket, Upay - go to phone number
                    session.state = 'waiting_phone_number';
                    await ctx.reply(
                        `📱 **${texts.enter_phone}**\n\nFormat: +880XXXXXXXXXX`,
                        { parse_mode: 'Markdown' }
                    );
                }
                break;

            // NEW: Handle Player ID for withdrawal flow
            case 'waiting_player_id_withdrawal':
                // Validate that it's only numbers
                if (!/^\d+$/.test(text)) {
                    await ctx.reply('⚠️ Player ID must contain only numbers. Please try again.');
                    return;
                }
                session.data.playerId = text;
                
                // Go to date selection for withdrawal
                await showDatePickerForWithdrawal(ctx, session);
                break;
                
            case 'waiting_withdrawal_time':
                // Accept any text format for time - no validation for withdrawal
                session.data.selectedTime = text;
                session.state = 'waiting_withdrawal_amount';
                
                await ctx.reply(
                    `💰 **Amount:**`,
                    { parse_mode: 'Markdown' }
                );
                break;
                
            case 'waiting_withdrawal_amount':
                session.data.amount = text;
                // For withdrawal, we don't need file upload - go straight to confirmation
                await showPlayerConfirmation(ctx, session);
                break;
                
            // MoneyGo flow
            case 'waiting_moneygo_id':
                session.data.moneyGoId = text;
                session.state = 'waiting_amount';
                await ctx.reply(
                    `💰 **Amount:**`,
                    { parse_mode: 'Markdown' }
                );
                break;
                
            // Binance flow
            case 'waiting_binance_email':
                session.data.binanceEmail = text;
                session.state = 'waiting_amount';
                await ctx.reply(
                    `💰 **Amount:**`,
                    { parse_mode: 'Markdown' }
                );
                break;
                
            // PhonePe flow
            case 'waiting_phonepe_id':
                session.data.phonePeId = text;
                session.state = 'waiting_phonepe_utr';
                await ctx.reply(
                    `🔢 **UTR / Reference No:**`,
                    { parse_mode: 'Markdown' }
                );
                break;
                
            case 'waiting_phonepe_utr':
                session.data.utrReference = text;
                await showDatePickerForWithdrawal(ctx, session);
                break;

                
            // PayTM UPI flow
            case 'waiting_paytm_upi_id':
                session.data.paytmUpiId = text;
                session.state = 'waiting_paytm_upi_name';
                await ctx.reply(
                    `👤 **PayTM UPI Name:**`,
                    { parse_mode: 'Markdown' }
                );
                break;
                
            case 'waiting_paytm_upi_name':
                session.data.paytmUpiName = text;
                session.state = 'waiting_paytm_upi_ref';
                await ctx.reply(
                    `🔢 **UPI Ref.No:**`,
                    { parse_mode: 'Markdown' }
                );
                break;
                
            case 'waiting_paytm_upi_ref':
                session.data.upiRefNo = text;
                await showDatePickerForWithdrawal(ctx, session);
                break;


            case 'waiting_indian_datetime':
                session.data.dateTime = text;
                session.state = 'waiting_indian_amount';
                await ctx.reply(
                    `💰 **Amount:**`,
                    { parse_mode: 'Markdown' }
                );
                break;

            case 'waiting_indian_amount':
                session.data.amount = text;
                // Skip file upload, go directly to confirmation like your existing flow
                await showPlayerConfirmation(ctx, session);
                break;
                
            case 'waiting_phone_number':
                // Simplified - just accept any text input as phone number
                session.data.phoneNumber = text;
                session.state = 'waiting_agent_number';
                
                await ctx.reply(
                    `👤 **${texts.enter_agent}**`,
                    { parse_mode: 'Markdown' }
                );
                break;
                
            case 'waiting_agent_number':
                session.data.agentNumber = text;
                const { showDatePicker } = require('./flows/playerFlow');
                await showDatePicker(ctx, session);
                break;
                
            case 'waiting_time':
                // Accept any text format for time - no validation
                session.data.selectedTime = text;
                session.state = 'waiting_amount';
                
                await ctx.reply(
                    `💰 **${texts.enter_amount}**`,
                    { parse_mode: 'Markdown' }
                );
                break;
                
            case 'waiting_amount':
                session.data.amount = text;

                // 💳 Only ask Trx ID for Bangladesh deposit (bKash, Nagad, Rocket, Upay)
                const isBD = session.data.country === 'bangladesh';
                const paymentNeedsTrx = ['bkash', 'nagad', 'rocket', 'upay'].includes(
                    (session.data.paymentSystem || '').toLowerCase()
                );

                if (isBD && paymentNeedsTrx) {
                    session.state = 'waiting_bd_trx_id';
                    const lang = session.data.language || 'en';

                    let trxText;
                    if (lang === 'bn') trxText = '💳 অনুগ্রহ করে আপনার ট্রানজ্যাকশন আইডি (Trx ID) লিখুন:';
                    else if (lang === 'hi') trxText = '💳 कृपया अपना ट्रांजेक्शन आईडी (Trx ID) दर्ज करें:';
                    else trxText = '💳 Please enter your Transaction ID (Trx ID):';

                    await ctx.reply(trxText);
                    break;
                }

                // skip Trx ID for others
                session.state = 'waiting_file';
                await ctx.reply(
                    `📎 **${texts.upload_file}**\n\nPlease upload a screenshot or video file.`,
                    { parse_mode: 'Markdown' }
                );
                break;

            case 'waiting_bd_trx_id':
                session.data.trxId = text;
                session.state = 'waiting_file';
                await ctx.reply(
                    `📎 **${texts.upload_file}**\n\nPlease upload a screenshot or video file.`,
                    { parse_mode: 'Markdown' }
                );
                break;

                
                
            case 'admin_replying':
                // Admin is replying to a user
                const { targetUserId, requestNumber, requestType, country } = session.data;
                
                try {
                    let replyMessage;
                    if (requestType === 'agent') {
                        replyMessage = `💬 **Admin Response - Agent ${country}**\n\n${text}`;
                    } else {
                        replyMessage = `💬 **Admin Response to Request #${requestNumber}**\n\n${text}`;
                    }
                    
                    // FIX: ADD REPLY BUTTON FOR CUSTOMERS
                    const replyKeyboard = Markup.inlineKeyboard([
                        [Markup.button.callback('💬 Reply to Admin', `customer_reply_${userId}`)],
                        [Markup.button.callback('🏠 Main Menu', 'back_to_main')]
                    ]);
                    
                    await bot.telegram.sendMessage(targetUserId, replyMessage, {
                        parse_mode: 'Markdown',
                        ...replyKeyboard
                    });
                    
                    const confirmMessage = requestType === 'agent' 
                        ? `✅ Message sent to user for Agent ${country} inquiry`
                        : `✅ Message sent to user for request #${requestNumber}`;
                        
                    await ctx.reply(confirmMessage);
                    clearSession(userId);
                    
                } catch (error) {
                    console.error('Error sending admin reply:', error);
                    await ctx.reply('⚠️ Error sending message to user.');
                }
                break;

            case 'admin_broadcasting':
                const broadcastText = text.trim();
                
                if (broadcastText.length === 0) {
                    await ctx.reply('Please enter a broadcast message.');
                    return;
                }
                
                try {
                    // Get all users from database
                    const { getAllUsers } = require('./utils/db');
                    const allUsers = await getAllUsers();
                    
                    let successCount = 0;
                    let failedCount = 0;
                    
                    await ctx.reply(`📢 Starting broadcast to ${allUsers.length} users...`);
                    
                    // Send message to all users
                    for (const user of allUsers) {
                        try {
                            await bot.telegram.sendMessage(user.userId, `📢 **Broadcast Message**\n\n${broadcastText}`, {
                                parse_mode: 'Markdown'
                            });
                            successCount++;
                            
                            // Small delay to avoid rate limits
                            await new Promise(resolve => setTimeout(resolve, 100));
                            
                        } catch (error) {
                            console.error(`Failed to send broadcast to user ${user.userId}:`, error.message);
                            failedCount++;
                        }
                    }
                    
                    // Report results to admin
                    await ctx.reply(
                        `📊 **Broadcast Complete**\n\n` +
                        `✅ Sent: ${successCount}\n` +
                        `❌ Failed: ${failedCount}\n` +
                        `📊 Total: ${allUsers.length}`
                    );
                    
                    clearSession(userId);
                    
                } catch (error) {
                    console.error('Broadcast error:', error);
                    await ctx.reply('❌ Error during broadcast. Please try again.');
                    clearSession(userId);
                }
                break;
                
            // FIX: ADD CUSTOMER REPLY FUNCTIONALITY
            case 'customer_replying':
                try {
                    const adminMessage = `💬 **Customer Reply from ${userData?.name || 'Unknown'} (${userId})**\n\n${text}\n\n` +
                        `Original Request: ${session.data.originalRequest || 'N/A'}`;
                    
                    // Send to all admins
                    for (const adminId of ADMIN_CHAT_IDS) {
                        try {
                            await bot.telegram.sendMessage(adminId, adminMessage, {
                                parse_mode: 'Markdown'
                            });
                        } catch (error) {
                            console.error(`Failed to send customer reply to admin ${adminId}:`, error);
                        }
                    }
                    
                    await ctx.reply(
                        '✅ **Your reply has been sent to the admin team.**\n\n' +
                        'If they respond, you will be notified here.',
                        {
                            parse_mode: 'Markdown',
                            ...Markup.inlineKeyboard([
                                [Markup.button.callback('🏠 Main Menu', 'back_to_main')]
                            ])
                        }
                    );
                    
                    clearSession(userId);
                    
                } catch (error) {
                    console.error('Error sending customer reply:', error);
                    await ctx.reply('⚠️ Error sending your reply. Please try again.');
                }
                break;

            case 'quick_connecting': {
                // Admin is using quick connect to send a message to a user
                const qcTargetUserId = session.data.targetUserId;
                const qcAdminId = userId;
                const adminMessage = text;

                try {
                    // Get target user data from DB
                    const targetUserData = await getUserData(parseInt(qcTargetUserId));
                    if (!targetUserData) {
                        await ctx.reply('⚠️ User not found in database.');
                        clearSession(userId);
                        break;
                    }

                    // Build a connection ID for tracking replies
                    const connectionId = `${qcAdminId}_${qcTargetUserId}`;
                    activeConnections.set(connectionId, {
                        adminId: qcAdminId,
                        userId: parseInt(qcTargetUserId),
                        createdAt: new Date(),
                        messageCount: 0
                    });

                    // FIX: Updated keyboard for customer reply
                    const userKeyboard = Markup.inlineKeyboard([
                        [Markup.button.callback('💬 Reply to Admin', `customer_reply_${qcAdminId}`)],
                        [Markup.button.callback('🏠 Main Menu', 'back_to_main')]
                    ]);

                    // Send admin's message to the user
                    await bot.telegram.sendMessage(
                        qcTargetUserId,
                        `💬 **Admin Message**\n\n${adminMessage}`,
                        {
                            parse_mode: 'Markdown',
                            ...userKeyboard
                        }
                    );

                    // Notify the admin
                    await ctx.reply(
                        `✅ Message sent to ${targetUserData.name || 'User'} (${qcTargetUserId})`
                    );

                    // Clear admin session state
                    clearSession(userId);

                } catch (error) {
                    console.error('Quick connect error:', error);
                    await ctx.reply('⚠️ Error sending message to user.');
                    clearSession(userId);
                }
                break;
            }

            default:
                return next();
        }
    } finally {
        session.processing = false; // Reset processing flag
    }
});

// FIX: Add customer reply handler
bot.action(/customer_reply_(.+)/, async (ctx) => {
    const adminId = ctx.match[1];
    const userId = ctx.from.id;
    
    const session = getSession(userId);
    session.state = 'customer_replying';
    session.data = {
        adminId: parseInt(adminId),
        originalRequest: session.data.requestNumber || 'Unknown'
    };
    
    await ctx.reply(
        '💬 **Reply to Admin**\n\nType your message below:',
        { parse_mode: 'Markdown' }
    );
    
    await ctx.answerCbQuery();
});

// Bangladesh payment system handlers (bKash, Nagad, Rocket, Upay - same flow)
bot.action(/^bd_(bkash|nagad|rocket|upay)$/, async (ctx) => {
    try {
        const session = getSession(ctx.from.id);
        const paymentType = ctx.match[1];
        const paymentNames = {
            'bkash': 'bKash',
            'nagad': 'Nagad', 
            'rocket': 'Rocket',
            'upay': 'Upay'
        };
        
        session.data.paymentSystem = paymentNames[paymentType];
        session.data.issueType = session.data.issueType || 'Bangladesh Payment';
        
        // NEW: Check if it's withdrawal flow
        if (session.data.issueType === 'Withdrawal') {
            await askPlayerIdForWithdrawal(ctx, session, paymentNames[paymentType]);
        } else {
            // Original deposit flow
            session.state = 'waiting_user_id';
            await ctx.reply(
                `🔢 **${session.data.issueType} - ${paymentNames[paymentType]}**\n\nEnter User ID (numbers only):`,
                { parse_mode: 'Markdown' }
            );
        }
    } catch (error) {
        console.error('Bangladesh payment system error:', error);
        await ctx.reply('⚠️ Error processing Bangladesh payment selection.');
    }
});

// Bangladesh MoneyGo and Binance handlers (different flows)
bot.action('bd_moneygo', async (ctx) => {
    try {
        const session = getSession(ctx.from.id);
        session.data.paymentSystem = 'MoneyGo';
        session.data.issueType = session.data.issueType || 'Bangladesh Payment';
        session.state = 'waiting_user_id';
        
        await ctx.reply(
            `🔢 **${session.data.issueType} - MoneyGo**\n\nEnter User ID (numbers only):`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('MoneyGo selection error:', error);
        await ctx.reply('⚠️ Error processing MoneyGo selection.');
    }
});

bot.action('bd_binance', async (ctx) => {
    try {
        const session = getSession(ctx.from.id);
        session.data.paymentSystem = 'Binance';
        session.data.issueType = session.data.issueType || 'Bangladesh Payment';
        session.state = 'waiting_user_id';
        
        await ctx.reply(
            `🔢 **${session.data.issueType} - Binance**\n\nEnter User ID (numbers only):`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('Binance selection error:', error);
        await ctx.reply('⚠️ Error processing Binance selection.');
    }
});

// ============================================
// INDIA PAYMENT SYSTEM HANDLERS  
// ============================================

bot.action('in_phonepe', async (ctx) => {
    try {
        const session = getSession(ctx.from.id);
        session.data.paymentSystem = 'PhonePe';
        session.data.issueType = session.data.issueType || 'India Payment';
        session.state = 'waiting_user_id';
        
        await ctx.reply(
            `🔢 **${session.data.issueType} - PhonePe**\n\nEnter User ID (numbers only):`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('PhonePe selection error:', error);
        await ctx.reply('⚠️ Error processing PhonePe selection.');
    }
});

bot.action('in_paytmupi', async (ctx) => {
    try {
        const session = getSession(ctx.from.id);
        session.data.paymentSystem = 'PayTM UPI';
        session.data.issueType = session.data.issueType || 'India Payment';
        session.state = 'waiting_user_id';
        
        await ctx.reply(
            `🔢 **${session.data.issueType} - PayTM UPI**\n\nEnter User ID (numbers only):`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('PayTM UPI selection error:', error);
        await ctx.reply('⚠️ Error processing PayTM UPI selection.');
    }
});

// UPDATED: submitPlayerRequest function with username and case ID
async function submitPlayerRequest(ctx, session, bot, adminChatIds) {
    const userId = ctx.from.id;
    const userData = await getUserData(userId);
    const texts = loadLanguage(userData?.language || 'en');

    // Prevent duplicate submissions
    if (session.submitting) {
        return;
    }
    session.submitting = true;

    try {
        // Generate both Request Number and Case ID
        const requestNumber = generateRequestNumber();
        const caseId = generateCaseId();
        session.data.requestNumber = requestNumber;
        session.data.caseId = caseId;

        // Get username if available
        const username = ctx.from.username ? `@${ctx.from.username}` : 'Not provided';

        await saveSubmission({
            userId,
            username: ctx.from.username || null,
            type: 'player',
            requestNumber,
            caseId,
            data: session.data,
            status: 'pending'
        });

        const adminKeyboard = Markup.inlineKeyboard([
            [
                Markup.button.callback('💬 Reply to User', `admin_reply_${userId}_${requestNumber}`),
                Markup.button.callback('✅ Mark Resolved', `admin_resolve_${userId}_${requestNumber}`)
            ]
        ]);

        let adminMessage = `👤 **New ${session.data.issueType} Request**\n\n` +
            `**Case ID:** \`${caseId}\`\n` +
            `**Request #:** ${requestNumber}\n` +
            `**User:** ${userData?.name || 'Unknown'}\n` +
            `**Username:** ${username}\n` +
            `**User ID:** \`${userId}\`\n` +
            `**Country:** ${session.data.country || 'Unknown'}\n` +
            `**Payment System:** ${session.data.paymentSystem}\n` +
            `**Language:** ${session.data.language.toUpperCase()}\n` +
            `**Submitted:** ${formatDate()}\n\n`;

        // Add all fields dynamically
        for (const [key, val] of Object.entries(session.data)) {
            if (['fileId', 'language', 'type', 'requestNumber', 'caseId'].includes(key)) continue;
            adminMessage += `**${key}:** ${val}\n`;
        }

        for (const chatId of adminChatIds) {
            try {
                if (session.data.fileId) {
                    if (session.data.fileName && (session.data.fileName.toLowerCase().includes('video') ||
                        session.data.fileName.toLowerCase().match(/\.(mp4|avi|mov|mkv)$/))) {
                        await bot.telegram.sendVideo(chatId, session.data.fileId, {
                            caption: adminMessage,
                            parse_mode: 'Markdown',
                            ...adminKeyboard
                        });
                    } else {
                        await bot.telegram.sendPhoto(chatId, session.data.fileId, {
                            caption: adminMessage,
                            parse_mode: 'Markdown',
                            ...adminKeyboard
                        });
                    }
                } else {
                    await bot.telegram.sendMessage(chatId, adminMessage, {
                        parse_mode: 'Markdown',
                        ...adminKeyboard
                    });
                }
            } catch (error) {
                console.error(`Failed to send to admin ${chatId}:`, error.message);
            }
        }

        // FIX: Updated keyboard for customer reply
        const userKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🏠 Main Menu', 'back_to_main')]
        ]);

        await ctx.reply(
            `✅ **${texts.request_registered}**\n\n` +
            `**Request #:** ${requestNumber}\n` +
            `**Case ID:** \`${caseId}\`\n\n` +
            `Our admin team will respond to your request soon.\n\n` +
            `📱 You will be notified here when there is an update.\n\n` +
            `⚠️ **Please save your Case ID for future reference.**`,
            {
                parse_mode: 'Markdown',
                ...userKeyboard
            }
        );

    } catch (error) {
        console.error('Player submission error:', error);
        await ctx.reply(`⚠️ Error submitting request. Please try again later.`);
    } finally {
        session.submitting = false;
    }
}

// Handle file uploads (photo and video)
bot.on(['photo', 'video'], async (ctx) => {
    const userId = ctx.from.id;
    const session = getSession(userId);
    const userData = await getUserData(userId);
    const texts = loadLanguage(userData?.language || 'en');
    
    if (session.state === 'waiting_file') {
        const { showPlayerConfirmation } = require('./flows/playerFlow');
        
        if (ctx.message.photo) {
            // Get highest resolution photo
            const photo = ctx.message.photo[ctx.message.photo.length - 1];
            session.data.fileId = photo.file_id;
            session.data.fileName = 'screenshot.jpg';
        } else if (ctx.message.video) {
            session.data.fileId = ctx.message.video.file_id;
            session.data.fileName = 'video.mp4';
        }
        
        await ctx.reply('✅ File uploaded successfully!');
        await showPlayerConfirmation(ctx, session);
    }
});

// ============================================
// MAIN MENU
// ============================================

async function showMainMenu(ctx, language = 'en') {
    const texts = loadLanguage(language);
    const flag = getFlag(language);
    const userName = ctx.from.first_name || ctx.from.username || 'User';
    
    // FIX: Updated icons - Agent icon for Player, Money icon for Agent
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

// ============================================
// PLAYER FLOW HANDLERS - UPDATED WITH COUNTRY SELECTION
// ============================================

// Player country selection handlers
bot.action('player_select_bangladesh', async (ctx) => {
    try {
        await handlePlayerCountrySelection(ctx, 'bangladesh', getSession);
    } catch (error) {
        console.error('Bangladesh selection error:', error);
        await ctx.reply('⚠️ Error processing Bangladesh selection.');
    }
});

bot.action('player_select_india', async (ctx) => {
    try {
        await handlePlayerCountrySelection(ctx, 'india', getSession);
    } catch (error) {
        console.error('India selection error:', error);
        await ctx.reply('⚠️ Error processing India selection.');
    }
});

bot.action('player_select_pakistan', async (ctx) => {
    try {
        await handlePlayerCountrySelection(ctx, 'pakistan', getSession);
    } catch (error) {
        console.error('Pakistan selection error:', error);
        await ctx.reply('⚠️ Error processing Pakistan selection.');
    }
});

bot.action('player_select_egypt', async (ctx) => {
    try {
        await handlePlayerCountrySelection(ctx, 'egypt', getSession);
    } catch (error) {
        console.error('Egypt selection error:', error);
        await ctx.reply('⚠️ Error processing Egypt selection.');
    }
});

bot.action('player_select_nepal', async (ctx) => {
    try {
        await handlePlayerCountrySelection(ctx, 'nepal', getSession);
    } catch (error) {
        console.error('Nepal selection error:', error);
        await ctx.reply('⚠️ Error processing Nepal selection.');
    }
});

bot.action('player_deposit_old', async (ctx) => {
    try {
        await handleDepositOld(ctx, getSession);
    } catch (error) {
        console.error('Old deposit flow error:', error);
        await ctx.reply('⚠️ Error starting deposit flow. Please try again.');
    }
});

bot.action('player_deposit_new', async (ctx) => {
    try {
        await handleDepositNew(ctx, getSession);
    } catch (error) {
        console.error('New deposit flow error:', error);
        await ctx.reply('⚠️ Error starting new deposit flow. Please try again.');
    }
});

bot.action('player_withdrawal', async (ctx) => {
    try {
        await handleWithdrawal(ctx, getSession);
    } catch (error) {
        console.error('Withdrawal flow error:', error);
        await ctx.reply('⚠️ Error starting withdrawal flow.');
    }
});

bot.action('player_country_bangladesh', async (ctx) => {
    try {
        await handleBangladeshCountry(ctx);
    } catch (error) {
        console.error('Bangladesh country flow error:', error);
        await ctx.reply('⚠️ Error loading Bangladesh options.');
    }
});

bot.action('player_country_india', async (ctx) => {
    try {
        await handleIndiaCountry(ctx);
    } catch (error) {
        console.error('India country flow error:', error);
        await ctx.reply('⚠️ Error loading India options.');
    }
});

// ============================================
// AFFILIATE FLOW HANDLERS - FIXED ROUTING
// ============================================

// Affiliate flow handlers
bot.action('affiliate_manager', async (ctx) => {
    try {
        const session = getSession(ctx.from.id);
        const { showManagerCountries } = require('./flows/promoFlow');
        await showManagerCountries(ctx, session);
    } catch (error) {
        console.error('Manager flow error:', error);
        await ctx.reply('⚠️ Error loading manager options.');
    }
});

bot.action('affiliate_promo_banner', async (ctx) => {
    try {
        const session = getSession(ctx.from.id);
        const { askPromoLanguage } = require('./flows/promoFlow');
        session.data.type = 'promo_banner';
        await askPromoLanguage(ctx, session);
    } catch (error) {
        console.error('Promo banner flow error:', error);
        await ctx.reply('⚠️ Error loading promo banner options.');
    }
});

// Manager country handlers
bot.action(/manager_country_(.+)/, async (ctx) => {
    try {
        const country = ctx.match[1];
        const { showManagerContact } = require('./flows/promoFlow');
        await showManagerContact(ctx, country);
    } catch (error) {
        console.error('Manager contact error:', error);
        await ctx.reply('⚠️ Error loading manager contact.');
    }
});

// PROMO BANNER LANGUAGE HANDLERS - COMPLETELY FIXED
bot.action(/promo_banner_lang_(.+)/, async (ctx) => {
    try {
        const session = getSession(ctx.from.id);
        const language = ctx.match[1];
        
        console.log(`Promo banner language selected: ${language}`);
        
        // Only allow en, bn, hi, pk languages
        if (!['en', 'bn', 'hi', 'pk'].includes(language)) {
            return ctx.answerCbQuery('Language not available');
        }
        
        // Store the selected banner language
        session.data.bannerLanguage = language;
        session.state = 'waiting_promo_code';
        
        console.log(`Session updated:`, session.data);
        
        // Answer callback query first
        await ctx.answerCbQuery(`${language.toUpperCase()} banners selected`);
        
        // Edit the message to ask for promo code
        await ctx.editMessageText(
            '✏️ **TYPE YOUR PROMO**\n\nEnter your promo code that will be added to the banners (maximum 10 characters):',
            { parse_mode: 'Markdown' }
        );
        
    } catch (error) {
        console.error('Banner language selection error:', error);
        await ctx.answerCbQuery('Error processing selection');
        try {
            await ctx.reply('⚠️ Error processing language selection. Please try again.');
        } catch (replyError) {
            console.error('Failed to send error message:', replyError);
        }
    }
});

// ============================================
// AGENT FLOW HANDLERS - UPDATED
// ============================================

// Agent flow handlers - Updated to use new flow
bot.action(/agent_country_(.+)/, async (ctx) => {
    try {
        const session = getSession(ctx.from.id);
        const country = ctx.match[1];
        const { showAgentDetails } = require('./flows/agentFlow');
        await showAgentDetails(ctx, country, session);
    } catch (error) {
        console.error('Agent country selection error:', error);
        await ctx.reply('⚠️ Error processing country selection.');
    }
});

bot.action(/agent_next_(.+)/, async (ctx) => {
    try {
        const session = getSession(ctx.from.id);
        const country = ctx.match[1];
        const { showAgentConfirmation } = require('./flows/agentFlow');
        await showAgentConfirmation(ctx, country, session);
    } catch (error) {
        console.error('Agent next error:', error);
        await ctx.reply('⚠️ Error processing request.');
    }
});

bot.action(/agent_(accept|reject)_(.+)/, async (ctx) => {
    try {
        const response = ctx.match[1];
        const country = ctx.match[2];
        const { handleAgentResponse } = require('./flows/agentFlow');
        await handleAgentResponse(ctx, country, response, bot, ADMIN_CHAT_IDS);
        clearSession(ctx.from.id);
    } catch (error) {
        console.error('Agent response error:', error);
        await ctx.reply('⚠️ Error processing your response.');
    }
});

// ============================================
// OTHER ACTION HANDLERS
// ============================================

// Cancel session handler
bot.action('cancel_session', async (ctx) => {
    const userId = ctx.from.id;
    const userData = await getUserData(userId);
    clearSession(userId);
    await ctx.reply('Session cancelled. Returning to main menu...');
    setTimeout(() => showMainMenu(ctx, userData?.language || 'en'), 1000);
});

// Contact support handler
bot.action('contact_support', async (ctx) => {
    const supportUsername = process.env.SUPPORT_USERNAME || 'your_support_bot';
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.url('📞 Contact Support', `https://t.me/${supportUsername}`)],
        [Markup.button.callback('🏠 Main Menu', 'back_to_main')]
    ]);
    
    await ctx.reply(
        '📞 **Contact Support**\n\nClick the button below to contact our support team:',
        { 
            parse_mode: 'Markdown',
            ...keyboard
        }
    );
});

// Date picker handlers for withdrawal flow
bot.action(/date_withdrawal_(\d+)/, async (ctx) => {
    try {
        const session = getSession(ctx.from.id);
        const userData = await getUserData(ctx.from.id);
        const texts = loadLanguage(userData?.language || 'en');
        
        const day = parseInt(ctx.match[1]);
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        session.data.selectedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        session.state = 'waiting_withdrawal_time';
        
        await ctx.reply(
            `⏰ **Enter Time**\n\nSelected date: ${session.data.selectedDate}\n\nPlease enter time in any format:`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('Withdrawal date selection error:', error);
        await ctx.reply('⚠️ Error processing date selection.');
    }
});

// Date picker handlers (original)
bot.action(/date_(\d+)/, async (ctx) => {
    try {
        const session = getSession(ctx.from.id);
        const userData = await getUserData(ctx.from.id);
        const texts = loadLanguage(userData?.language || 'en');
        
        const day = parseInt(ctx.match[1]);
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        session.data.selectedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        session.state = 'waiting_time';
        
        await ctx.reply(
            `⏰ **${texts.enter_time}**\n\nSelected date: ${session.data.selectedDate}\n\nPlease enter time in any format:`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('Date selection error:', error);
        await ctx.reply('⚠️ Error processing date selection.');
    }
});

// Ignore header buttons
bot.action(['date_header', 'day_header', 'empty_day'], async (ctx) => {
    await ctx.answerCbQuery();
});

// Player confirmation handlers (UPDATED to use the new submit function)
bot.action('player_submit', async (ctx) => {
    try {
        const session = getSession(ctx.from.id);
        await submitPlayerRequest(ctx, session, bot, ADMIN_CHAT_IDS);
        clearSession(ctx.from.id);
    } catch (error) {
        console.error('Submit player request error:', error);
        await ctx.reply('⚠️ Error submitting request.');
    }
});

bot.action('player_restart', async (ctx) => {
    try {
        await playerFlow(ctx, bot, ADMIN_CHAT_IDS, getSession, clearSession);
    } catch (error) {
        console.error('Restart player flow error:', error);
        await ctx.reply('⚠️ Error restarting player flow.');
    }
});

// Settings handlers
bot.action('settings_language', async (ctx) => {
    try {
        const session = getSession(ctx.from.id);
        session.state = 'changing_language';
        await showLanguageSelection(ctx);
    } catch (error) {
        console.error('Settings language error:', error);
        await ctx.reply('⚠️ Error opening language settings.');
    }
});

// UPDATED: Admin handlers for replies with username display
bot.action(/admin_reply_(\d+)_(\d+)/, async (ctx) => {
    try {
        const targetUserId = ctx.match[1];
        const requestNumber = ctx.match[2];
        const session = getSession(ctx.from.id);
        
        // Get user data to show username
        const userData = await getUserData(parseInt(targetUserId));
        const username = userData?.username ? `@${userData.username}` : 'No username';
        
        session.state = 'admin_replying';
        session.data = { 
            targetUserId, 
            requestNumber,
            requestType: 'player'
        };
        
        await ctx.reply(
            `💬 **Admin Reply Mode**\n\n` +
            `Replying to Request #${requestNumber}\n` +
            `User: ${userData?.name || 'Unknown'}\n` +
            `Username: ${username}\n` +
            `User ID: ${targetUserId}\n\n` +
            `Type your message:`
        );
    } catch (error) {
        console.error('Admin reply error:', error);
        await ctx.reply('⚠️ Error starting admin reply.');
    }
});

// Admin command panel
// Update the existing admin command
bot.command('admin', async (ctx) => {
    const userId = ctx.from.id;
    
    // Check if user is admin
    if (!ADMIN_CHAT_IDS.includes(userId.toString())) {
        return ctx.reply('⛔ Access denied.');
    }
    
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📢 Broadcast Message', 'admin_broadcast_start')],
        [Markup.button.callback('📊 User Statistics', 'admin_stats')],
        [
            Markup.button.callback('📋 Export Users', 'admin_export_basic'),
            Markup.button.callback('📈 Export Detailed', 'admin_export_detailed')
        ],
        [Markup.button.callback('🗄️ Database Info', 'admin_db_info')]
    ]);
    
    await ctx.reply('🔧 **Admin Panel**\n\nSelect an option:', keyboard);
});

// Admin action handlers
bot.action('admin_broadcast_start', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!ADMIN_CHAT_IDS.includes(userId.toString())) {
        return ctx.answerCbQuery('Access denied');
    }
    
    const session = getSession(userId);
    session.state = 'admin_broadcasting';
    
    await ctx.reply(
        '📢 **Broadcast Mode**\n\n' +
        'Type your message to broadcast to all users:\n\n' +
        '⚠️ This will send your message to ALL registered users!'
    );
});

bot.action('admin_stats', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!ADMIN_CHAT_IDS.includes(userId.toString())) {
        return ctx.answerCbQuery('Access denied');
    }
    
    try {
        const { getAllUsers } = require('./utils/db');
        const allUsers = await getAllUsers();
        
        // Count by language
        const languageStats = {};
        allUsers.forEach(user => {
            const lang = user.language || 'unknown';
            languageStats[lang] = (languageStats[lang] || 0) + 1;
        });
        
        let statsMessage = `📊 **User Statistics**\n\n`;
        statsMessage += `Total Users: ${allUsers.length}\n\n`;
        statsMessage += `**By Language:**\n`;
        
        for (const [lang, count] of Object.entries(languageStats)) {
            statsMessage += `${lang.toUpperCase()}: ${count}\n`;
        }
        
        await ctx.reply(statsMessage);
        
    } catch (error) {
        console.error('Stats error:', error);
        await ctx.reply('❌ Error loading statistics.');
    }
});

// UPDATED: Admin reply handler for agent responses with username
bot.action(/admin_reply_(\d+)_agent_(.+)/, async (ctx) => {
    try {
        const targetUserId = ctx.match[1];
        const country = ctx.match[2];
        const session = getSession(ctx.from.id);
        
        // Get user data to show username
        const userData = await getUserData(parseInt(targetUserId));
        const username = userData?.username ? `@${userData.username}` : 'No username';
        
        session.state = 'admin_replying';
        session.data = { 
            targetUserId, 
            requestType: 'agent', 
            country 
        };
        
        await ctx.reply(
            `💬 **Admin Reply Mode**\n\n` +
            `Replying to Agent ${country} inquiry\n` +
            `User: ${userData?.name || 'Unknown'}\n` +
            `Username: ${username}\n` +
            `User ID: ${targetUserId}\n\n` +
            `Type your message:`
        );
    } catch (error) {
        console.error('Admin reply error:', error);
        await ctx.reply('⚠️ Error starting admin reply.');
    }
});

bot.action(/admin_resolve_(\d+)_(\d+)/, async (ctx) => {
    try {
        const targetUserId = ctx.match[1];
        const requestNumber = ctx.match[2];
        
        await updateSubmissionStatus(requestNumber, 'resolved');
        
        // Notify user
        const userKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🏠 Main Menu', 'back_to_main')]
        ]);
        
        await bot.telegram.sendMessage(targetUserId,
            `✅ **Request #${requestNumber} Resolved**\n\nYour request has been marked as resolved by our admin team.`,
            {
                parse_mode: 'Markdown',
                ...userKeyboard
            }
        );
        
        await ctx.reply(
            `✅ Request #${requestNumber} marked as resolved and user notified.`
        );
        
    } catch (error) {
        console.error('Error resolving request:', error);
        await ctx.answerCbQuery('Error resolving request');
    }
});

// ============================================
// BACK TO MAIN MENU HANDLER
// ============================================

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

// Broadcast command
bot.command('broadcast', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!ADMIN_CHAT_IDS.includes(userId.toString())) {
        return ctx.reply('❌ Admin only command.');
    }
    
    const session = getSession(userId);
    session.state = 'admin_broadcasting';
    
    await ctx.reply('📢 Type your broadcast message:');
});

// /connect command
bot.command('connect', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!ADMIN_CHAT_IDS.includes(userId.toString())) {
        return ctx.reply('❌ Access denied. Admin only command.');
    }
    
    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
        return ctx.reply(
            '📋 **Usage:** `/connect <userId> <message>`\n\n' +
            'Example: `/connect 123456789 Hello, how can I help you?`',
            { parse_mode: 'Markdown' }
        );
    }
    
    const targetUserId = args[1];
    const message = args.slice(2).join(' ');
    
    if (!/^\d+$/.test(targetUserId)) {
        return ctx.reply('⚠️ Invalid user ID. Please use numbers only.');
    }
    
    try {
        const userData = await getUserData(parseInt(targetUserId));
        if (!userData) {
            return ctx.reply('⚠️ User not found in database.');
        }
        
        const connectionId = `${userId}_${targetUserId}`;
        activeConnections.set(connectionId, {
            adminId: userId,
            userId: parseInt(targetUserId),
            createdAt: new Date(),
            messageCount: 0
        });
        
        const userKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('💬 Reply to Admin', `reply_admin_${userId}`)],
            [Markup.button.callback('🏠 Main Menu', 'back_to_main')]
        ]);
        
        await bot.telegram.sendMessage(targetUserId, 
            `💬 **Admin Message**\n\n${message}`,
            {
                parse_mode: 'Markdown',
                ...userKeyboard
            }
        );
        
        await ctx.reply(
            `✅ **Message sent to user ${targetUserId}**\n\n` +
            `User: ${userData.name || 'Unknown'}\n` +
            `Connection ID: ${connectionId}\n\n` +
            `The user can now reply once using the reply button.`
        );
        
    } catch (error) {
        console.error('Connect command error:', error);
        await ctx.reply('⚠️ Error sending message to user.');
    }
});

bot.command('connections', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!ADMIN_CHAT_IDS.includes(userId.toString())) {
        return ctx.reply('❌ Access denied. Admin only command.');
    }
    
    if (activeConnections.size === 0) {
        return ctx.reply('📋 No active connections.');
    }
    
    let message = '📋 **Active Connections:**\n\n';
    let count = 1;
    
    for (const [connectionId, connection] of activeConnections.entries()) {
        try {
            const userData = await getUserData(connection.userId);
            message += `${count}. **${userData?.name || 'Unknown'}** (${connection.userId})\n`;
            message += `   Admin: ${connection.adminId}\n`;
            message += `   Created: ${connection.createdAt.toLocaleString()}\n\n`;
            count++;
        } catch (error) {
            message += `${count}. User ${connection.userId} (Error loading data)\n\n`;
            count++;
        }
    }
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
});

bot.command('user', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!ADMIN_CHAT_IDS.includes(userId.toString())) {
        return ctx.reply('❌ Access denied. Admin only command.');
    }
    
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply('📋 **Usage:** `/user <userId>`');
    }
    
    const targetUserId = args[1];
    
    if (!/^\d+$/.test(targetUserId)) {
        return ctx.reply('⚠️ Invalid user ID. Please use numbers only.');
    }
    
    try {
        const userData = await getUserData(parseInt(targetUserId));
        
        if (!userData) {
            return ctx.reply('⚠️ User not found in database.');
        }
        
        const userInfo = 
            `👤 **User Information**\n\n` +
            `**Name:** ${userData.name || 'N/A'}\n` +
            `**Username:** ${userData.username ? `@${userData.username}` : 'N/A'}\n` +
            `**User ID:** ${userData.userId}\n` +
            `**Phone:** ${userData.phone || 'N/A'}\n` +
            `**Language:** ${(userData.language || 'en').toUpperCase()}\n` +
            `**Joined:** ${userData.createdAt ? new Date(userData.createdAt).toLocaleString() : 'N/A'}\n` +
            `**Last Active:** ${userData.updatedAt ? new Date(userData.updatedAt).toLocaleString() : 'N/A'}`;
            
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback(`💬 Connect to ${userData.name || 'User'}`, `quick_connect_${targetUserId}`)]
        ]);
        
        await ctx.reply(userInfo, {
            parse_mode: 'Markdown',
            ...keyboard
        });
        
    } catch (error) {
        console.error('User info error:', error);
        await ctx.reply('⚠️ Error fetching user information.');
    }
});

// Handle user reply to admin
bot.action(/reply_admin_(\d+)/, async (ctx) => {
    const adminId = ctx.match[1];
    const userId = ctx.from.id;
    
    const connectionId = `${adminId}_${userId}`;
    const connection = activeConnections.get(connectionId);
    
    if (!connection) {
        return ctx.answerCbQuery('Connection expired or not found.');
    }
    
    const session = getSession(userId);
    session.state = 'replying_to_admin';
    session.data = {
        adminId: parseInt(adminId),
        connectionId: connectionId
    };
    
    await ctx.reply(
        '💬 **Reply to Admin**\n\nType your message below:',
        { parse_mode: 'Markdown' }
    );
    
    await ctx.answerCbQuery();
});

// Quick connect callback
bot.action(/quick_connect_(\d+)/, async (ctx) => {
    const targetUserId = ctx.match[1];
    const adminId = ctx.from.id;
    
    if (!ADMIN_CHAT_IDS.includes(adminId.toString())) {
        return ctx.answerCbQuery('Access denied');
    }
    
    const session = getSession(adminId);
    session.state = 'quick_connecting';
    session.data = { targetUserId };
    
    await ctx.reply(
        `📋 **Quick Connect to User ${targetUserId}**\n\nType your message:`,
        { parse_mode: 'Markdown' }
    );
    
    await ctx.answerCbQuery();
});

// Helper functions
function generateRequestNumber() {
    return Math.floor(1000 + Math.random() * 9000);
}

function formatDate() {
    return new Date().toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
    });
}

// Clean up expired connections
setInterval(() => {
    const now = new Date();
    const expiredConnections = [];
    
    for (const [connectionId, connection] of activeConnections.entries()) {
        const timeDiff = now - connection.createdAt;
        if (timeDiff > 60 * 60 * 1000) { // 1 hour
            expiredConnections.push(connectionId);
        }
    }
    
    expiredConnections.forEach(connectionId => {
        activeConnections.delete(connectionId);
    });
    
    if (expiredConnections.length > 0) {
        console.log(`Cleaned up ${expiredConnections.length} expired connections`);
    }
}, 10 * 60 * 1000); // Check every 10 minutes

// Cleanup on process termination
process.on('SIGTERM', () => {
    activeConnections.clear();
});

process.on('SIGINT', () => {
    activeConnections.clear();
});

// ============================================
// ERROR HANDLING
// ============================================

bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    // Don't try to reply if it's a blocked user error
    if (err.code === 403 || err.description?.includes('blocked')) {
        console.log(`User ${ctx.from?.id} blocked the bot`);
        return;
    }
    ctx.reply('Sorry, something went wrong. Please try again later.').catch(e => {});
});

// ============================================
// START BOT
// ============================================

async function startBot() {
    try {
        // Create all asset folder structure automatically
        await createAssetFolders();
        
        console.log('🤖 7Starswin Bot starting...');
        await bot.launch();
        console.log('✅ Bot launched successfully!');
        
        // Graceful stop
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
        
    } catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}

// Export users command - Admin only
bot.command('export_users', async (ctx) => {
    const userId = ctx.from.id;
    
    // Check if user is admin
    if (!ADMIN_CHAT_IDS.includes(userId.toString())) {
        return ctx.reply('⛔ Access denied. Admin only command.');
    }
    
    try {
        await ctx.reply('📊 Generating user export... Please wait.');
        
        const { getAllUsers } = require('./utils/db');
        const allUsers = await getAllUsers();
        
        if (allUsers.length === 0) {
            return ctx.reply('📋 No users found in database.');
        }
        
        // Prepare data for Excel export
        const exportData = allUsers.map((user, index) => ({
            'S.No': index + 1,
            'User ID': user.userId || 'N/A',
            'Name': user.name || 'N/A',
            'Username': user.username || 'N/A',
            'Phone': user.phone || 'N/A',
            'Language': (user.language || 'en').toUpperCase(),
            'Registration Date': user.createdAt ? new Date(user.createdAt).toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC'
            }) : 'N/A',
            'Last Active': user.updatedAt ? new Date(user.updatedAt).toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric', 
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC'
            }) : 'N/A',
            'Status': 'Active'
        }));
        
        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        
        // Set column widths for better readability
        const columnWidths = [
            { wch: 8 },   // S.No
            { wch: 12 },  // User ID
            { wch: 20 },  // Name
            { wch: 15 },  // Username
            { wch: 15 },  // Phone
            { wch: 10 },  // Language
            { wch: 18 },  // Registration Date
            { wch: 18 },  // Last Active
            { wch: 10 }   // Status
        ];
        worksheet['!cols'] = columnWidths;
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users Data');
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `7StarsWin_Users_Export_${timestamp}.xlsx`;
        const filepath = path.join('./', filename);
        
        // Write file
        XLSX.writeFile(workbook, filepath);
        
        // Send file to admin
        await ctx.replyWithDocument(
            { source: filepath, filename: filename },
            {
                caption: `📊 User Data Export\n\n` +
                        `Total Users: ${allUsers.length}\n` +
                        `Export Date: ${new Date().toLocaleString('en-GB')}\n` +
                        `File: ${filename}`
            }
        );
        
        // Clean up - delete the file after sending
        setTimeout(async () => {
            try {
                await fs.unlink(filepath);
                console.log(`Cleaned up export file: ${filename}`);
            } catch (error) {
                console.error('Error cleaning up export file:', error);
            }
        }, 5000); // Delete after 5 seconds
        
    } catch (error) {
        console.error('Export users error:', error);
        await ctx.reply('❌ Error generating user export. Please try again.');
    }
});

// Export users with submission stats - Admin only
bot.command('export_users_detailed', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!ADMIN_CHAT_IDS.includes(userId.toString())) {
        return ctx.reply('⛔ Access denied. Admin only command.');
    }
    
    try {
        await ctx.reply('📊 Generating detailed user export... Please wait.');
        
        const { getAllUsers, getSubmissionStats } = require('./utils/db');
        const allUsers = await getAllUsers();
        
        if (allUsers.length === 0) {
            return ctx.reply('📋 No users found in database.');
        }
        
        // Get submission counts for each user
        const exportData = [];
        
        for (let i = 0; i < allUsers.length; i++) {
            const user = allUsers[i];
            
            // Get submission stats for this user
            const submissionStats = await getSubmissionStats(user.userId);
            
            exportData.push({
                'S.No': i + 1,
                'User ID': user.userId || 'N/A',
                'Name': user.name || 'N/A',
                'Username': user.username || 'N/A',
                'Phone': user.phone || 'N/A',
                'Language': (user.language || 'en').toUpperCase(),
                'Registration Date': user.createdAt ? new Date(user.createdAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'UTC'
                }) : 'N/A',
                'Last Active': user.updatedAt ? new Date(user.updatedAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'UTC'
                }) : 'N/A',
                'Total Submissions': submissionStats.total,
                'Player Requests': submissionStats.player,
                'Agent Inquiries': submissionStats.agent,
                'Affiliate Requests': submissionStats.affiliate,
                'Status': 'Active'
            });
        }
        
        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        
        // Set column widths
        const columnWidths = [
            { wch: 8 },   // S.No
            { wch: 12 },  // User ID
            { wch: 20 },  // Name
            { wch: 15 },  // Username
            { wch: 15 },  // Phone
            { wch: 10 },  // Language
            { wch: 18 },  // Registration Date
            { wch: 18 },  // Last Active
            { wch: 12 },  // Total Submissions
            { wch: 12 },  // Player Requests
            { wch: 12 },  // Agent Inquiries
            { wch: 12 },  // Affiliate Requests
            { wch: 10 }   // Status
        ];
        worksheet['!cols'] = columnWidths;
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Detailed Users Data');
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `7StarsWin_Users_Detailed_${timestamp}.xlsx`;
        const filepath = path.join('./', filename);
        
        // Write file
        XLSX.writeFile(workbook, filepath);
        
        // Send file to admin
        await ctx.replyWithDocument(
            { source: filepath, filename: filename },
            {
                caption: `📊 Detailed User Data Export\n\n` +
                        `Total Users: ${allUsers.length}\n` +
                        `Export Date: ${new Date().toLocaleString('en-GB')}\n` +
                        `File: ${filename}\n\n` +
                        `Includes submission statistics for each user.`
            }
        );
        
        // Clean up - delete the file after sending
        setTimeout(async () => {
            try {
                await fs.unlink(filepath);
                console.log(`Cleaned up detailed export file: ${filename}`);
            } catch (error) {
                console.error('Error cleaning up detailed export file:', error);
            }
        }, 5000);
        
    } catch (error) {
        console.error('Detailed export users error:', error);
        await ctx.reply('❌ Error generating detailed user export. Please try again.');
    }
});

// Add handlers for the new export buttons
bot.action('admin_export_basic', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!ADMIN_CHAT_IDS.includes(userId.toString())) {
        return ctx.answerCbQuery('Access denied');
    }
    
    // Trigger the basic export
    ctx.message = { text: '/export_users' };
    ctx.from.id = userId;
    return ctx.telegram.sendMessage(userId, '/export_users').then(() => {
        // Manually trigger the export command
        require('./index.js'); // This will re-execute the export_users command
    });
});

bot.action('admin_export_detailed', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!ADMIN_CHAT_IDS.includes(userId.toString())) {
        return ctx.answerCbQuery('Access denied');
    }
    
    // Trigger the detailed export
    ctx.message = { text: '/export_users_detailed' };
    ctx.from.id = userId;
    return ctx.telegram.sendMessage(userId, '/export_users_detailed').then(() => {
        // Manually trigger the export command
        require('./index.js'); // This will re-execute the export_users_detailed command
    });
});

// Start if running directly
if (require.main === module) {
    startBot();
}

// Export for testing
module.exports = { bot, startBot };
