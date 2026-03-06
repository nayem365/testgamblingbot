// ============================================
// utils/i18n.js - Internationalization (FULL BOT: Player, Agent, Promo, Settings)
// Languages: English (en), Hindi (hi), Bengali (bn)
// ============================================

const translations = {
  en: {
    // COMMON
    welcome: "Welcome to FS Promo Bot!",
    file_required: "Please upload a screenshot or video file.",
    main_menu: "Main Menu",
    back: "Back",
    back_arrow: "Back",
    error_processing_response: "Error processing your response. Please try again.",
    choose_option: "Please choose an option:",
    
final_promo_message: `
🚀 Start promoting now with code {promo}!

💰 Promote 7starsWin using these banners and earn commission for using your promocode! 

📱 Direct your users to register using your promo code: {promo}
👾 7StarsWin - Premium Betting Platform
⭐ Instant deposits & withdrawals
⭐ 24/7 customer support
⭐ Get Affiliate commission Upto 50%
⭐ Fast Payout Service 
⭐ Become Mobicash agent and earn more💰

📱 Download Our App:
👆 Get our official app for the best betting experience!

🎯 Refer with this Promo-Code: {promo}`,


    // MAIN MENU ITEMS
    player: "Player Support",
    affiliate: "Affiliate Options", 
    agent: "Agent Registration",
    settings: "Settings",

    // PLAYER FLOW
    player_support: "Player Support",
    where_are_you_from: "Where are you from?",
    what_issue_type: "What type of issue are you facing?",
    bangladesh: "Bangladesh",
    india: "India",
    pakistan: "Pakistan",
    egypt: "Egypt",
    nepal: "Nepal",
    deposit: "Deposit Issue",
    withdrawal: "Withdrawal Issue",
    bangladesh_payment_systems: "Bangladesh Payment Systems",
    india_payment_systems: "India Payment Systems",
    enter_player_id: "Enter Player ID (numbers only):",
    enter_user_id: "Enter User ID (numbers only):",
    enter_phone: "Enter Phone Number",
    enter_agent: "Enter Agent Number",
    enter_amount: "Enter Amount",
    enter_time: "Enter Time",
    upload_file: "Upload Screenshot/Video",
    select_date: "Select Date",
    current_month: "Current Month",
    monday_short: "Mon",
    tuesday_short: "Tue", 
    wednesday_short: "Wed",
    thursday_short: "Thu",
    friday_short: "Fri",
    saturday_short: "Sat",
    sunday_short: "Sun",
    confirm_details: "Confirm Your Details",
    is_information_correct: "Is this information correct?",
    submit: "Submit",
    restart: "Restart",
    request_registered: "Request Registered #",
    admin_team_response: "Our admin team will respond soon.",
    notification_info: "You will be notified here when there is an update.",
    your_uploaded_file: "Your Uploaded File",
    file_preview: "File Preview",
    file_uploaded_success: "File uploaded successfully",
    invalid_user_id: "Invalid User ID. Please enter numbers only.",
    error_submitting_request: "Error submitting your request. Please try again later.",

    // AGENT FLOW
    agent_welcome: "Become a Mobcash Agent!",
    agent_registration: "Agent Registration",
    select_your_country: "Select your country",
    agent_intro: "Earn commission by recruiting players and managing deposits/withdrawals.",
    agent_commission: "Commission Structure:\n- Player deposits: 5%\n- Player withdrawals: 2%",
    agent_register: "Register as Agent",
    agent_country_select: "Select your country:",
    agent_confirm: "Do you want to proceed with agent registration?",
    agent_success: "You have been registered as an agent!",
    agent_cancel: "Agent registration cancelled.",
    welcome_to_mobcash: "Welcome to Mobcash Agent Program!",
    mobcash_intro: "Join our exclusive agent network and earn commissions.",
    mobcash_role: "As a Mobcash agent, you'll help players with deposits and withdrawals while earning money.",
    mobcash_commission: "Commission: 5% on deposits, 2% on withdrawals",
    mobcash_earning: "Start earning immediately after approval!",
    mobcash_analogy: "Think of it like being a bank representative - you help customers and get paid!",
    next: "Next",
    confirm_conditions: "Agent Terms & Conditions",
    deposit_commission: "Deposit Commission: 5%",
    withdrawal_commission: "Withdrawal Commission: 2%", 
    prepay_requirement: "Prepayment required for some transactions",
    are_you_okay: "Are you okay with these conditions?",
    accept: "Accept",
    reject: "Reject",
    agent_interest_registered: "Agent Interest Registered!",
    thank_you_interest: "Thank you for your interest in becoming a {country} agent!",
    team_contact_soon: "Our team will contact you soon.",
    manager_contact_info: "You can also contact our manager directly.",
    connect_with_manager: "Connect with Manager",
    rejection_response_title: "No Problem!",
    rejection_response_body: "We understand this opportunity isn't for everyone.",
    manager_anytime_contact: "You can contact our manager anytime if you change your mind.",

    // PROMO FLOW
    affiliate_options: "Affiliate Options",
    choose_your_option: "Choose your option",
    manager: "Contact Manager",
    banner: "Create Banner",
    promo_banner: "Promo Banner",
    banner_language: "Select banner language:",
    enter_promo_code: "Enter your promo code:",
    enter_promo_code_message: "Enter your promo code that will be added to the banners (maximum 10 characters):",
    processing_banner: "Generating your banner...",
    banner_success: "Your banner is ready!",
    banner_fail: "Failed to generate banner. Try again.",
    choose_your_country: "Choose Your Country",
    select_country_for_manager: "Select your country to get manager contact",
    english: "English",
    bangla: "Bangla",
    hindi: "Hindi",
    pakistani: "Pakistani",
    select_banner_language: "Select Banner Language",
    choose_banner_set: "Choose which banner set you want",
    type_your_promo: "TYPE YOUR PROMO",
    manager_contact_for: "Manager Contact for",
    contact: "Contact",
    click_button_to_contact: "Click the button below to contact the manager.",
    processing_banners: "Processing {count} banners with promo code '{promo}' in {language}...",
    complete: "Complete",
    banners_delivered_success: "{count} banners delivered with your promo code '{promo}' in {language}!",
    banners_delivered_with_failures: "{count} banners delivered with your promo code '{promo}' in {language}! ({failed} failed)",
    invalid_promo_code: "Invalid promo code. Maximum 10 characters allowed.",
    language_not_available: "Selected language not available.",
    no_banners_available: "No banners available for {language} language.",
    error_processing_banners: "Error processing banners. Please try again.",
    
    // Updated Promo Message Keys
    promote_with_code: "Start promoting now with code **{promo}**!",
    share_banners_earn: "Promote 7starsWin using these banners and earn commission for using your promocode!",
    direct_users_register: "Direct your users to register using your promo code: **{promo}**",
    seven_stars_premium: "7StarsWin - Premium Betting Platform",
    get_affiliate_commission_upto_50: "Get Affiliate commission Upto 50%",
    fast_payout_service: "Fast Payout Service",
    become_mobicash_agent_earn_more: "Become Mobicash agent and earn more",
    get_official_app: "Get our official app for the best betting experience!",
    refer_with_this_promo_code: "Refer with this Promo-Code: **{promo}**",
    
    // Existing keys that remain
    download_our_app: "Download Our App",
    instant_deposits_withdrawals: "Instant deposits & withdrawals",
    customer_support_24_7: "24/7 customer support",
    secure_licensed_platform: "Secure & licensed platform",
    download_app: "Download App",

    // SETTINGS / ADMIN FLOW
    settings: "Settings",
    select_language: "Select your language:",
    language_updated: "Language updated successfully!",
    language_changed: "Language changed successfully!",
    contact_support: "Contact Support",
    broadcast: "Broadcast Message",
    send_broadcast: "Enter the message to broadcast:",
    broadcast_success: "Message sent to all users.",
    export_excel: "Export Data (Excel)",
    export_ready: "Excel file ready.",
    user_management: "User Management",
    block_user: "Block User",
    unblock_user: "Unblock User"
  },

  hi: {
    // COMMON
    welcome: "FS Promo Bot में आपका स्वागत है!",
    file_required: "कृपया एक स्क्रीनशॉट या वीडियो फ़ाइल अपलोड करें।",
    main_menu: "मुख्य मेनू",
    back: "वापस",
    back_arrow: "वापस",
    error_processing_response: "आपकी प्रतिक्रिया को संसाधित करने में त्रुटि। कृपया पुनः प्रयास करें।",
    choose_option: "कृपया एक विकल्प चुनें:",
    
    // MAIN MENU ITEMS
    player: "खिलाड़ी सहायता",
    affiliate: "एफिलिएट विकल्प",
    agent: "एजेंट पंजीकरण", 
    settings: "सेटिंग्स",

    // PLAYER FLOW
    player_support: "प्लेयर सहायता",
    where_are_you_from: "आप कहाँ से हैं?",
    what_issue_type: "आपको किस प्रकार की समस्या है?",
    bangladesh: "बांग्लादेश",
    india: "भारत",
    pakistan: "पाकिस्तान", 
    egypt: "मिस्र",
    nepal: "नेपाल",
    deposit: "जमा समस्या",
    withdrawal: "निकासी समस्या",
    bangladesh_payment_systems: "बांग्लादेश भुगतान प्रणाली",
    india_payment_systems: "भारत भुगतान प्रणाली",
    enter_player_id: "प्लेयर आईडी दर्ज करें (केवल नंबर):",
    enter_user_id: "यूजर आईडी दर्ज करें (केवल नंबर):",
    enter_phone: "फोन नंबर दर्ज करें",
    enter_agent: "एजेंट नंबर दर्ज करें", 
    enter_amount: "राशि दर्ज करें",
    enter_time: "समय दर्ज करें",
    upload_file: "स्क्रीनशॉट/वीडियो अपलोड करें",
    select_date: "तारीख चुनें",
    current_month: "वर्तमान महीना",
    monday_short: "सोम",
    tuesday_short: "मंगल",
    wednesday_short: "बुध", 
    thursday_short: "गुरु",
    friday_short: "शुक्र",
    saturday_short: "शनि",
    sunday_short: "रवि",
    confirm_details: "अपने विवरण की पुष्टि करें",
    is_information_correct: "क्या यह जानकारी सही है?",
    submit: "जमा करें",
    restart: "पुनः आरंभ करें",
    request_registered: "अनुरोध पंजीकृत #",
    admin_team_response: "हमारी व्यवस्थापक टीम जल्द ही जवाब देगी।",
    notification_info: "जब कोई अपडेट होगा तो आपको यहाँ सूचित किया जाएगा।",
    your_uploaded_file: "आपकी अपलोड की गई फाइल",
    file_preview: "फाइल पूर्वावलोकन",
    file_uploaded_success: "फाइल सफलतापूर्वक अपलोड हुई",
    invalid_user_id: "अमान्य यूजर आईडी। कृपया केवल नंबर दर्ज करें।",
    error_submitting_request: "आपका अनुरोध जमा करने में त्रुटि। कृपया बाद में पुनः प्रयास करें।",

    // AGENT FLOW
    agent_welcome: "Mobcash एजेंट बनें!",
    agent_registration: "एजेंट पंजीकरण",
    select_your_country: "अपना देश चुनें",
    agent_intro: "प्लेयर को जोड़कर और जमा/निकासी प्रबंधित करके कमीशन अर्जित करें।",
    agent_commission: "कमीशन संरचना:\n- प्लेयर जमा: 5%\n- प्लेयर निकासी: 2%",
    agent_register: "एजेंट के रूप में पंजीकरण करें",
    agent_country_select: "अपना देश चुनें:",
    agent_confirm: "क्या आप एजेंट पंजीकरण जारी रखना चाहते हैं?",
    agent_success: "आप एजेंट के रूप में पंजीकृत हो गए हैं!",
    agent_cancel: "एजेंट पंजीकरण रद्द किया गया।",
    welcome_to_mobcash: "Mobcash एजेंट कार्यक्रम में स्वागत!",
    mobcash_intro: "हमारे विशेष एजेंट नेटवर्क में शामिल हों और कमीशन कमाएं।",
    mobcash_role: "Mobcash एजेंट के रूप में, आप खिलाड़ियों की जमा और निकासी में मदद करते हुए पैसा कमाएंगे।",
    mobcash_commission: "कमीशन: जमा पर 5%, निकासी पर 2%",
    mobcash_earning: "अप्रूवल के बाद तुरंत कमाना शुरू करें!",
    mobcash_analogy: "इसे बैंक प्रतिनिधि की तरह समझें - आप ग्राहकों की मदद करते हैं और भुगतान पाते हैं!",
    next: "आगे",
    confirm_conditions: "एजेंट नियम व शर्तें",
    deposit_commission: "जमा कमीशन: 5%",
    withdrawal_commission: "निकासी कमीशन: 2%",
    prepay_requirement: "कुछ लेनदेन के लिए प्रीपेमेंट आवश्यक",
    are_you_okay: "क्या आप इन शर्तों से सहमत हैं?",
    accept: "स्वीकार करें",
    reject: "अस्वीकार करें",
    agent_interest_registered: "एजेंट रुचि पंजीकृत!",
    thank_you_interest: "{country} एजेंट बनने में आपकी रुचि के लिए धन्यवाद!",
    team_contact_soon: "हमारी टीम जल्द ही आपसे संपर्क करेगी।",
    manager_contact_info: "आप हमारे मैनेजर से भी सीधे संपर्क कर सकते हैं।",
    connect_with_manager: "मैनेजर से जुड़ें",
    rejection_response_title: "कोई बात नहीं!",
    rejection_response_body: "हम समझते हैं कि यह अवसर सभी के लिए नहीं है।",
    manager_anytime_contact: "यदि आप अपना मन बदलते हैं तो कभी भी हमारे मैनेजर से संपर्क कर सकते हैं।",




    // PROMO FLOW
    affiliate_options: "एफिलिएट विकल्प",
    choose_your_option: "अपना विकल्प चुनें",
    manager: "मैनेजर से संपर्क करें",
    banner: "बैनर बनाएं",
    promo_banner: "प्रोमो बैनर",
    banner_language: "बैनर की भाषा चुनें:",
    enter_promo_code: "अपना प्रोमो कोड दर्ज करें:",
    enter_promo_code_message: "अपना प्रोमो कोड दर्ज करें जो बैनर में जोड़ा जाएगा (अधिकतम 10 अक्षर):",
    processing_banner: "आपका बैनर बनाया जा रहा है...",
    banner_success: "आपका बैनर तैयार है!",
    banner_fail: "बैनर बनाने में विफल। कृपया पुनः प्रयास करें।",
    choose_your_country: "अपना देश चुनें",
    select_country_for_manager: "मैनेजर संपर्क के लिए अपना देश चुनें",
    english: "अंग्रेजी",
    bangla: "बंगाली",
    hindi: "हिंदी",
    pakistani: "पाकिस्तानी",
    select_banner_language: "बैनर भाषा चुनें",
    choose_banner_set: "चुनें कि आपको कौन सा बैनर सेट चाहिए",
    type_your_promo: "अपना प्रोमो टाइप करें",
    manager_contact_for: "के लिए मैनेजर संपर्क",
    contact: "संपर्क",
    click_button_to_contact: "मैनेजर से संपर्क करने के लिए नीचे दिया गया बटन दबाएं।",
    processing_banners: "{language} में प्रोमो कोड '{promo}' के साथ {count} बैनर प्रोसेस हो रहे हैं...",
    complete: "पूर्ण",
    banners_delivered_success: "{language} में आपके प्रोमो कोड '{promo}' के साथ {count} बैनर डिलीवर किए गए!",
    banners_delivered_with_failures: "{language} में आपके प्रोमो कोड '{promo}' के साथ {count} बैनर डिलीवर किए गए! ({failed} विफल)",
    invalid_promo_code: "अमान्य प्रोमो कोड। अधिकतम 10 अक्षर की अनुमति है।",
    language_not_available: "चयनित भाषा उपलब्ध नहीं है।",
    no_banners_available: "{language} भाषा के लिए कोई बैनर उपलब्ध नहीं।",
    error_processing_banners: "बैनर प्रोसेस करने में त्रुटि। कृपया पुनः प्रयास करें।",
    
    // Updated Promo Message Keys
    promote_with_code: "कोड **{promo}** के साथ अभी प्रचार करना शुरू करें!",
    share_banners_earn: "इन बैनरों का उपयोग करके 7starsWin का प्रचार करें और अपने प्रोमोकोड का उपयोग करने के लिए कमीशन कमाएं!",
    direct_users_register: "अपने उपयोगकर्ताओं को अपने प्रोमो कोड: **{promo}** का उपयोग करके पंजीकरण करने के लिए निर्देशित करें",
    seven_stars_premium: "7StarsWin - प्रीमियम बेटिंग प्लेटफॉर्म",
    get_affiliate_commission_upto_50: "50% तक एफिलिएट कमीशन प्राप्त करें",
    fast_payout_service: "तेज भुगतान सेवा",
    become_mobicash_agent_earn_more: "मोबिकैश एजेंट बनें और अधिक कमाएं",
    get_official_app: "सर्वोत्तम बेटिंग अनुभव के लिए हमारा आधिकारिक ऐप प्राप्त करें!",
    refer_with_this_promo_code: "इस प्रोमो-कोड के साथ रेफर करें: **{promo}**",
    final_promo_message: `
🚀 अभी प्रचार शुरू करें कोड {promo} के साथ!

💰 इन बैनरों का उपयोग करके 7starsWin का प्रचार करें और अपने प्रोमो कोड से कमीशन कमाएं! 

📱 अपने उपयोगकर्ताओं को अपने प्रोमो कोड: {promo} का उपयोग करके रजिस्टर करने के लिए निर्देशित करें
👾 7StarsWin - प्रीमियम बेटिंग प्लेटफॉर्म
⭐ त्वरित जमा और निकासी
⭐ 24/7 ग्राहक सहायता
⭐ 50% तक एफिलिएट कमीशन प्राप्त करें
⭐ तेज़ भुगतान सेवा
⭐ मोबिकैश एजेंट बनें और अधिक कमाएं💰

📱 हमारा ऐप डाउनलोड करें:
👆 सर्वोत्तम बेटिंग अनुभव के लिए हमारा आधिकारिक ऐप प्राप्त करें!

🎯 इस प्रोमो-कोड से रेफर करें: {promo}`,

    // Existing keys that remain
    download_our_app: "हमारा ऐप डाउनलोड करें",
    instant_deposits_withdrawals: "तत्काल जमा और निकासी",
    customer_support_24_7: "24/7 ग्राहक सहायता",
    secure_licensed_platform: "सुरक्षित और लाइसेंस प्राप्त प्लेटफॉर्म",
    download_app: "ऐप डाउनलोड करें",

    // SETTINGS / ADMIN FLOW
    settings: "सेटिंग्स",
    select_language: "अपनी भाषा चुनें:",
    language_updated: "भाषा सफलतापूर्वक अपडेट की गई!",
    language_changed: "भाषा सफलतापूर्वक बदली गई!",
    contact_support: "सहायता से संपर्क करें",
    broadcast: "संदेश प्रसारण",
    send_broadcast: "प्रसारण के लिए संदेश दर्ज करें:",
    broadcast_success: "संदेश सभी उपयोगकर्ताओं को भेजा गया।",
    export_excel: "डेटा एक्सपोर्ट करें (Excel)",
    export_ready: "एक्सेल फ़ाइल तैयार है।",
    user_management: "उपयोगकर्ता प्रबंधन",
    block_user: "उपयोगकर्ता को ब्लॉक करें",
    unblock_user: "उपयोगकर्ता को अनब्लॉक करें"
  },

  bn: {
    // COMMON
    welcome: "FS Promo Bot-এ স্বাগতম!",
    file_required: "অনুগ্রহ করে একটি স্ক্রিনশট বা ভিডিও ফাইল আপলোড করুন।",
    main_menu: "প্রধান মেনু",
    back: "ফিরে যান",
    back_arrow: "ফিরে যান",
    error_processing_response: "আপনার প্রতিক্রিয়া প্রক্রিয়াকরণে ত্রুটি। অনুগ্রহ করে আবার চেষ্টা করুন।",
    choose_option: "অনুগ্রহ করে একটি বিকল্প নির্বাচন করুন:",
    
    // MAIN MENU ITEMS
    player: "প্লেয়ার সহায়তা",
    affiliate: "অ্যাফিলিয়েট বিকল্প",
    agent: "এজেন্ট নিবন্ধন",
    settings: "সেটিংস",

    // PLAYER FLOW
    player_support: "প্লেয়ার সাপোর্ট",
    where_are_you_from: "আপনি কোথা থেকে?",
    what_issue_type: "আপনার কী ধরনের সমস্যা হচ্ছে?",
    bangladesh: "বাংলাদেশ",
    india: "ভারত",
    pakistan: "পাকিস্তান",
    egypt: "মিশর",
    nepal: "নেপাল",
    deposit: "জমা সমস্যা",
    withdrawal: "উত্তোলন সমস্যা",
    bangladesh_payment_systems: "বাংলাদেশ পেমেন্ট সিস্টেম",
    india_payment_systems: "ভারত পেমেন্ট সিস্টেম",
    enter_player_id: "প্লেয়ার আইডি লিখুন (শুধুমাত্র সংখ্যা):",
    enter_user_id: "ইউজার আইডি লিখুন (শুধুমাত্র সংখ্যা):",
    enter_phone: "ফোন নম্বর দিন",
    enter_agent: "এজেন্ট নম্বর দিন",
    enter_amount: "পরিমাণ লিখুন",
    enter_time: "সময় লিখুন",
    upload_file: "স্ক্রিনশট/ভিডিও আপলোড করুন",
    select_date: "তারিখ নির্বাচন করুন",
    current_month: "বর্তমান মাস",
    monday_short: "সোম",
    tuesday_short: "মঙ্গল",
    wednesday_short: "বুধ",
    thursday_short: "বৃহঃ",
    friday_short: "শুক্র",
    saturday_short: "শনি",
    sunday_short: "রবি",
    confirm_details: "আপনার বিবরণ নিশ্চিত করুন",
    is_information_correct: "এই তথ্য কি সঠিক?",
    submit: "জমা দিন",
    restart: "পুনরায় শুরু করুন",
    request_registered: "অনুরোধ নিবন্ধিত #",
    admin_team_response: "আমাদের প্রশাসক দল শীঘ্রই জবাব দেবে।",
    notification_info: "যখন কোন আপডেট থাকবে তখন আপনাকে এখানে জানানো হবে।",
    your_uploaded_file: "আপনার আপলোড করা ফাইল",
    file_preview: "ফাইল প্রিভিউ",
    file_uploaded_success: "ফাইল সফলভাবে আপলোড হয়েছে",
    invalid_user_id: "অবৈধ ইউজার আইডি। অনুগ্রহ করে শুধুমাত্র সংখ্যা দিন।",
    error_submitting_request: "আপনার অনুরোধ জমা দিতে ত্রুটি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",

    // AGENT FLOW
    agent_welcome: "Mobcash এজেন্ট হন!",
    agent_registration: "এজেন্ট নিবন্ধন",
    select_your_country: "আপনার দেশ নির্বাচন করুন",
    agent_intro: "প্লেয়ার নিয়োগ এবং জমা/উত্তোলন পরিচালনার মাধ্যমে কমিশন উপার্জন করুন।",
    agent_commission: "কমিশন কাঠামো:\n- প্লেয়ার জমা: 5%\n- প্লেয়ার উত্তোলন: 2%",
    agent_register: "এজেন্ট হিসাবে নিবন্ধন করুন",
    agent_country_select: "আপনার দেশ নির্বাচন করুন:",
    agent_confirm: "আপনি কি এজেন্ট নিবন্ধন চালিয়ে যেতে চান?",
    agent_success: "আপনি এজেন্ট হিসাবে নিবন্ধিত হয়েছেন!",
    agent_cancel: "এজেন্ট নিবন্ধন বাতিল করা হয়েছে।",
    welcome_to_mobcash: "Mobcash এজেন্ট প্রোগ্রামে স্বাগতম!",
    mobcash_intro: "আমাদের এক্সক্লুসিভ এজেন্ট নেটওয়ার্কে যোগ দিন এবং কমিশন উপার্জন করুন।",
    mobcash_role: "Mobcash এজেন্ট হিসেবে, আপনি খেলোয়াড়দের জমা এবং উত্তোলনে সাহায্য করে অর্থ উপার্জন করবেন।",
    mobcash_commission: "কমিশন: জমার উপর 5%, উত্তোলনের উপর 2%",
    mobcash_earning: "অনুমোদনের পর তৎক্ষণাৎ উপার্জন শুরু করুন!",
    mobcash_analogy: "এটিকে ব্যাংক প্রতিনিধির মতো ভাবুন - আপনি গ্রাহকদের সাহায্য করেন এবং অর্থ পান!",
    next: "পরবর্তী",
    confirm_conditions: "এজেন্ট নিয়ম ও শর্তাবলী",
    deposit_commission: "জমা কমিশন: 5%",
    withdrawal_commission: "উত্তোলন কমিশন: 2%",
    prepay_requirement: "কিছু লেনদেনের জন্য প্রি-পেমেন্ট প্রয়োজন",
    are_you_okay: "আপনি কি এই শর্তাবলীতে সম্মত?",
    accept: "গ্রহণ করুন",
    reject: "প্রত্যাখ্যান করুন",
    agent_interest_registered: "এজেন্ট আগ্রহ নিবন্ধিত!",
    thank_you_interest: "{country} এজেন্ট হওয়ার আগ্রহের জন্য ধন্যবাদ!",
    team_contact_soon: "আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।",
    manager_contact_info: "আপনি আমাদের ম্যানেজারের সাথে সরাসরি যোগাযোগও করতে পারেন।",
    connect_with_manager: "ম্যানেজারের সাথে সংযোগ করুন",
    rejection_response_title: "কোন সমস্যা নেই!",
    rejection_response_body: "আমরা বুঝতে পারি এই সুযোগ সবার জন্য নয়।",
    manager_anytime_contact: "আপনি যদি মন পরিবর্তন করেন তবে যেকোনো সময় আমাদের ম্যানেজারের সাথে যোগাযোগ করতে পারেন।",

    // PROMO FLOW
    affiliate_options: "অ্যাফিলিয়েট বিকল্প",
    choose_your_option: "আপনার বিকল্প বেছে নিন",
    manager: "ম্যানেজারের সাথে যোগাযোগ করুন",
    banner: "ব্যানার তৈরি করুন",
    promo_banner: "প্রোমো ব্যানার",
    banner_language: "ব্যানারের ভাষা নির্বাচন করুন:",
    enter_promo_code: "আপনার প্রোমো কোড লিখুন:",
    enter_promo_code_message: "আপনার প্রোমো কোড লিখুন যা ব্যানারে যোগ করা হবে (সর্বোচ্চ ১০ অক্ষর):",
    processing_banner: "আপনার ব্যানার তৈরি হচ্ছে...",
    banner_success: "আপনার ব্যানার প্রস্তুত!",
    banner_fail: "ব্যানার তৈরি ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
    choose_your_country: "আপনার দেশ বেছে নিন",
    select_country_for_manager: "ম্যানেজার যোগাযোগের জন্য আপনার দেশ নির্বাচন করুন",
    english: "ইংরেজি",
    bangla: "বাংলা",
    hindi: "হিন্দি",
    pakistani: "পাকিস্তানি",
    select_banner_language: "ব্যানার ভাষা নির্বাচন করুন",
    choose_banner_set: "আপনি কোন ব্যানার সেট চান তা বেছে নিন",
    type_your_promo: "আপনার প্রোমো টাইপ করুন",
    manager_contact_for: "এর জন্য ম্যানেজার যোগাযোগ",
    contact: "যোগাযোগ",
    click_button_to_contact: "ম্যানেজারের সাথে যোগাযোগ করতে নিচের বোতাম ক্লিক করুন।",
    processing_banners: "{language} এ প্রোমো কোড '{promo}' সহ {count}টি ব্যানার প্রক্রিয়া করা হচ্ছে...",
    complete: "সম্পূর্ণ",
    banners_delivered_success: "{language} এ আপনার প্রোমো কোড '{promo}' সহ {count}টি ব্যানার ডেলিভার করা হয়েছে!",
    banners_delivered_with_failures: "{language} এ আপনার প্রোमो কোড '{promo}' সহ {count}টি ব্যানার ডেলিভার করা হয়েছে! ({failed}টি ব্যর্থ)",
    invalid_promo_code: "অবৈধ প্রোমো কোড। সর্বোচ্চ ১০ অক্ষরের অনুমতি।",
    language_not_available: "নির্বাচিত ভাষা উপলব্ধ নেই।",
    no_banners_available: "{language} ভাষার জন্য কোন ব্যানার উপলব্ধ নেই।",
    error_processing_banners: "ব্যানার প্রক্রিয়া করতে ত্রুটি। অনুগ্রহ করে আবার চেষ্টা করুন।",
    
    // Updated Promo Message Keys
    promote_with_code: "কোড **{promo}** দিয়ে এখনই প্রচার শুরু করুন!",
    share_banners_earn: "এই ব্যানারগুলি ব্যবহার করে 7starsWin প্রচার করুন এবং আপনার প্রোমো কোড ব্যবহারের জন্য কমিশন উপার্জন করুন!",
    direct_users_register: "আপনার ব্যবহারকারীদের আপনার প্রোমো কোড: **{promo}** ব্যবহার করে নিবন্ধন করতে নির্দেশ দিন",
    seven_stars_premium: "7StarsWin - প্রিমিয়াম বেটিং প্ল্যাটফর্ম",
    get_affiliate_commission_upto_50: "৫০% পর্যন্ত অ্যাফিলিয়েট কমিশন পান",
    fast_payout_service: "দ্রুত অর্থপ্রদান পরিষেবা",
    become_mobicash_agent_earn_more: "মোবিক্যাশ এজেন্ট হন এবং আরও উপার্জন করুন",
    get_official_app: "সেরা বেটিং অভিজ্ঞতার জন্য আমাদের অফিসিয়াল অ্যাপ পান!",
    refer_with_this_promo_code: "এই প্রোমো-কোড দিয়ে রেফার করুন: **{promo}**",
    final_promo_message: `
🚀 এখনই প্রচার শুরু করুন কোড {promo} দিয়ে!

💰 এই ব্যানারগুলি ব্যবহার করে 7starsWin প্রচার করুন এবং আপনার প্রোমো কোড ব্যবহারের জন্য কমিশন উপার্জন করুন! 

📱 আপনার ব্যবহারকারীদের আপনার প্রোমো কোড: {promo} ব্যবহার করে নিবন্ধন করতে নির্দেশ দিন
👾 7StarsWin - প্রিমিয়াম বেটিং প্ল্যাটফর্ম
⭐ তাৎক্ষণিক জমা ও উত্তোলন
⭐ ২৪/৭ গ্রাহক সহায়তা
⭐ ৫০% পর্যন্ত অ্যাফিলিয়েট কমিশন পান
⭐ দ্রুত অর্থপ্রদান পরিষেবা
⭐ মোবিক্যাশ এজেন্ট হন এবং আরও উপার্জন করুন💰

📱 আমাদের অ্যাপ ডাউনলোড করুন:
👆 সর্বোত্তম বেটিং অভিজ্ঞতার জন্য আমাদের অফিসিয়াল অ্যাপ পান!

🎯 এই প্রোমো-কোড দিয়ে রেফার করুন: {promo}`
,

    // Existing keys that remain
    download_our_app: "আমাদের অ্যাপ ডাউনলোড করুন",
    instant_deposits_withdrawals: "তাৎক্ষণিক জমা ও উত্তোলন",
    customer_support_24_7: "২৪/৭ গ্রাহক সহায়তা",
    secure_licensed_platform: "নিরাপদ ও লাইসেন্সপ্রাপ্ত প্ল্যাটফর্ম",
    download_app: "অ্যাপ ডাউনলোড করুন",

    // SETTINGS / ADMIN FLOW
    settings: "সেটিংস",
    select_language: "আপনার ভাষা নির্বাচন করুন:",
    language_updated: "ভাষা সফলভাবে আপডেট হয়েছে!",
    language_changed: "ভাষা সফলভাবে পরিবর্তন হয়েছে!",
    contact_support: "সাপোর্টের সাথে যোগাযোগ করুন",
    broadcast: "বার্তা সম্প্রচার",
    send_broadcast: "সম্প্রচারের জন্য বার্তা লিখুন:",
    broadcast_success: "বার্তাটি সমস্ত ব্যবহারকারীর কাছে পাঠানো হয়েছে।",
    export_excel: "ডেটা এক্সপোর্ট করুন (Excel)",
    export_ready: "এক্সেল ফাইল প্রস্তুত।",
    user_management: "ব্যবহারকারী ব্যবস্থাপনা",
    block_user: "ব্যবহারকারী ব্লক করুন",
    unblock_user: "ব্যবহারকারী আনব্লক করুন"
  }
};

function loadLanguage(lang) {
  return translations[lang] || translations.en;
}

// Add flag function for compatibility  
function getFlag(lang) {
  const flags = {
    'en': '🇺🇸',
    'hi': '🇮🇳', 
    'bn': '🇧🇩'
  };
  return flags[lang] || '🇺🇸';
}

module.exports = { loadLanguage, getFlag };