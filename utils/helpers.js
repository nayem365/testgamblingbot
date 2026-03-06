// ============================================
// utils/helpers.js - Helper Functions
// ============================================

const fs = require('fs').promises;
const path = require('path');

function validatePhone(phone) {
    // Bangladesh phone format: +880XXXXXXXXXX
    const phoneRegex = /^\+880[0-9]{10}$/;
    return phoneRegex.test(phone);
}

async function logToAdmin(bot, adminChatIds, message) {
    for (const chatId of adminChatIds) {
        try {
            await bot.telegram.sendMessage(chatId, message);
        } catch (error) {
            console.error(`Failed to send to admin ${chatId}:`, error.message);
        }
    }
}

async function ensureFolder(folderPath) {
    try {
        await fs.access(folderPath);
    } catch {
        await fs.mkdir(folderPath, { recursive: true });
        console.log(`📁 Created folder: ${folderPath}`);
    }
}

// Create all language and folder structure automatically
// Create all language and folder structure automatically
async function createAssetFolders() {
    const languages = ['en', 'bn', 'hi', 'pk']; // Added 'pk' to languages
    
    // Ensure main assets folder exists
    await ensureFolder('./assets');
    
    for (const lang of languages) {
        // Create banners folder for each language (for promo banner feature)
        const bannersPath = path.join('./assets', lang, 'banners');
        await ensureFolder(bannersPath);
        
        // Keep old structure for backward compatibility if needed
        const withCodePath = path.join('./assets', lang, 'with_code');
        const noCodePath = path.join('./assets', lang, 'no_code');
        await ensureFolder(withCodePath);
        await ensureFolder(noCodePath);
    }
    
    console.log('✅ All asset folders created successfully!');
}

async function getFilesInFolder(folderPath) {
    try {
        const files = await fs.readdir(folderPath);
        
        // Filter and sort numbered images (1.jpg, 2.jpg, etc.)
        const imageFiles = files.filter(file => {
            const fileName = file.toLowerCase();
            // Match numbered files: 1.jpg, 2.png, 10.jpeg, etc.
            return fileName.match(/^\d+\.(jpg|jpeg|png|gif|bmp|webp)$/i);
        });
        
        // Sort numerically (1.jpg, 2.jpg, 3.jpg, etc.)
        imageFiles.sort((a, b) => {
            const numA = parseInt(a.match(/^\d+/)[0]);
            const numB = parseInt(b.match(/^\d+/)[0]);
            return numA - numB;
        });
        
        console.log(`📂 Found ${imageFiles.length} images in ${folderPath}:`, imageFiles);
        return imageFiles;
    } catch (error) {
        console.log(`📂 No images found in ${folderPath}`);
        return [];
    }
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

module.exports = {
    validatePhone,
    logToAdmin,
    ensureFolder,
    createAssetFolders,
    getFilesInFolder,
    delay,
    formatDate
};