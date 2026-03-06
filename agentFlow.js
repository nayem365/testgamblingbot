// ============================================
// flows/agentFlow.js - Agent Interest Registration (LANGUAGE FIXED)
// ============================================

const { Markup } = require('telegraf');
const { loadLanguage } = require('../utils/i18n');
const { getUserData, saveSubmission } = require('../utils/db');
const { logToAdmin, formatDate } = require('../utils/helpers');

async function agentFlow(ctx, bot, adminChatIds, getSession, clearSession) {
    const userId = ctx.from.id;
    const userData = await getUserData(userId);
    const language = userData?.language || 'en';
    const texts = loadLanguage(language);
    
    const session = getSession(userId);
    session.state = 'agent_start';
    session.data = { type: 'agent', language };
    
    // Updated order: Bangladesh, India, Pakistan, Egypt, Nepal - 2 buttons per row
    const keyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback(`🇧🇩 ${texts.bangladesh}`, 'agent_country_bangladesh'),
            Markup.button.callback(`🇮🇳 ${texts.india}`, 'agent_country_india')
        ],
        [
            Markup.button.callback(`🇵🇰 ${texts.pakistan}`, 'agent_country_pakistan'),
            Markup.button.callback(`🇪🇬 ${texts.egypt}`, 'agent_country_egypt')
        ],
        [Markup.button.callback(`🇳🇵 ${texts.nepal}`, 'agent_country_nepal')],
        [Markup.button.callback(texts.back, 'back_to_main')]
    ]);
    
    await ctx.editMessageText(
        `🧑‍💼 **${texts.agent_registration}**\n\n${texts.select_your_country}:`,
        { 
            parse_mode: 'Markdown',
            ...keyboard
        }
    );
}

async function showAgentDetails(ctx, country, session) {
    const userId = ctx.from.id;
    const userData = await getUserData(userId);
    const texts = loadLanguage(userData?.language || 'en');
    
    // Store selected country
    session.data.selectedCountry = country;
    session.state = 'agent_details_shown';
    
    const countryNames = {
        bangladesh: texts.bangladesh,
        india: texts.india, 
        pakistan: texts.pakistan,
        egypt: texts.egypt,
        nepal: texts.nepal
    };
    
    const countryName = countryNames[country] || country;
    
    // Updated long detailed message about Mobcash system
    const detailsMessage = `${texts.welcome_to_mobcash} 🎉\n${texts.mobcash_intro}\n\n${texts.mobcash_role}\n\n${texts.mobcash_commission} 💸 ${texts.mobcash_earning}\n\n${texts.mobcash_analogy} 🚀`;
    
    const keyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback(texts.next, `agent_next_${country}`),
            Markup.button.callback(texts.back_arrow, 'back_to_main')
        ]
    ]);
    
    await ctx.reply(detailsMessage, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

async function showAgentConfirmation(ctx, country, session) {
    const userId = ctx.from.id;
    const userData = await getUserData(userId);
    const texts = loadLanguage(userData?.language || 'en');
    
    session.state = 'agent_confirmation';
    
    const countryNames = {
        bangladesh: texts.bangladesh,
        india: texts.india, 
        pakistan: texts.pakistan,
        egypt: texts.egypt,
        nepal: texts.nepal
    };
    
    const countryName = countryNames[country] || country;
    
    // Short confirmation message with accept/reject
    const confirmationMessage = `**${texts.confirm_conditions}** ⭐\n\n⭐ ${texts.deposit_commission}\n⭐ ${texts.withdrawal_commission}\n⭐ ${texts.prepay_requirement}\n\n${texts.are_you_okay} 😊`;
    
    const keyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback(texts.accept, `agent_accept_${country}`),
            Markup.button.callback(texts.reject, `agent_reject_${country}`)
        ],
        [Markup.button.callback(texts.back_arrow, 'back_to_main')]
    ]);
    
    await ctx.reply(confirmationMessage, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

async function handleAgentResponse(ctx, country, response, bot, adminChatIds) {
    const userId = ctx.from.id;
    const userData = await getUserData(userId);
    const texts = loadLanguage(userData?.language || 'en');

    const countryNames = {
        bangladesh: texts.bangladesh,
        india: texts.india,
        pakistan: texts.pakistan,
        egypt: texts.egypt,
        nepal: texts.nepal
    };

    const countryName = countryNames[country] || country;
    const isInterested = response === 'accept';

    try {
        // Save agent response to database
        await saveSubmission({
            userId,
            type: 'agent_response',
            data: {
                country: countryName,
                response: response,
                interested: isInterested,
                language: userData?.language || 'en'
            },
            status: 'pending'
        });

        // Create admin keyboard with reply button
        const adminKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback('💬 Reply to User', `admin_reply_${userId}_agent_${country}`)]
        ]);

        // Notify admin about agent response
        const adminMessage =
            `<b>🧑‍💼 Agent ${isInterested ? 'Interest' : 'Rejection'} - ${countryName}</b>\n\n` +
            `<b>User:</b> ${userData?.name || 'Unknown'}\n` +
            `<b>User ID:</b> ${userId}\n` +
            `<b>Country:</b> ${countryName}\n` +
            `<b>Response:</b> ${isInterested ? '✅ INTERESTED (Accepted)' : '❌ NOT INTERESTED (Rejected)'}\n` +
            `<b>Phone:</b> ${userData?.phone || 'Not provided'}\n` +
            `<b>Language:</b> ${(userData?.language || 'en').toUpperCase()}\n` +
            `<b>Date:</b> ${formatDate()}`;

        // Send notification to all admins
        for (const chatId of adminChatIds) {
            try {
                await bot.telegram.sendMessage(chatId, adminMessage, {
                    parse_mode: 'HTML',
                    ...adminKeyboard
                });
            } catch (error) {
                console.error(`Failed to send admin notification to ${chatId}:`, error.message);
            }
        }

        // Response to user
        let userMessage;
        let userKeyboard;

        if (isInterested) {
            userMessage =
                `<b>✅ ${texts.agent_interest_registered}</b>\n\n` +
                `${texts.thank_you_interest.replace('{country}', countryName)}\n\n` +
                `👉 ${texts.team_contact_soon}\n\n` +
                `${texts.manager_contact_info}`;

            userKeyboard = Markup.inlineKeyboard([
                [Markup.button.url(texts.connect_with_manager, 'https://t.me/atikur_7starswin')],
                [Markup.button.callback(texts.main_menu, 'back_to_main')]
            ]);
        } else {
            userMessage =
                `<b>${texts.rejection_response_title}</b> ${texts.rejection_response_body}\n\n` +
                `${texts.manager_anytime_contact}`;

            userKeyboard = Markup.inlineKeyboard([
                [Markup.button.url(texts.connect_with_manager, 'https://t.me/atikur_7starswin')],
                [Markup.button.callback(texts.main_menu, 'back_to_main')]
            ]);
        }

        await ctx.reply(userMessage, {
            parse_mode: 'HTML',
            ...userKeyboard
        });

    } catch (error) {
        console.error('Error handling agent response:', error);
        await ctx.reply(`⚠️ ${texts.error_processing_response}`);
    }
}

module.exports = { 
    agentFlow,
    showAgentDetails,
    showAgentConfirmation,
    handleAgentResponse

};

