// ============================================
// flows/promoFlow.js - Affiliate Promo Module (MULTILINGUAL FIXED)
// ============================================

const { Markup } = require('telegraf');
const { loadLanguage } = require('../utils/i18n');
const { getUserData, saveSubmission } = require('../utils/db');
const { ensureFolder, getFilesInFolder, delay, formatDate, logToAdmin } = require('../utils/helpers');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

async function promoFlow(ctx, bot, adminChatIds, getSession, clearSession) {
    const userId = ctx.from.id;
    const userData = await getUserData(userId);
    const language = userData?.language || 'en';
    const texts = loadLanguage(language);
    
    const session = getSession(userId);
    session.state = 'affiliate_start';
    session.data = { type: 'affiliate', language };
    
    const keyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback(`👨‍💼 ${texts.manager}`, 'affiliate_manager'),
            Markup.button.callback(`🎨 ${texts.promo_banner}`, 'affiliate_promo_banner')
        ],
        [Markup.button.callback(texts.back, 'back_to_main')]
    ]);
    
    await ctx.editMessageText(
        `🤝 **${texts.affiliate_options}**\n\n${texts.choose_your_option}:`,
        { 
            parse_mode: 'Markdown',
            ...keyboard
        }
    );
}

async function showManagerCountries(ctx, session) {
    const userId = ctx.from.id;
    const userData = await getUserData(userId);
    const texts = loadLanguage(userData?.language || 'en');
    
    // Updated order: Bangladesh first, India second, Pakistan third, Egypt fourth
    const keyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback(`🇧🇩 ${texts.bangladesh}`, 'manager_country_bangladesh'),
            Markup.button.callback(`🇮🇳 ${texts.india}`, 'manager_country_india')
        ],
        [
            Markup.button.callback(`🇵🇰 ${texts.pakistan}`, 'manager_country_pakistan'),
            Markup.button.callback(`🇪🇬 ${texts.egypt}`, 'manager_country_egypt')
        ],
        [Markup.button.callback(texts.back, 'back_to_main')]
    ]);
    
    await ctx.reply(
        `👨‍💼 **${texts.choose_your_country}**\n\n${texts.select_country_for_manager}:`,
        { 
            parse_mode: 'Markdown',
            ...keyboard
        }
    );
}

async function showManagerContact(ctx, country) {
    const userData = await getUserData(ctx.from.id);
    const texts = loadLanguage(userData?.language || 'en');
    
    // All managers now point to the same handle
    const managerUsername = '@Contact_7starswinpartners';
    
    // Get country name in user's language
    const countryNames = {
        bangladesh: texts.bangladesh,
        india: texts.india,
        pakistan: texts.pakistan,
        egypt: texts.egypt
    };
    
    const countryName = countryNames[country] || country;
    
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.url(`📞 ${texts.contact} ${countryName} ${texts.manager}`, `https://t.me/${managerUsername.replace('@', '')}`)],
        [Markup.button.callback(texts.main_menu, 'back_to_main')]
    ]);
    
    await ctx.reply(
        `✅ <b>${texts.manager_contact_for} ${countryName}</b>\n\n` +
        `${texts.manager}: ${managerUsername}\n\n` +
        `${texts.click_button_to_contact}`,
        {
            parse_mode: 'HTML',
            ...keyboard
        }
    );
}

async function askPromoLanguage(ctx, session) {
    const userData = await getUserData(ctx.from.id);
    const texts = loadLanguage(userData?.language || 'en');
    
    // Show English, Bengali, Hindi, and Pakistani options for banner selection
    const keyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback(`🇺🇸 ${texts.english}`, 'promo_banner_lang_en'),
            Markup.button.callback(`🇧🇩 ${texts.bangla}`, 'promo_banner_lang_bn')
        ],
        [
            Markup.button.callback(`🇮🇳 ${texts.hindi}`, 'promo_banner_lang_hi'),
            Markup.button.callback(`🇵🇰 ${texts.pakistani}`, 'promo_banner_lang_pk')
        ],
        [Markup.button.callback(texts.back, 'back_to_main')]
    ]);
    
    await ctx.reply(
        `🎨 **${texts.select_banner_language}**\n\n${texts.choose_banner_set}:`,
        { 
            parse_mode: 'Markdown',
            ...keyboard
        }
    );
}

