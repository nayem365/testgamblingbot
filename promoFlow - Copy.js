// ============================================
// flows/promoFlow.js - Affiliate Promo Module
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
        Markup.button.callback('👨‍💼 MANAGER', 'affiliate_manager'),
        Markup.button.callback('🎨 PROMO BANNER', 'affiliate_promo_banner')
    ],
    [Markup.button.callback(texts.back, 'back_to_main')]
]);
    
    await ctx.editMessageText(
        '🤝 **Affiliate Options**\n\n' +
        'Choose your option:',
        { 
            parse_mode: 'Markdown',
            ...keyboard
        }
    );
}

async function showManagerCountries(ctx, session) {
    const keyboard = Markup.inlineKeyboard([
    [
        Markup.button.callback('🇵🇰 Pakistan', 'manager_country_pakistan'),
        Markup.button.callback('🇮🇳 India', 'manager_country_india')
    ],
    [Markup.button.callback('🇧🇩 Bangladesh', 'manager_country_bangladesh')],
    [Markup.button.callback('← Back', 'back_to_main')]
]);
    
    await ctx.reply(
        '👨‍💼 **CHOOSE YOUR COUNTRY**\n\nSelect your country to get manager contact:',
        { 
            parse_mode: 'Markdown',
            ...keyboard
        }
    );
}

async function showManagerContact(ctx, country) {
    // Manager contacts for each country
    const managers = {
        pakistan: '@PakistanManager7Stars',
        india: '@IndiaManager7Stars', 
        bangladesh: '@BangladeshManager7Stars'
    };
    
    const managerUsername = managers[country] || '@7StarswinSupport';
    
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.url(`📞 Contact ${country.charAt(0).toUpperCase() + country.slice(1)} Manager`, `https://t.me/${managerUsername.replace('@', '')}`)],
        [Markup.button.callback('🏠 Main Menu', 'back_to_main')]
    ]);
    
    await ctx.reply(
        `✅ **Manager Contact for ${country.charAt(0).toUpperCase() + country.slice(1)}**\n\n` +
        `Manager: ${managerUsername}\n\n` +
        'Click the button below to contact your manager directly.',
        {
            parse_mode: 'Markdown',
            ...keyboard
        }
    );
}

async function askPromoLanguage(ctx, session) {
    // Show English, Bengali, Hindi, and Pakistani options for banner selection
    const keyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback('🇺🇸 English', 'promo_banner_lang_en'),
            Markup.button.callback('🇧🇩 Bangla', 'promo_banner_lang_bn')
        ],
        [
            Markup.button.callback('🇮🇳 हिंदी', 'promo_banner_lang_hi'),
            Markup.button.callback('🇵🇰 Pakistani', 'promo_banner_lang_pk')
        ],
        [Markup.button.callback('← Back', 'back_to_main')]
    ]);
    
    await ctx.reply(
        '🎨 **SELECT BANNER LANGUAGE**\n\nChoose which banner set you want to use:',
        { 
            parse_mode: 'Markdown',
            ...keyboard
        }
    );
}

async function askPromoCode(ctx, session) {
    session.state = 'waiting_promo_code';
    
    await ctx.reply(
        '✏️ **TYPE YOUR PROMO**\n\nEnter your promo code that will be added to the banners (maximum 12 characters):',
        { parse_mode: 'Markdown' }
    );
}

// Function to add text overlay to image (requires Sharp package)
async function addTextToImage(inputPath, outputPath, promoCode) {
    try {
        const image = sharp(inputPath);
        const { width, height } = await image.metadata();
        
        // Increased font size by 45% total (20% + 10% + 15%) and moved down more
        const fontSize = Math.max(54, Math.min(width * 0.091, 115));
        
        // Create SVG text overlay positioned in the purple box area - moved down more
        const textSvg = `
            <svg width="${width}" height="${height}">
                <text 
                    x="50%" 
                    y="93.5%" 
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
    
    try {
        // Validate promo code length again (double check) - updated to 12
        if (!promoCode || promoCode.length > 10) {
            await ctx.reply('⌚ Invalid promo code. Must be 12 characters or less.');
            return;
        }
        
        // Only allow en, bn, hi, pk languages
        if (!['en', 'bn', 'hi', 'pk'].includes(bannerLanguage)) {
            await ctx.reply('⌚ Language not available.');
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
            await ctx.reply(`⌚ No banners available for ${bannerLanguage.toUpperCase()} language currently.`);
            return;
        }
        
        await ctx.reply(`📄 Processing ${imageFiles.length} banners with promo code "${promoCode}" for ${bannerLanguage.toUpperCase()} language...`);
        
        let sentCount = 0;
        let failedCount = 0;
        
        // Process ALL images from the folder
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
                    try {
                        // Send processed image with promo code
                        await ctx.replyWithPhoto({ source: outputPath });
                        sentCount++;
                        
                        // Delete temp file to save space
                        await fs.unlink(outputPath).catch(() => {});
                    } catch (sendError) {
                        console.error(`Error sending processed image ${fileName}:`, sendError);
                        failedCount++;
                    }
                } else {
                    console.error(`Failed to process ${fileName}`);
                    failedCount++;
                }
                
                // Delay between sends to avoid rate limits
                if (i < imageFiles.length - 1) {
                    await delay(500); // 0.5 second delay
                }
                
            } catch (error) {
                console.error(`Error processing ${fileName}:`, error.message);
                failedCount++;
                continue;
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
        
        // Success message to user
        const successMessage = failedCount > 0 
            ? `✅ **Complete!**\n\n${sentCount} banners delivered with promo code: **${promoCode}**\nLanguage: ${bannerLanguage.toUpperCase()}\n\n⚠️ ${failedCount} files failed to process.`
            : `✅ **Complete!**\n\n${sentCount} banners delivered with promo code: **${promoCode}**\nLanguage: ${bannerLanguage.toUpperCase()}\n\nAll images processed successfully!`;
            
        await ctx.reply(successMessage, { parse_mode: 'Markdown' });
        
    } catch (error) {
        console.error('Promo delivery error:', error);
        await ctx.reply('⌚ Error processing banners. Please try again later.');
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