async function askPromoCode(ctx, session) {
    const userData = await getUserData(ctx.from.id);
    const texts = loadLanguage(userData?.language || 'en');
    
    session.state = 'waiting_promo_code';
    
    await ctx.reply(
        `✏️ **${texts.type_your_promo}**\n\n${texts.enter_promo_code_message}`,
        { parse_mode: 'Markdown' }
    );
}

// Function to add text overlay to image with adjusted positioning
async function addTextToImage(inputPath, outputPath, promoCode) {
    try {
        const image = sharp(inputPath);
        const { width, height } = await image.metadata();
        
        // Font size calculation
        const fontSize = Math.max(54, Math.min(width * 0.091, 115));
        
        // Text positioned at 94.5%
        const textSvg = `
            <svg width="${width}" height="${height}">
                <text 
                    x="50%" 
                    y="94.5%" 
                    text-anchor="middle" 
                    font-family="Impact, 'Bebas Neue', 'Anton', 'Oswald', Arial Black, Arial, sans-serif"
                    font-size="${fontSize}" 
                    font-weight="900"
                    fill="white" 
                    letter-spacing="2px"
                    text-transform="uppercase"
                >${promoCode}</text>
            </svg>
        `;
        
        // Composite text onto image
        await image
            .composite([{
                input: Buffer.from(textSvg),
                top: 0,
                left: 0
            }])
            .jpeg({ quality: 95 })
            .toFile(outputPath);
            
        return true;
        
    } catch (error) {
        console.error('Error processing image:', error);
        return false;
    }
}

async function deliverPromoMaterials(ctx, bot, adminChatIds, session, userId) {
    const { bannerLanguage, promoCode } = session.data;
    const userData = await getUserData(userId);
    const texts = loadLanguage(userData?.language || 'en');
    
    try {
        // Validate promo code length - 10 CHARACTERS
        if (!promoCode || promoCode.length > 10) {
            await ctx.reply(`⚠️ ${texts.invalid_promo_code}`);
            return;
        }
        
        // Only allow en, bn, hi, pk languages
        if (!['en', 'bn', 'hi', 'pk'].includes(bannerLanguage)) {
            await ctx.reply(`⚠️ ${texts.language_not_available}`);
            return;
        }
        
        // Path to banners folder for selected language
        const folderPath = path.join('./assets', bannerLanguage, 'banners');
        const tempFolder = path.join('./temp', userId.toString());
        
        // Ensure folders exist
        await ensureFolder(folderPath);
        await ensureFolder(tempFolder);
        
        // Get ALL image files from the selected language folder
        const imageFiles = await getFilesInFolder(folderPath);
        
        if (imageFiles.length === 0) {
            await ctx.reply(`⚠️ ${texts.no_banners_available.replace('{language}', bannerLanguage.toUpperCase())}`);
            return;
        }
        
        await ctx.reply(`📄 ${texts.processing_banners.replace('{count}', imageFiles.length).replace('{promo}', promoCode).replace('{language}', bannerLanguage.toUpperCase())}`);
        
        let sentCount = 0;
        let failedCount = 0;
        const processedImages = [];
        
        // First, process ALL images
        for (let i = 0; i < imageFiles.length; i++) {
            const fileName = imageFiles[i];
            try {
                const inputPath = path.join(folderPath, fileName);
                const outputPath = path.join(tempFolder, `${promoCode}_${fileName}`);
                
                // Check if input file exists
                await fs.access(inputPath);
                
                // Add promo code text to image
                const success = await addTextToImage(inputPath, outputPath, promoCode);
                
                if (success) {
                    processedImages.push(outputPath);
                } else {
                    console.error(`Failed to process ${fileName}`);
                    failedCount++;
                }
                
            } catch (error) {
                console.error(`Error processing ${fileName}:`, error.message);
                failedCount++;
                continue;
            }
        }
        
        // Send processed images in groups of up to 10 (media group limit)
        const groupSize = 10;
        for (let i = 0; i < processedImages.length; i += groupSize) {
            const currentGroup = processedImages.slice(i, i + groupSize);
            
            try {
                // Create media group
                const mediaGroup = currentGroup.map(imagePath => ({
                    type: 'photo',
                    media: { source: imagePath }
                }));
                
                // Send media group
                await ctx.replyWithMediaGroup(mediaGroup);
                sentCount += currentGroup.length;
                
                // Delay between groups to avoid rate limits
                if (i + groupSize < processedImages.length) {
                    await delay(1000); // 1 second delay between groups
                }
                
            } catch (sendError) {
                console.error(`Error sending media group:`, sendError);
                failedCount += currentGroup.length;
            }
        }
        
        // Cleanup temp files
        for (const imagePath of processedImages) {
            try {
                await fs.unlink(imagePath);
            } catch (cleanupError) {
                // Ignore cleanup errors
            }
        }
        
        // Cleanup temp folder
        try {
            const tempFiles = await fs.readdir(tempFolder);
            for (const file of tempFiles) {
                await fs.unlink(path.join(tempFolder, file)).catch(() => {});
            }
            await fs.rmdir(tempFolder).catch(() => {});
        } catch (cleanupError) {
            console.log('Cleanup completed');
        }
        
        // Save submission record
        await saveSubmission({
            userId,
            type: 'affiliate_promo_banner',
            data: {
                promoCode,
                bannerLanguage,
                filesDelivered: sentCount,
                totalFiles: imageFiles.length,
                failedFiles: failedCount
            }
        });
        
        // Notify admin
        const adminMessage = `🎨 Promo Banner Request Complete\n\n` +
            `Name: ${userData?.name || 'Unknown'}\n` +
            `User ID: ${userId}\n` +
            `Language: ${bannerLanguage.toUpperCase()}\n` +
            `Promo Code: ${promoCode}\n` +
            `Files Sent: ${sentCount}/${imageFiles.length}\n` +
            `Failed: ${failedCount}\n` +
            `Date: ${formatDate()}`;
        
        await logToAdmin(bot, adminChatIds, adminMessage);
        
        // Success message to user with completion status
        const successMessage = failedCount > 0 
            ? `✅ **${texts.complete}!**\n\n${texts.banners_delivered_with_failures.replace('{count}', sentCount).replace('{promo}', promoCode).replace('{language}', bannerLanguage.toUpperCase()).replace('{failed}', failedCount)}`
            : `✅ **${texts.complete}!**\n\n${texts.banners_delivered_success.replace('{count}', sentCount).replace('{promo}', promoCode).replace('{language}', bannerLanguage.toUpperCase())}`;
            
        await ctx.reply(successMessage, { parse_mode: 'Markdown' });
        
        // Enhanced promotional message with translations
        // Updated unified promotional message (multi-line layout)
const enhancedPromoMessage = texts.final_promo_message.replace(/{promo}/g, `<b>${promoCode}</b>`);


        // App download keyboard
        const appKeyboard = Markup.inlineKeyboard([
            [Markup.button.url(`📱 ${texts.download_app}`, 'https://7starswin.com/downloads/androidclient/releases_android/7StarsWin/site/7StarsWin.apk')],
            [Markup.button.callback(texts.main_menu, 'back_to_main')]
        ]);
        
        // Send enhanced promotional message
        await ctx.reply(enhancedPromoMessage, {
    parse_mode: 'HTML',
    ...appKeyboard
});
        
    } catch (error) {
        console.error('Promo delivery error:', error);
        await ctx.reply(`⚠️ ${texts.error_processing_banners}`);
    }
}

module.exports = { 
    promoFlow, 
    askPromoLanguage, 
    askPromoCode,
    showManagerCountries,
    showManagerContact,
    deliverPromoMaterials 
};