(() => {
  const languages = [
    ["en", "English"], ["as", "অসমীয়া"], ["bn", "বাংলা"], ["brx", "बड़ो"],
    ["doi", "डोगरी"], ["gu", "ગુજરાતી"], ["hi", "हिन्दी"], ["kn", "ಕನ್ನಡ"],
    ["ks", "کٲشُر"], ["kok", "कोंकणी"], ["mai", "मैथिली"], ["ml", "മലയാളം"],
    ["mni", "মৈতৈলোন্"], ["mr", "मराठी"], ["ne", "नेपाली"], ["or", "ଓଡ଼ିଆ"],
    ["pa", "ਪੰਜਾਬੀ"], ["sa", "संस्कृतम्"], ["sat", "संताली"], ["sd", "سنڌي"],
    ["ta", "தமிழ்"], ["te", "తెలుగు"], ["ur", "اُردُو"],
  ];

  const translations = {
    en: { dashboard: "Dashboard", register: "Register", vote: "Vote", verify: "Verify Receipt", explorer: "Ledger Explorer", admin: "Admin", language: "Language", textSize: "Text size", contrast: "High contrast", increase: "Increase text size", decrease: "Decrease text size", reset: "Reset text size", skip: "Skip to main content", prototype: "Prototype for educational use — not a certified election system.", footerDescription: "VoteSetu — an open-reference blockchain voting engine. Every ballot is signed on your own device; nothing but a signature ever leaves it.", credentialStorage: "Appears here once generated. Your credential is stored locally in this browser. VoteSetu cannot recover it if this browser's site data is cleared.", registrationIntro: "Your signing key is generated right here in your browser using the Web Crypto API. Only your public key is ever sent to VoteSetu's server. Your private key is sealed in this browser and is never downloaded or uploaded.", fullNamePlaceholder: "e.g. Anjali Gupta", registerStepLabel: "Register", voteStepLabel: "Vote", verifyStepLabel: "Verify", secureVoting: "Blockchain-Based Secure Voting", heroDescription: "Every ballot is signed on the voter's own device and sealed into a hash-linked, proof-of-work ledger. Anyone can independently verify the count — no single party's word has to be trusted.", registerToVote: "Register to vote", viewLedger: "View the ledger", electionOfficial: "Election official?", adminPanel: "Admin panel →", registeredVoters: "Registered voters", votesCast: "Votes cast", blocksMined: "Blocks mined", ledgerIntegrity: "Ledger integrity", openElections: "Open elections", findBallot: "Find your ballot", locationInstruction: "Start with your state, then narrow to city and area. Official schedules and electoral rolls always take priority.", chooseLocation: "Choose location", liveResults: "Live results", howItWorks: "How VoteSetu works", registrationStep: "Step 1 of 2 — Voter Registration", generateCredential: "Generate your voting credential", identityCheck: "Identity check", signInFirst: "Sign in with RIDTP first", identityDescription: "RIDTP verifies the identity account. VoteSetu then binds your local voting credential to that verified identity.", usernameEmailPhone: "Username, email or phone", ridtpPassword: "RIDTP password", signInRidtp: "Sign in with RIDTP", yourDetails: "1. Your details", fullName: "Full name", generateRegister: "Generate key & register", yourCredential: "2. Your credential", votingStep: "Step 2 of 2 — Cast Your Ballot", ballotFinder: "Ballot finder", whereVoting: "Where are you voting?", state: "State", cityDistrict: "City / district", area: "Area", loadCredential: "1. Load your credential", voterId: "Voter ID", chooseCandidate: "2. Choose a candidate", signCast: "Sign & cast my vote", adminPanelTitle: "Admin panel", adminKey: "Admin key", key: "Key", saveKey: "Save key on this device", pollAdministration: "Poll administration", closeRound: "Close polling round & mine block", liveSnapshot: "Live snapshot", createResetElection: "Create / reset election", electionTitle: "Election title", candidatesOneLine: "Candidates (one per line)", powDifficulty: "Proof-of-work difficulty (1-6)", blockExplorer: "Block explorer", refresh: "Refresh", verifyCounted: "Verify your vote was counted", fetchReceipt: "Fetch my receipt", yourReceipt: "Your receipt" },
    as: { dashboard: "ড্যাশবৰ্ড", register: "পঞ্জীয়ন", vote: "ভোট", verify: "ৰচিদ পৰীক্ষা", explorer: "লেজাৰ চাওক", admin: "প্ৰশাসন", language: "ভাষা", textSize: "আখৰৰ আকাৰ", contrast: "উচ্চ কনট্ৰাষ্ট", increase: "আখৰৰ আকাৰ বঢ়াওক", decrease: "আখৰৰ আকাৰ কমাওক", reset: "আখৰৰ আকাৰ পুনৰায় স্থাপন", skip: "মূল বিষয়বস্তুলৈ যাওক", prototype: "শিক্ষামূলক প্ৰটোটাইপ — প্ৰমাণিত নিৰ্বাচনী ব্যৱস্থা নহয়।" },
    bn: { dashboard: "ড্যাশবোর্ড", register: "নিবন্ধন", vote: "ভোট", verify: "রসিদ যাচাই", explorer: "লেজার দেখুন", admin: "প্রশাসন", language: "ভাষা", textSize: "অক্ষরের আকার", contrast: "উচ্চ কনট্রাস্ট", increase: "অক্ষরের আকার বাড়ান", decrease: "অক্ষরের আকার কমান", reset: "অক্ষরের আকার পুনরায় সেট করুন", skip: "মূল বিষয়বস্তুতে যান", prototype: "শিক্ষামূলক প্রোটোটাইপ — এটি প্রত্যয়িত নির্বাচনী ব্যবস্থা নয়।" },
    brx: { dashboard: "ड्यासबर्ड", register: "रजिस्टार", vote: "भोट", verify: "रसीद सुद्राय", explorer: "लेजार नाय", admin: "सासन", language: "राव", textSize: "फरायनायनि महर", contrast: "गोजोन कनट्रास्ट", increase: "फरायनायनि महर जौ", decrease: "फरायनायनि महर खम", reset: "फरायनायनि महर फिन", skip: "गुबुन थाखायाव थां", prototype: "सोलोंनायनि प्रोटोटाइप — प्रमाणित इलेक्शन सिस्टम नङा।" },
    doi: { dashboard: "डैशबोर्ड", register: "पंजीकरण", vote: "वोट", verify: "रसीद सत्यापित करें", explorer: "लेजर देखें", admin: "प्रशासन", language: "भाशा", textSize: "अक्षर आकार", contrast: "उच्च कंट्रास्ट", increase: "अक्षर आकार बढ़ाओ", decrease: "अक्षर आकार घटाओ", reset: "अक्षर आकार रीसेट करो", skip: "मुख्य सामग्री पर जाओ", prototype: "शैक्षिक प्रोटोटाइप — प्रमाणित चुनाव प्रणाली नेईं।" },
    gu: { dashboard: "ડેશબોર્ડ", register: "નોંધણી", vote: "મતદાન", verify: "રસીદ ચકાસો", explorer: "લેજર જુઓ", admin: "વહીવટ", language: "ભાષા", textSize: "લખાણનું કદ", contrast: "ઉચ્ચ કોન્ટ્રાસ્ટ", increase: "લખાણનું કદ વધારો", decrease: "લખાણનું કદ ઘટાડો", reset: "લખાણનું કદ ફરી સેટ કરો", skip: "મુખ્ય સામગ્રી પર જાઓ", prototype: "શૈક્ષણિક પ્રોટોટાઇપ — પ્રમાણિત ચૂંટણી પ્રણાલી નથી." },
    hi: { dashboard: "डैशबोर्ड", register: "पंजीकरण", vote: "मतदान", verify: "रसीद सत्यापित करें", explorer: "लेजर देखें", admin: "प्रशासन", language: "भाषा", textSize: "अक्षर आकार", contrast: "उच्च कंट्रास्ट", increase: "अक्षर आकार बढ़ाएँ", decrease: "अक्षर आकार घटाएँ", reset: "अक्षर आकार रीसेट करें", skip: "मुख्य सामग्री पर जाएँ", prototype: "शैक्षिक प्रोटोटाइप — प्रमाणित चुनाव प्रणाली नहीं।", footerDescription: "VoteSetu — एक खुला-संदर्भ ब्लॉकचेन मतदान इंजन। हर मतपत्र आपके अपने उपकरण पर हस्ताक्षरित होता है; आपके उपकरण से केवल हस्ताक्षर बाहर जाता है।", credentialStorage: "बनने के बाद यह क्रेडेंशियल इसी ब्राउज़र में सुरक्षित रहता है। ब्राउज़र का साइट डेटा मिटने पर VoteSetu इसे पुनर्प्राप्त नहीं कर सकता।", registrationIntro: "आपकी हस्ताक्षर कुंजी इसी ब्राउज़र में Web Crypto API से बनाई जाती है। केवल आपकी सार्वजनिक कुंजी VoteSetu सर्वर को भेजी जाती है। आपकी निजी कुंजी इसी ब्राउज़र में सुरक्षित रहती है और भेजी या डाउनलोड नहीं होती।", fullNamePlaceholder: "उदाहरण: अंजलि गुप्ता", registerStepLabel: "पंजीकरण", voteStepLabel: "मतदान", verifyStepLabel: "सत्यापन", secureVoting: "ब्लॉकचेन आधारित सुरक्षित मतदान", heroDescription: "हर मतपत्र आपके अपने उपकरण पर हस्ताक्षरित होता है और सुरक्षित लेजर में दर्ज होता है। कोई भी व्यक्ति परिणाम की स्वतंत्र रूप से जाँच कर सकता है।", registerToVote: "मतदान के लिए पंजीकरण करें", viewLedger: "लेजर देखें", electionOfficial: "निर्वाचन अधिकारी?", adminPanel: "प्रशासन पैनल →", registeredVoters: "पंजीकृत मतदाता", votesCast: "डाले गए मत", blocksMined: "माइन किए गए ब्लॉक", ledgerIntegrity: "लेजर अखंडता", openElections: "खुले चुनाव", findBallot: "अपना मतपत्र खोजें", locationInstruction: "पहले राज्य चुनें, फिर शहर और क्षेत्र चुनें। आधिकारिक कार्यक्रम और मतदाता सूची सर्वोपरि हैं।", chooseLocation: "स्थान चुनें", liveResults: "लाइव परिणाम", howItWorks: "VoteSetu कैसे काम करता है", registrationStep: "चरण 1/2 — मतदाता पंजीकरण", generateCredential: "अपना मतदान क्रेडेंशियल बनाएँ", identityCheck: "पहचान जाँच", signInFirst: "पहले RIDTP में साइन इन करें", identityDescription: "RIDTP आपकी पहचान सत्यापित करता है। VoteSetu आपके मतदान क्रेडेंशियल को इस सत्यापित पहचान से जोड़ता है।", usernameEmailPhone: "उपयोगकर्ता नाम, ईमेल या फोन", ridtpPassword: "RIDTP पासवर्ड", signInRidtp: "RIDTP से साइन इन करें", yourDetails: "1. आपका विवरण", fullName: "पूरा नाम", generateRegister: "कुंजी बनाएँ और पंजीकरण करें", yourCredential: "2. आपका क्रेडेंशियल", votingStep: "चरण 2/2 — अपना मत डालें", ballotFinder: "मतपत्र खोजक", whereVoting: "आप कहाँ मतदान कर रहे हैं?", state: "राज्य", cityDistrict: "शहर / जिला", area: "क्षेत्र", loadCredential: "1. अपना क्रेडेंशियल लोड करें", voterId: "मतदाता आईडी", chooseCandidate: "2. उम्मीदवार चुनें", signCast: "हस्ताक्षर करें और मत डालें", adminPanelTitle: "प्रशासन पैनल", adminKey: "प्रशासन कुंजी", key: "कुंजी", saveKey: "इस उपकरण पर कुंजी सहेजें", pollAdministration: "मतदान प्रशासन", closeRound: "मतदान चरण बंद करें और ब्लॉक बनाएँ", liveSnapshot: "लाइव स्थिति", createResetElection: "चुनाव बनाएँ / रीसेट करें", electionTitle: "चुनाव का शीर्षक", candidatesOneLine: "उम्मीदवार (प्रति पंक्ति एक)", powDifficulty: "प्रूफ-ऑफ-वर्क कठिनाई (1-6)", blockExplorer: "ब्लॉक एक्सप्लोरर", refresh: "रीफ्रेश", verifyCounted: "सत्यापित करें कि आपका मत गिना गया", fetchReceipt: "मेरी रसीद प्राप्त करें", yourReceipt: "आपकी रसीद" },
    kn: { dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", register: "ನೋಂದಣಿ", vote: "ಮತದಾನ", verify: "ರಸೀದಿ ಪರಿಶೀಲಿಸಿ", explorer: "ಲೆಡ್ಜರ್ ನೋಡಿ", admin: "ಆಡಳಿತ", language: "ಭಾಷೆ", textSize: "ಅಕ್ಷರದ ಗಾತ್ರ", contrast: "ಹೆಚ್ಚಿನ ಕಾಂಟ್ರಾಸ್ಟ್", increase: "ಅಕ್ಷರದ ಗಾತ್ರ ಹೆಚ್ಚಿಸಿ", decrease: "ಅಕ್ಷರದ ಗಾತ್ರ ಕಡಿಮೆ ಮಾಡಿ", reset: "ಅಕ್ಷರದ ಗಾತ್ರ ಮರುಹೊಂದಿಸಿ", skip: "ಮುಖ್ಯ ವಿಷಯಕ್ಕೆ ಹೋಗಿ", prototype: "ಶೈಕ್ಷಣಿಕ ಮಾದರಿ — ಪ್ರಮಾಣೀಕೃತ ಚುನಾವಣಾ ವ್ಯವಸ್ಥೆಯಲ್ಲ." },
    ks: { dashboard: "ڈیش بورڈ", register: "رجسٹریشن", vote: "ووٹ", verify: "رسید تصدیق", explorer: "لیجر وچھو", admin: "انتظامیہ", language: "زبان", textSize: "تحریر ہٕند سائز", contrast: "بلند کنٹراسٹ", increase: "تحریر ہٕند سائز وٲدٕیو", decrease: "تحریر ہٕند سائز کم کٔرو", reset: "تحریر ہٕند سائز ری سیٹ", skip: "مٲخذ موادس پٮ۪ٹھ گژھو", prototype: "تعلیمی پروٹوٹائپ — تصدیق شدہ انتخابی نظام چھُ نَہ۔" },
    kok: { dashboard: "डॅशबोर्ड", register: "नोंदणी", vote: "मतदान", verify: "पावती तपासात", explorer: "लेजर पळयात", admin: "प्रशासन", language: "भास", textSize: "अक्षर आकार", contrast: "उच्च कॉन्ट्रास्ट", increase: "अक्षर आकार व्हाडयात", decrease: "अक्षर आकार उणें करात", reset: "अक्षर आकार परत दवरात", skip: "मुखेल मजकुराक वचात", prototype: "शैक्षणीक नमुनो — प्रमाणीत निवडणूक व्यवस्था ना." },
    mai: { dashboard: "डैशबोर्ड", register: "पंजीकरण", vote: "मतदान", verify: "रसीद जाँचू", explorer: "लेजर देखू", admin: "प्रशासन", language: "भाषा", textSize: "अक्षरक आकार", contrast: "उच्च कंट्रास्ट", increase: "अक्षरक आकार बढ़ाउ", decrease: "अक्षरक आकार घटाउ", reset: "अक्षरक आकार फेर सेट करू", skip: "मुख्य सामग्री पर जाउ", prototype: "शैक्षणिक प्रोटोटाइप — प्रमाणित चुनाव प्रणाली नहि।" },
    ml: { dashboard: "ഡാഷ്ബോർഡ്", register: "രജിസ്റ്റർ", vote: "വോട്ട്", verify: "രസീത് പരിശോധിക്കുക", explorer: "ലെഡ്ജർ കാണുക", admin: "ഭരണം", language: "ഭാഷ", textSize: "അക്ഷര വലുപ്പം", contrast: "ഉയർന്ന കോൺട്രാസ്റ്റ്", increase: "അക്ഷര വലുപ്പം കൂട്ടുക", decrease: "അക്ഷര വലുപ്പം കുറയ്ക്കുക", reset: "അക്ഷര വലുപ്പം പുനഃക്രമീകരിക്കുക", skip: "പ്രധാന ഉള്ളടക്കത്തിലേക്ക് പോകുക", prototype: "വിദ്യാഭ്യാസ പ്രോട്ടോടൈപ്പ് — സാക്ഷ്യപ്പെടുത്തിയ തിരഞ്ഞെടുപ്പ് സംവിധാനമല്ല." },
    mni: { dashboard: "ꯗꯦꯁꯕꯣꯔꯗ", register: "ꯂꯣꯏꯅꯥ", vote: "ꯕꯣꯠ", verify: "ꯔꯁꯤꯠ ꯆꯦꯛ", explorer: "ꯂꯦꯖꯔ ꯌꯦꯡꯉꯨ", admin: "ꯁꯥꯁꯟ", language: "ꯂꯣꯟ", textSize: "ꯃꯌꯥꯏꯒꯤ ꯃꯁꯤꯡ", contrast: "ꯑꯆꯧꯕ ꯀꯟꯇ꯭ꯔꯥꯁꯠ", increase: "ꯃꯌꯥꯏ ꯍꯦꯟꯒꯠꯂꯨ", decrease: "ꯃꯌꯥꯏ ꯍꯦꯟꯊꯔꯨ", reset: "ꯃꯌꯥꯏ ꯐꯪꯖꯔꯨ", skip: "ꯃꯔꯨꯑꯣꯏꯕ ꯄꯥꯔꯤ ꯑꯃꯁꯨ ꯂꯣꯏꯁꯤꯟꯅꯕ", prototype: "ꯁꯤꯛꯂꯣꯟꯒꯤ ꯄ꯭ꯔꯣꯇꯣꯇꯥꯏꯞ — ꯆꯦꯛ ꯆꯥꯎꯕ ꯂꯦꯛꯁꯟ ꯁꯤꯁꯇꯦꯝ ꯅꯠꯇꯦ꯫" },
    mr: { dashboard: "डॅशबोर्ड", register: "नोंदणी", vote: "मतदान", verify: "पावती तपासा", explorer: "लेजर पहा", admin: "प्रशासन", language: "भाषा", textSize: "अक्षरांचा आकार", contrast: "उच्च कॉन्ट्रास्ट", increase: "अक्षरांचा आकार वाढवा", decrease: "अक्षरांचा आकार कमी करा", reset: "अक्षरांचा आकार पुन्हा सेट करा", skip: "मुख्य मजकुराकडे जा", prototype: "शैक्षणिक नमुना — प्रमाणित निवडणूक प्रणाली नाही." },
    ne: { dashboard: "ड्यासबोर्ड", register: "दर्ता", vote: "मतदान", verify: "रसिद जाँच", explorer: "लेजर हेर्नुहोस्", admin: "प्रशासन", language: "भाषा", textSize: "अक्षरको आकार", contrast: "उच्च कन्ट्रास्ट", increase: "अक्षरको आकार बढाउनुहोस्", decrease: "अक्षरको आकार घटाउनुहोस्", reset: "अक्षरको आकार रिसेट", skip: "मुख्य सामग्रीमा जानुहोस्", prototype: "शैक्षिक प्रोटोटाइप — प्रमाणित निर्वाचन प्रणाली होइन।" },
    or: { dashboard: "ଡ୍ୟାସବୋର୍ଡ", register: "ପଞ୍ଜୀକରଣ", vote: "ଭୋଟ", verify: "ରସିଦ ଯାଞ୍ଚ", explorer: "ଲେଜର ଦେଖନ୍ତୁ", admin: "ପ୍ରଶାସନ", language: "ଭାଷା", textSize: "ଅକ୍ଷର ଆକାର", contrast: "ଉଚ୍ଚ କଣ୍ଟ୍ରାଷ୍ଟ", increase: "ଅକ୍ଷର ଆକାର ବଢାନ୍ତୁ", decrease: "ଅକ୍ଷର ଆକାର କମାନ୍ତୁ", reset: "ଅକ୍ଷର ଆକାର ପୁନଃସେଟ", skip: "ମୁଖ୍ୟ ବିଷୟବସ୍ତୁକୁ ଯାଆନ୍ତୁ", prototype: "ଶିକ୍ଷାମୂଳକ ପ୍ରୋଟୋଟାଇପ — ପ୍ରମାଣିତ ନିର୍ବାଚନ ବ୍ୟବସ୍ଥା ନୁହେଁ।" },
    pa: { dashboard: "ਡੈਸ਼ਬੋਰਡ", register: "ਰਜਿਸਟ੍ਰੇਸ਼ਨ", vote: "ਵੋਟ", verify: "ਰਸੀਦ ਦੀ ਜਾਂਚ", explorer: "ਲੇਜਰ ਵੇਖੋ", admin: "ਪ੍ਰਸ਼ਾਸਨ", language: "ਭਾਸ਼ਾ", textSize: "ਅੱਖਰਾਂ ਦਾ ਆਕਾਰ", contrast: "ਉੱਚ ਕੰਟਰਾਸਟ", increase: "ਅੱਖਰਾਂ ਦਾ ਆਕਾਰ ਵਧਾਓ", decrease: "ਅੱਖਰਾਂ ਦਾ ਆਕਾਰ ਘਟਾਓ", reset: "ਅੱਖਰਾਂ ਦਾ ਆਕਾਰ ਰੀਸੈੱਟ", skip: "ਮੁੱਖ ਸਮੱਗਰੀ ਤੇ ਜਾਓ", prototype: "ਵਿਦਿਅਕ ਪ੍ਰੋਟੋਟਾਈਪ — ਪ੍ਰਮਾਣਿਤ ਚੋਣ ਪ੍ਰਣਾਲੀ ਨਹੀਂ।" },
    sa: { dashboard: "फलकम्", register: "पञ्जीकरणम्", vote: "मतदानम्", verify: "रसीद् परीक्ष्यताम्", explorer: "लेजर निरीक्ष्यताम्", admin: "प्रशासनम्", language: "भाषा", textSize: "अक्षरमापः", contrast: "उच्चविरोधः", increase: "अक्षरमापं वर्धयतु", decrease: "अक्षरमापं न्यूनयतु", reset: "अक्षरमापं पुनः स्थापयतु", skip: "मुख्यविषयं गच्छतु", prototype: "शैक्षिकं प्रतिरूपम् — प्रमाणितनिर्वाचनव्यवस्था नास्ति।" },
    sat: { dashboard: "ᱰᱮᱥᱵᱚᱨᱰ", register: "ᱯᱟᱹᱧᱡᱤ", vote: "ᱵᱷᱳᱴ", verify: "ᱨᱚᱥᱤᱫ ᱧᱮᱞ", explorer: "ᱞᱮᱡᱟᱨ ᱧᱮᱞ", admin: "ᱥᱟᱥᱚᱱ", language: "ᱯᱟᱹᱨᱥᱤ", textSize: "ᱚᱞ ᱢᱟᱯ", contrast: "ᱞᱟᱹᱠᱛᱤ ᱠᱚᱱᱴᱨᱟᱥᱴ", increase: "ᱚᱞ ᱢᱟᱯ ᱵᱟᱹᱲᱦᱟᱣ", decrease: "ᱚᱞ ᱢᱟᱯ ᱠᱟᱹᱹᱢᱤ", reset: "ᱚᱞ ᱢᱟᱯ ᱫᱚᱦᱲᱟ", skip: "ᱢᱩᱬ ᱡᱤᱱᱤᱥ ᱛᱮ ᱥᱮᱫᱟᱭ", prototype: "ᱥᱮᱠᱟᱹᱞ ᱯᱨᱚᱴᱳᱴᱟᱭᱯ — ᱯᱨᱟᱢᱟᱱᱤᱛ ᱵᱷᱳᱴ ᱵᱮᱵᱚᱥᱛᱟ ᱵᱟᱝᱟ।" },
    sd: { dashboard: "ڊيش بورڊ", register: "رجسٽريشن", vote: "ووٽ", verify: "رسيد جي تصديق", explorer: "ليجر ڏسو", admin: "انتظاميا", language: "ٻولي", textSize: "لکت جو ماپو", contrast: "وڌيل ڪنٽراسٽ", increase: "لکت جو ماپو وڌايو", decrease: "لکت جو ماپو گهٽايو", reset: "لکت جو ماپو ٻيهر مقرر ڪريو", skip: "مکيه مواد ڏانهن وڃو", prototype: "تعليمي پروٽوٽائپ — تصديق ٿيل چونڊ نظام ناهي." },
    ta: { dashboard: "டாஷ்போர்டு", register: "பதிவு", vote: "வாக்களிப்பு", verify: "ரசீதைச் சரிபார்க்கவும்", explorer: "லெட்ஜரைப் பார்க்கவும்", admin: "நிர்வாகம்", language: "மொழி", textSize: "எழுத்து அளவு", contrast: "உயர் மாறுபாடு", increase: "எழுத்து அளவை அதிகரிக்கவும்", decrease: "எழுத்து அளவைக் குறைக்கவும்", reset: "எழுத்து அளவை மீட்டமைக்கவும்", skip: "முதன்மை உள்ளடக்கத்திற்குச் செல்லவும்", prototype: "கல்வி முன்மாதிரி — சான்றளிக்கப்பட்ட தேர்தல் அமைப்பு அல்ல." },
    te: { dashboard: "డ్యాష్‌బోర్డ్", register: "నమోదు", vote: "ఓటు", verify: "రసీదును ధృవీకరించండి", explorer: "లెడ్జర్ చూడండి", admin: "నిర్వహణ", language: "భాష", textSize: "అక్షర పరిమాణం", contrast: "అధిక కాంట్రాస్ట్", increase: "అక్షర పరిమాణాన్ని పెంచండి", decrease: "అక్షర పరిమాణాన్ని తగ్గించండి", reset: "అక్షర పరిమాణాన్ని రీసెట్ చేయండి", skip: "ప్రధాన విషయానికి వెళ్లండి", prototype: "విద్యా నమూనా — ధృవీకరించబడిన ఎన్నికల వ్యవస్థ కాదు." },
    ur: { dashboard: "ڈیش بورڈ", register: "رجسٹریشن", vote: "ووٹ", verify: "رسید کی تصدیق", explorer: "لیجر دیکھیں", admin: "انتظامیہ", language: "زبان", textSize: "تحریر کا سائز", contrast: "اعلیٰ کنٹراسٹ", increase: "تحریر کا سائز بڑھائیں", decrease: "تحریر کا سائز کم کریں", reset: "تحریر کا سائز ری سیٹ کریں", skip: "مرکزی مواد پر جائیں", prototype: "تعلیمی نمونہ — مصدقہ انتخابی نظام نہیں۔" },
  };

  const pageUi = {
    as: ["ব্লকচেইনভিত্তিক সুৰক্ষিত ভোটদান", "ভোট দিবলৈ পঞ্জীয়ন", "লেজাৰ চাওক", "লাইভ ফলাফল", "মুকলি নিৰ্বাচন", "আপোনাৰ ভোটপত্ৰ বিচাৰক", "পঞ্জীয়ন পৰ্যায়", "ভোটদানৰ ক্ৰেডেনচিয়েল সৃষ্টি কৰক", "প্ৰথমে RIDTP-ত চাইন ইন কৰক", "আপোনাৰ বিৱৰণ", "সম্পূৰ্ণ নাম", "কী সৃষ্টি আৰু পঞ্জীয়ন", "আপোনাৰ ক্ৰেডেনচিয়েল", "ভোটদান পৰ্যায়", "আপুনি ক'ত ভোট দিছে?", "ৰাজ্য", "চহৰ / জিলা", "এলাকা", "ভোটাৰ আইডি", "প্ৰাৰ্থী বাছক", "চাইন আৰু ভোট দিয়ক"],
    bn: ["ব্লকচেইন ভিত্তিক নিরাপদ ভোট", "ভোট দিতে নিবন্ধন করুন", "লেজার দেখুন", "সরাসরি ফলাফল", "খোলা নির্বাচন", "আপনার ব্যালট খুঁজুন", "নিবন্ধন ধাপ", "ভোটিং ক্রেডেনশিয়াল তৈরি করুন", "প্রথমে RIDTP-তে সাইন ইন করুন", "আপনার বিবরণ", "পুরো নাম", "কী তৈরি ও নিবন্ধন", "আপনার ক্রেডেনশিয়াল", "ভোটের ধাপ", "আপনি কোথায় ভোট দিচ্ছেন?", "রাজ্য", "শহর / জেলা", "এলাকা", "ভোটার আইডি", "প্রার্থী বাছুন", "সই করে ভোট দিন"],
    brx: ["ब्लकचेन बेस्ड सुरखित भोट", "भोट होनायनि थाखाय रजिस्टार", "लेजार नाय", "लाइभ रिजल्ट", "खुला इलेक्शन", "नोंथांनि भोट खोज", "रजिस्टार स्टेप", "भोटिङ क्रेडेन्सियल सोरज", "गोदान RIDTP आव साइन इन", "नोंथांनि फोरमायथिहोग्रा", "फुं नाम", "की सोरज आरो रजिस्टार", "नोंथांनि क्रेडेन्सियल", "भोट स्टेप", "नोंथां बेसे भोट होगोन?", "राज्य", "सहर / जिला", "एरिया", "भोटार ID", "क्यान्डिडेट बास", "साइन आरो भोट"],
    doi: ["ब्लॉकचेन आधारित सुरक्षित मतदान", "वोट आस्तै पंजीकरण", "लेजर दिक्खो", "लाइव नतीजे", "खुले चुनाव", "अपनी रसीद खोजो", "पंजीकरण चरण", "मतदान क्रेडेंशियल बनाओ", "पहले RIDTP च साइन इन करो", "अपना ब्यौरा", "पूरा नां", "कुंजी बनाओ ते पंजीकरण करो", "अपना क्रेडेंशियल", "मतदान चरण", "तुस कुत्थै वोट पा करदे ओ?", "राज्य", "शैहर / जिला", "इलाका", "मतदाता आईडी", "उम्मीदवार चुनो", "साइन ते वोट"],
    gu: ["બ્લોકચેઇન આધારિત સુરક્ષિત મતદાન", "મત આપવા નોંધણી કરો", "લેજર જુઓ", "લાઇવ પરિણામો", "ખુલ્લી ચૂંટણીઓ", "તમારું મતપત્ર શોધો", "નોંધણી પગલું", "મતદાન ક્રેડેન્શિયલ બનાવો", "પહેલા RIDTP માં સાઇન ઇન કરો", "તમારી વિગતો", "પૂરું નામ", "કી બનાવો અને નોંધણી કરો", "તમારું ક્રેડેન્શિયલ", "મતદાન પગલું", "તમે ક્યાં મત આપી રહ્યા છો?", "રાજ્ય", "શહેર / જિલ્લો", "વિસ્તાર", "મતદાર ID", "ઉમેદવાર પસંદ કરો", "સાઇન કરીને મત આપો"],
    kn: ["ಬ್ಲಾಕ್‌ಚೈನ್ ಆಧಾರಿತ ಸುರಕ್ಷಿತ ಮತದಾನ", "ಮತ ಹಾಕಲು ನೋಂದಣಿ", "ಲೆಡ್ಜರ್ ನೋಡಿ", "ಲೈವ್ ಫಲಿತಾಂಶಗಳು", "ತೆರೆದ ಚುನಾವಣೆಗಳು", "ನಿಮ್ಮ ಮತಪತ್ರ ಹುಡುಕಿ", "ನೋಂದಣಿ ಹಂತ", "ಮತದಾನದ ಪ್ರಮಾಣಪತ್ರ ರಚಿಸಿ", "ಮೊದಲು RIDTP ಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ", "ನಿಮ್ಮ ವಿವರಗಳು", "ಪೂರ್ಣ ಹೆಸರು", "ಕೀ ರಚಿಸಿ ಮತ್ತು ನೋಂದಣಿ", "ನಿಮ್ಮ ಪ್ರಮಾಣಪತ್ರ", "ಮತದಾನ ಹಂತ", "ನೀವು ಎಲ್ಲಿ ಮತ ಹಾಕುತ್ತಿದ್ದೀರಿ?", "ರಾಜ್ಯ", "ನಗರ / ಜಿಲ್ಲೆ", "ಪ್ರದೇಶ", "ಮತದಾರ ID", "ಅಭ್ಯರ್ಥಿ ಆಯ್ಕೆ", "ಸೈನ್ ಮಾಡಿ ಮತ ಹಾಕಿ"],
    ks: ["بلاک چین بُنیاد محفوظ ووٹ", "ووٹ دِنہٕ خٲطرٕ رجسٹر کٔر", "لیجر وچھو", "لائیو نتیجہ", "کھُل انتخابات", "پنُن بیلٹ ژھٕڈیو", "رجسٹریشن مرحلہ", "ووٹنگ کریڈنشل بناویو", "پہلٕے RIDTP منز سائن اِن کٔر", "پنُن تفصیل", "پورٕ نام", "کٔرِو کُنٕجی تٕہ رجسٹر", "پنُن کریڈنشل", "ووٹنگ مرحلہ", "تُہۍ کِتھ ووت دِوان؟", "ریاست", "شہر / ضلع", "علاقہ", "ووٹَر آی ڈی", "امیدوار ژھٕڈیو", "سائن تٕہ ووٹ"],
    kok: ["ब्लॉकचेन आदारीत सुरक्षित मतदान", "मत दिवपाखीर नोंदणी करात", "लेजर पळयात", "जिवंत निकाल", "उगडी निवडणूक", "तुमचें मतपत्र सोदात", "नोंदणी पायरी", "मतदान क्रेडेन्शियल तयार करात", "पयलीं RIDTP क सायन इन करात", "तुमची म्हायती", "पुराय नांव", "की तयार करून नोंदणी", "तुमचें क्रेडेन्शियल", "मतदान पायरी", "तुमी खंय मतदान करता?", "राज्य", "शार / जिल्लो", "भाग", "मतदार आयडी", "उमेदवार निवडात", "सायन करून मत दियात"],
    mai: ["ब्लॉकचेन आधारित सुरक्षित मतदान", "वोट लेल पंजीकरण करू", "लेजर देखू", "लाइव परिणाम", "खुलल चुनाव", "अपन मतपत्र खोजू", "पंजीकरण चरण", "मतदान क्रेडेंशियल बनाउ", "पहिने RIDTP मे साइन इन करू", "अपन विवरण", "पूरा नाम", "कुंजी बनाउ आ पंजीकरण करू", "अपन क्रेडेंशियल", "मतदान चरण", "अहाँ कतऽ वोट दऽ रहल छी?", "राज्य", "शहर / जिला", "क्षेत्र", "मतदाता आईडी", "उम्मीदवार चुनू", "साइन कऽ वोट दिअ"],
    ml: ["ബ്ലോക്ക്ചെയിൻ അധിഷ്ഠിത സുരക്ഷിത വോട്ടിംഗ്", "വോട്ട് ചെയ്യാൻ രജിസ്റ്റർ ചെയ്യുക", "ലെഡ്ജർ കാണുക", "തത്സമയ ഫലങ്ങൾ", "തുറന്ന തിരഞ്ഞെടുപ്പുകൾ", "നിങ്ങളുടെ ബാലറ്റ് കണ്ടെത്തുക", "രജിസ്ട്രേഷൻ ഘട്ടം", "വോട്ടിംഗ് ക്രെഡൻഷ്യൽ സൃഷ്ടിക്കുക", "ആദ്യം RIDTP-ൽ സൈൻ ഇൻ ചെയ്യുക", "നിങ്ങളുടെ വിശദാംശങ്ങൾ", "പൂർണ്ണ പേര്", "കീ സൃഷ്ടിച്ച് രജിസ്റ്റർ ചെയ്യുക", "നിങ്ങളുടെ ക്രെഡൻഷ്യൽ", "വോട്ടിംഗ് ഘട്ടം", "നിങ്ങൾ എവിടെയാണ് വോട്ട് ചെയ്യുന്നത്?", "സംസ്ഥാനം", "നഗരം / ജില്ല", "പ്രദേശം", "വോട്ടർ ID", "സ്ഥാനാർത്ഥിയെ തിരഞ്ഞെടുക്കുക", "സൈൻ ചെയ്ത് വോട്ട് ചെയ്യുക"],
    mni: ["ꯕ꯭ꯂꯣꯛꯆꯦꯟ ꯑꯃꯁꯨꯡ ꯁꯨꯔꯛꯁꯤꯠ ꯕꯣꯇꯤꯡ", "ꯕꯣꯠ ꯊꯝꯅꯕ ꯂꯣꯏꯅꯥ", "ꯂꯦꯖꯔ ꯌꯦꯡꯉꯨ", "ꯂꯥꯏꯕ ꯔꯤꯖꯜꯇ", "ꯑꯄꯥꯟꯕ ꯑꯦꯂꯦꯛꯁꯟ", "ꯅꯪꯒꯤ ꯕꯦꯂꯦꯠ ꯊꯤꯖꯤꯟꯅꯕ", "ꯂꯣꯏꯅꯥ ꯁ꯭ꯇꯦꯞ", "ꯕꯣꯇꯤꯡ ꯀ꯭ꯔꯦꯗꯦꯟꯁꯤꯑꯜ ꯁꯣꯔꯖꯔꯨ", "ꯃꯃꯥꯡ RIDTP ꯇꯥ ꯁꯥꯏꯟ ꯏꯟ ꯇꯧ", "ꯅꯪꯒꯤ ꯃꯁꯤꯡ", "ꯃꯄꯥꯟ ꯃꯤꯡ", "ꯀꯤ ꯁꯣꯔꯖ ꯑꯃꯁꯨꯡ ꯂꯣꯏꯅꯥ", "ꯅꯪꯒꯤ ꯀ꯭ꯔꯦꯗꯦꯟꯁꯤꯑꯜ", "ꯕꯣꯇꯤꯡ ꯁ꯭ꯇꯦꯞ", "ꯅꯪ ꯀꯔꯝꯕ ꯃꯐꯝꯗꯥ ꯕꯣꯠ ꯊꯝꯂꯤ?", "ꯁ꯭ꯇꯦꯠ", "ꯁꯍꯔ / ꯗꯤꯁ꯭ꯇ꯭ꯔꯤꯛꯠ", "ꯑꯔꯤꯌꯥ", "ꯕꯣꯇꯔ ID", "ꯀꯦꯟꯗꯤꯗꯦꯠ ꯈꯜꯂꯨ", "ꯁꯥꯏꯟ ꯑꯃꯁꯨꯡ ꯕꯣꯠ ꯊꯝꯃꯨ"],
    mr: ["ब्लॉकचेन आधारित सुरक्षित मतदान", "मतदानासाठी नोंदणी करा", "लेजर पहा", "थेट निकाल", "खुल्या निवडणुका", "तुमचे मतपत्र शोधा", "नोंदणी टप्पा", "मतदान क्रेडेन्शियल तयार करा", "प्रथम RIDTP मध्ये साइन इन करा", "तुमचा तपशील", "पूर्ण नाव", "की तयार करा आणि नोंदणी करा", "तुमचे क्रेडेन्शियल", "मतदान टप्पा", "तुम्ही कुठे मतदान करत आहात?", "राज्य", "शहर / जिल्हा", "क्षेत्र", "मतदार ID", "उमेदवार निवडा", "साइन करून मतदान करा"],
    ne: ["ब्लकचेनमा आधारित सुरक्षित मतदान", "मतदान गर्न दर्ता गर्नुहोस्", "लेजर हेर्नुहोस्", "लाइभ परिणाम", "खुला निर्वाचन", "आफ्नो मतपत्र खोज्नुहोस्", "दर्ता चरण", "मतदान क्रेडेन्सियल बनाउनुहोस्", "पहिले RIDTP मा साइन इन गर्नुहोस्", "तपाईंको विवरण", "पूरा नाम", "कुञ्जी बनाउनुहोस् र दर्ता गर्नुहोस्", "तपाईंको क्रेडेन्सियल", "मतदान चरण", "तपाईं कहाँ मतदान गर्दै हुनुहुन्छ?", "राज्य", "सहर / जिल्ला", "क्षेत्र", "मतदाता ID", "उम्मेदवार छान्नुहोस्", "साइन गरेर मतदान गर्नुहोस्"],
    or: ["ବ୍ଲକଚେନ ଆଧାରିତ ସୁରକ୍ଷିତ ଭୋଟିଂ", "ଭୋଟ ପାଇଁ ପଞ୍ଜୀକରଣ କରନ୍ତୁ", "ଲେଜର ଦେଖନ୍ତୁ", "ଲାଇଭ ଫଳାଫଳ", "ଖୋଲା ନିର୍ବାଚନ", "ଆପଣଙ୍କ ବାଲଟ ଖୋଜନ୍ତୁ", "ପଞ୍ଜୀକରଣ ପଦକ୍ଷେପ", "ଭୋଟିଂ କ୍ରେଡେନ୍ସିଆଲ ତିଆରି କରନ୍ତୁ", "ପ୍ରଥମେ RIDTP ରେ ସାଇନ ଇନ କରନ୍ତୁ", "ଆପଣଙ୍କ ବିବରଣୀ", "ପୂର୍ଣ୍ଣ ନାମ", "କୀ ତିଆରି ଓ ପଞ୍ଜୀକରଣ", "ଆପଣଙ୍କ କ୍ରେଡେନ୍ସିଆଲ", "ଭୋଟିଂ ପଦକ୍ଷେପ", "ଆପଣ କେଉଁଠି ଭୋଟ ଦେଉଛନ୍ତି?", "ରାଜ୍ୟ", "ସହର / ଜିଲ୍ଲା", "ଅଞ୍ଚଳ", "ଭୋଟର ID", "ପ୍ରାର୍ଥୀ ବାଛନ୍ତୁ", "ସାଇନ କରି ଭୋଟ ଦିଅନ୍ତୁ"],
    pa: ["ਬਲਾਕਚੇਨ ਆਧਾਰਿਤ ਸੁਰੱਖਿਅਤ ਵੋਟਿੰਗ", "ਵੋਟ ਲਈ ਰਜਿਸਟਰ ਕਰੋ", "ਲੇਜਰ ਵੇਖੋ", "ਲਾਈਵ ਨਤੀਜੇ", "ਖੁੱਲ੍ਹੀਆਂ ਚੋਣਾਂ", "ਆਪਣਾ ਬੈਲਟ ਲੱਭੋ", "ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਪੜਾਅ", "ਵੋਟਿੰਗ ਕ੍ਰੈਡੈਂਸ਼ੀਅਲ ਬਣਾਓ", "ਪਹਿਲਾਂ RIDTP ਵਿੱਚ ਸਾਈਨ ਇਨ ਕਰੋ", "ਤੁਹਾਡੇ ਵੇਰਵੇ", "ਪੂਰਾ ਨਾਮ", "ਕੁੰਜੀ ਬਣਾਓ ਅਤੇ ਰਜਿਸਟਰ ਕਰੋ", "ਤੁਹਾਡਾ ਕ੍ਰੈਡੈਂਸ਼ੀਅਲ", "ਵੋਟਿੰਗ ਪੜਾਅ", "ਤੁਸੀਂ ਕਿੱਥੇ ਵੋਟ ਪਾ ਰਹੇ ਹੋ?", "ਰਾਜ", "ਸ਼ਹਿਰ / ਜ਼ਿਲ੍ਹਾ", "ਖੇਤਰ", "ਵੋਟਰ ID", "ਉਮੀਦਵਾਰ ਚੁਣੋ", "ਸਾਈਨ ਕਰਕੇ ਵੋਟ ਪਾਓ"],
    sa: ["ब्लॉकचेन-आधारितं सुरक्षितं मतदानम्", "मतदानाय पञ्जीकरणं कुर्वन्तु", "लेजरं पश्यन्तु", "प्रत्यक्षं परिणामम्", "मुक्तानि निर्वाचनानि", "स्वमतपत्रं अन्विष्यताम्", "पञ्जीकरणस्य चरणम्", "मतदान-प्रमाणपत्रं निर्मातु", "प्रथमं RIDTP मध्ये प्रवेशं कुर्वन्तु", "भवतः विवरणम्", "पूर्णं नाम", "कुञ्जीं निर्माय पञ्जीकरणं कुर्वन्तु", "भवतः प्रमाणपत्रम्", "मतदानस्य चरणम्", "भवान् कुत्र मतदानं करोति?", "राज्यम्", "नगरम् / जिल्ला", "क्षेत्रम्", "मतदाता ID", "उम्मीदवारं चिनुत", "हस्ताक्षरं कृत्वा मतदानं कुर्वन्तु"],
    sat: ["ᱵᱞᱚᱠᱪᱮᱱ ᱟᱫᱟᱨᱤᱛ ᱡᱟᱹᱯᱛᱤ ᱵᱷᱳᱴᱤᱝ", "ᱵᱷᱳᱴ ᱞᱟᱹᱜᱤᱫ ᱯᱟᱹᱧᱡᱤ", "ᱞᱮᱡᱟᱨ ᱧᱮᱞ", "ᱞᱟᱭᱤᱵ ᱨᱤᱡᱟᱹᱞᱴ", "ᱡᱟᱹᱦᱟᱹᱱ ᱵᱷᱳᱴ", "ᱟᱢᱟᱜ ᱵᱮᱞᱮᱴ ᱧᱮᱞ", "ᱯᱟᱹᱧᱡᱤ ᱥᱴᱮᱯ", "ᱵᱷᱳᱴᱤᱝ ᱠᱨᱮᱰᱮᱱᱥᱤᱞ ᱵᱟᱹᱱᱩᱜ", "ᱢᱟᱹᱲᱟᱝ RIDTP ᱨᱮ ᱥᱟᱭᱤᱱ ᱤᱱ", "ᱟᱢᱟᱜ ᱵᱤᱵᱨᱚᱬ", "ᱯᱩᱨᱟᱹ ᱧᱩᱛᱩᱢ", "ᱠᱤ ᱵᱟᱹᱱᱩᱜ ᱟᱨ ᱯᱟᱹᱧᱡᱤ", "ᱟᱢᱟᱜ ᱠᱨᱮᱰᱮᱱᱥᱤᱞ", "ᱵᱷᱳᱴᱤᱝ ᱥᱴᱮᱯ", "ᱟᱢ ᱚᱠᱟᱨᱮ ᱵᱷᱳᱴ ᱮᱢᱟ?", "ᱨᱟᱡᱽᱭ", "ᱥᱚᱦᱚᱨ / ᱡᱤᱞᱟ", "ᱮᱞᱟᱠᱟ", "ᱵᱷᱳᱴᱟᱨ ID", "ᱠᱮᱱᱰᱤᱰᱮᱴ ᱵᱟᱪᱷᱱᱟᱹᱣ", "ᱥᱟᱭᱤᱱ ᱟᱨ ᱵᱷᱳᱴ"],
    sd: ["بلاڪ چين تي محفوظ ووٽنگ", "ووٽ لاءِ رجسٽر ٿيو", "ليجر ڏسو", "لائيو نتيجا", "کليل چونڊون", "پنهنجو بيلٽ ڳوليو", "رجسٽريشن مرحلو", "ووٽنگ ڪريڊنشل ٺاهيو", "پهريان RIDTP ۾ لاگ ان ٿيو", "توهان جا تفصيل", "پورو نالو", "ڪي ٺاهيو ۽ رجسٽر ٿيو", "توهان جو ڪريڊنشل", "ووٽنگ مرحلو", "توهان ڪٿي ووٽ ڏئي رهيا آهيو؟", "رياست", "شهر / ضلعو", "علائقو", "ووٽر ID", "اميدوار چونڊيو", "سائن ڪري ووٽ ڏيو"],
    ta: ["பிளாக்செயின் அடிப்படையிலான பாதுகாப்பான வாக்களிப்பு", "வாக்களிக்கப் பதிவு செய்யவும்", "லெட்ஜரைப் பார்க்கவும்", "நேரடி முடிவுகள்", "திறந்த தேர்தல்கள்", "உங்கள் வாக்குச்சீட்டைத் தேடுங்கள்", "பதிவு படி", "வாக்களிப்பு சான்றை உருவாக்கவும்", "முதலில் RIDTP-ல் உள்நுழையவும்", "உங்கள் விவரங்கள்", "முழுப் பெயர்", "விசையை உருவாக்கிப் பதிவு செய்யவும்", "உங்கள் சான்று", "வாக்களிப்பு படி", "நீங்கள் எங்கே வாக்களிக்கிறீர்கள்?", "மாநிலம்", "நகரம் / மாவட்டம்", "பகுதி", "வாக்காளர் ID", "வேட்பாளரைத் தேர்ந்தெடுக்கவும்", "கையொப்பமிட்டு வாக்களிக்கவும்"],
    te: ["బ్లాక్‌చెయిన్ ఆధారిత సురక్షిత ఓటింగ్", "ఓటు వేయడానికి నమోదు చేయండి", "లెడ్జర్ చూడండి", "లైవ్ ఫలితాలు", "తెరిచిన ఎన్నికలు", "మీ బ్యాలెట్‌ను కనుగొనండి", "నమోదు దశ", "ఓటింగ్ క్రెడెన్షియల్ సృష్టించండి", "ముందుగా RIDTP లో సైన్ ఇన్ చేయండి", "మీ వివరాలు", "పూర్తి పేరు", "కీ సృష్టించి నమోదు చేయండి", "మీ క్రెడెన్షియల్", "ఓటింగ్ దశ", "మీరు ఎక్కడ ఓటు వేస్తున్నారు?", "రాష్ట్రం", "నగరం / జిల్లా", "ప్రాంతం", "ఓటరు ID", "అభ్యర్థిని ఎంచుకోండి", "సైన్ చేసి ఓటు వేయండి"],
    ur: ["بلاک چین پر مبنی محفوظ ووٹنگ", "ووٹ دینے کے لیے رجسٹر کریں", "لیجر دیکھیں", "براہ راست نتائج", "کھلے انتخابات", "اپنا بیلٹ تلاش کریں", "رجسٹریشن مرحلہ", "ووٹنگ کریڈنشل بنائیں", "پہلے RIDTP میں سائن اِن کریں", "آپ کی تفصیلات", "پورا نام", "کلید بنائیں اور رجسٹر کریں", "آپ کا کریڈنشل", "ووٹنگ مرحلہ", "آپ کہاں ووٹ دے رہے ہیں؟", "ریاست", "شہر / ضلع", "علاقہ", "ووٹر ID", "امیدوار منتخب کریں", "سائن کر کے ووٹ دیں"],
  };

  Object.entries(pageUi).forEach(([language, values]) => {
    const keys = ["secureVoting", "registerToVote", "viewLedger", "liveResults", "openElections", "findBallot", "registrationStep", "generateCredential", "signInFirst", "yourDetails", "fullName", "generateRegister", "yourCredential", "votingStep", "whereVoting", "state", "cityDistrict", "area", "voterId", "chooseCandidate", "signCast"];
    translations[language] = { ...translations[language], ...Object.fromEntries(keys.map((key, index) => [key, values[index]])) };
  });

  const registrationUi = {
    as: ["Web Crypto API-ৰে এই ব্ৰাউজাৰত স্বাক্ষৰ কুঞ্জী সৃষ্টি হয়। ব্যক্তিগত কুঞ্জী ব্ৰাউজাৰৰ বাহিৰলৈ নাযায়।", "এই ক্ৰেডেনচিয়েল এই ব্ৰাউজাৰত সুৰক্ষিত থাকে। ছাইটৰ তথ্য মচিলে ইয়াক উদ্ধাৰ কৰিব নোৱাৰি।", "সত্যাপিত", "পূৰ্ণ নাম লিখক"],
    bn: ["Web Crypto API দিয়ে এই ব্রাউজারেই স্বাক্ষর কী তৈরি হয়। ব্যক্তিগত কী ব্রাউজারের বাইরে যায় না।", "এই ক্রেডেনশিয়াল ব্রাউজারেই নিরাপদ থাকে। সাইটের তথ্য মুছে গেলে এটি পুনরুদ্ধার করা যাবে না।", "যাচাই করা হয়েছে", "পূর্ণ নাম লিখুন"],
    brx: ["Web Crypto API जों बे ब्राउजारआव साइन की सोरज जाय। प्राइभेट की ब्राउजारनि बाहेर नङा।", "बे क्रेडेन्सियल ब्राउजारआव रैखाथि जाय। साइट डाटा बोखोहरनायाव फिन मोननो हाया।", "सुद्रायगोनां", "फुं नाम"],
    doi: ["Web Crypto API कन्नै इस ब्राउज़र च हस्ताक्षर कुंजी बनदी ऐ। निजी कुंजी ब्राउज़र थमां बाहर नेईं जंदी।", "एह क्रेडेंशियल इस ब्राउज़र च सुरक्षित ऐ। साइट दा डेटा मिट्टने पर एह वापस नेईं औंदी।", "सत्यापित", "पूरा नां लिखो"],
    gu: ["Web Crypto API વડે આ બ્રાઉઝરમાં હસ્તાક્ષર કી બને છે. ખાનગી કી બ્રાઉઝરની બહાર જતી નથી.", "આ ક્રેડેન્શિયલ આ બ્રાઉઝરમાં સુરક્ષિત રહે છે. સાઇટ ડેટા ભૂંસવાથી તેને પાછું મેળવી શકાતું નથી.", "ચકાસાયેલ", "પૂરું નામ લખો"],
    kn: ["Web Crypto API ಬಳಸಿ ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಸಹಿ ಕೀ ರಚಿಸಲಾಗುತ್ತದೆ. ಖಾಸಗಿ ಕೀ ಬ್ರೌಸರ್‌ನಿಂದ ಹೊರಗೆ ಹೋಗುವುದಿಲ್ಲ.", "ಈ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಇರಿಸಲಾಗುತ್ತದೆ. ಸೈಟ್ ಡೇಟಾ ಅಳಿಸಿದರೆ ಮರುಪಡೆಯಲು ಸಾಧ್ಯವಿಲ್ಲ.", "ಪರಿಶೀಲಿಸಲಾಗಿದೆ", "ಪೂರ್ಣ ಹೆಸರನ್ನು ಬರೆಯಿರಿ"],
    ks: ["Web Crypto API سان یِم براؤزرَس منز دستخط کُنٕجی بنان چھُ۔ نجی کُنٕجی براؤزرَس باہر نہٕ گژھان۔", "یہِ کریڈنشل یِم براؤزرَس منز محفوظ چھُ۔ سائٹ ڈیٹا مٹاونہٕ پتہٕ واپس نہٕ ملسہٕ۔", "تصدیق شدہ", "پورٕ نام لیٖکھِو"],
    kok: ["Web Crypto API वापरून ह्या ब्रावजरांत सही कळ तयार जाता. खाजगी कळ ब्रावजर भायर वचना ना.", "हें क्रेडेन्शियल ह्या ब्रावजरांत जतन जाता. सायट डेटा पुसल्यार परत मेळना.", "तपासलें", "पुराय नांव दियात"],
    mai: ["Web Crypto API सँ एहि ब्राउजर मे हस्ताक्षर कुंजी बनैत अछि। निजी कुंजी ब्राउजर सँ बाहर नहि जाइत अछि।", "ई क्रेडेंशियल एहि ब्राउजर मे सुरक्षित रहैत अछि। साइटक डाटा मेटला पर एकरा वापस नहि आनि सकब।", "सत्यापित", "पूरा नाम लिखू"],
    ml: ["Web Crypto API ഉപയോഗിച്ച് ഈ ബ്രൗസറിൽ ഒപ്പ് കീ സൃഷ്ടിക്കുന്നു. സ്വകാര്യ കീ ബ്രൗസറിന് പുറത്തേക്ക് പോകില്ല.", "ഈ ക്രെഡൻഷ്യൽ ഈ ബ്രൗസറിൽ സുരക്ഷിതമായി സൂക്ഷിക്കുന്നു. സൈറ്റ് ഡാറ്റ മായ്ച്ചാൽ വീണ്ടെടുക്കാനാകില്ല.", "പരിശോധിച്ചു", "പൂർണ്ണ പേര് എഴുതുക"],
    mni: ["Web Crypto API-গী মতমদা মসি ব্রাউজরদা সাইন কি শেম্মি। প্রাইভেট কি ব্রাউজরগী মপান থোক্কদে।", "মসি ক্রেডেনসিয়েল মসি ব্রাউজরদা সেফ থম্মি। সাইট ডাটা মুথৎপা মতুংদা ফংজদে।", "শেমদোকপা", "মিং শেমগী মমিং"],
    mr: ["Web Crypto API वापरून या ब्राउझरमध्ये स्वाक्षरी किल्ली तयार होते. खाजगी किल्ली ब्राउझरच्या बाहेर जात नाही.", "हे क्रेडेन्शियल या ब्राउझरमध्ये सुरक्षित राहते. साइट डेटा पुसल्यास ते परत मिळत नाही.", "सत्यापित", "पूर्ण नाव लिहा"],
    ne: ["Web Crypto API प्रयोग गरेर यस ब्राउजरमा हस्ताक्षर कुञ्जी बनाइन्छ। निजी कुञ्जी ब्राउजर बाहिर जाँदैन।", "यो क्रेडेन्शियल यस ब्राउजरमा सुरक्षित रहन्छ। साइट डेटा मेटिएपछि फिर्ता ल्याउन सकिँदैन।", "प्रमाणित", "पूरा नाम लेख्नुहोस्"],
    or: ["Web Crypto API ଦ୍ୱାରା ଏହି ବ୍ରାଉଜରରେ ସ୍ୱାକ୍ଷର କୀ ତିଆରି ହୁଏ। ବ୍ୟକ୍ତିଗତ କୀ ବ୍ରାଉଜର ବାହାରକୁ ଯାଏ ନାହିଁ।", "ଏହି କ୍ରେଡେନ୍ସିଆଲ ଏହି ବ୍ରାଉଜରରେ ସୁରକ୍ଷିତ ରହେ। ସାଇଟ ଡାଟା ହଟାଇଲେ ଏହା ଫେରି ପାଇବେ ନାହିଁ।", "ଯାଞ୍ଚ ହୋଇଛି", "ପୂର୍ଣ୍ଣ ନାମ ଲେଖନ୍ତୁ"],
    pa: ["Web Crypto API ਨਾਲ ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਦਸਤਖਤ ਕੁੰਜੀ ਬਣਦੀ ਹੈ। ਨਿੱਜੀ ਕੁੰਜੀ ਬ੍ਰਾਊਜ਼ਰ ਤੋਂ ਬਾਹਰ ਨਹੀਂ ਜਾਂਦੀ।", "ਇਹ ਕ੍ਰੈਡੈਂਸ਼ੀਅਲ ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਰਹਿੰਦਾ ਹੈ। ਸਾਈਟ ਡਾਟਾ ਮਿਟਾਉਣ ਤੋਂ ਬਾਅਦ ਇਹ ਵਾਪਸ ਨਹੀਂ ਮਿਲੇਗਾ।", "ਪੜਤਾਲ ਕੀਤੀ", "ਪੂਰਾ ਨਾਮ ਲਿਖੋ"],
    sa: ["Web Crypto API द्वारा अस्मिन् ब्राउजरे हस्ताक्षरकुञ्जी निर्मीयते। निजकुञ्जी ब्राउजरतः बहिः न गच्छति।", "एतत् प्रमाणपत्रम् अस्मिन् ब्राउजरे सुरक्षितं तिष्ठति। साइट्-दत्तांशे नष्टे पुनः न लभ्यते।", "प्रमाणितम्", "पूर्णं नाम लिखतु"],
    sat: ["Web Crypto API ᱛᱮ ᱱᱚᱣᱟ ᱵᱨᱟᱣᱡᱟᱨ ᱨᱮ ᱥᱟᱭᱤᱱ ᱠᱤ ᱵᱟᱹᱱᱩᱜ ᱟ। ᱯᱨᱟᱭᱵᱷᱮᱴ ᱠᱤ ᱵᱟᱝ ᱚᱰᱚᱠ ᱛᱟᱦᱮᱱᱟ।", "ᱱᱚᱣᱟ ᱠᱨᱮᱰᱮᱱᱥᱤᱞ ᱱᱚᱣᱟ ᱵᱨᱟᱣᱡᱟᱨ ᱨᱮ ᱡᱟᱹᱯᱛᱤ ᱛᱟᱦᱮᱱᱟ। ᱥᱟᱭᱤᱴ ᱰᱟᱴᱟ ᱢᱮᱴ ᱞᱮᱱ ᱠᱷᱟᱱ ᱵᱟᱝ ᱧᱟᱢᱚᱜᱼᱟ।", "ᱧᱮᱞ ᱪᱟᱵᱟᱣᱟ", "ᱯᱩᱨᱟᱹ ᱧᱩᱛᱩᱢ ᱚᱞ"],
    sd: ["Web Crypto API سان هن برائوزر ۾ صحيح جي ڪنجي ٺهي ٿي. نجي ڪنجي برائوزر کان ٻاهر نٿي وڃي.", "هي ڪريڊنشل هن برائوزر ۾ محفوظ رهي ٿو. سائيٽ ڊيٽا مٽائڻ کان پوءِ واپس نٿو ملي.", "تصديق ٿيل", "پورو نالو لکو"],
    ta: ["Web Crypto API மூலம் இந்த உலாவியில் கையொப்ப விசை உருவாக்கப்படுகிறது. தனிப்பட்ட விசை உலாவியை விட்டு வெளியே செல்லாது.", "இந்த சான்று இந்த உலாவியில் பாதுகாப்பாக இருக்கும். தளத் தரவு அழிக்கப்பட்டால் மீட்டெடுக்க முடியாது.", "சரிபார்க்கப்பட்டது", "முழுப் பெயரை உள்ளிடவும்"],
    te: ["Web Crypto API ద్వారా ఈ బ్రౌజర్‌లో సంతకం కీ సృష్టించబడుతుంది. ప్రైవేట్ కీ బ్రౌజర్‌ను వదిలి వెళ్లదు.", "ఈ క్రెడెన్షియల్ ఈ బ్రౌజర్‌లో సురక్షితంగా ఉంటుంది. సైట్ డేటా తొలగిస్తే తిరిగి పొందలేరు.", "ధృవీకరించబడింది", "పూర్తి పేరు రాయండి"],
    ur: ["Web Crypto API کے ذریعے اسی براؤزر میں دستخط کی کلید بنتی ہے۔ نجی کلید براؤزر سے باہر نہیں جاتی۔", "یہ کریڈنشل اسی براؤزر میں محفوظ رہتا ہے۔ سائٹ کا ڈیٹا مٹانے کے بعد اسے واپس نہیں لایا جا سکتا۔", "تصدیق شدہ", "پورا نام لکھیں"],
  };

  Object.entries(registrationUi).forEach(([language, values]) => {
    const keys = ["registrationIntro", "credentialStorage", "verified", "fullNamePlaceholder"];
    translations[language] = { ...translations[language], ...Object.fromEntries(keys.map((key, index) => [key, values[index]])) };
  });

  const translationFallbacks = {
    adminPanelTitle: "Admin panel",
    adminKey: "Admin key",
    key: "Key",
    saveKey: "Save key on this device",
    pollAdministration: "Poll administration",
    closeRound: "Close polling round & mine block",
    liveSnapshot: "Live snapshot",
    createResetElection: "Create / reset election",
    electionTitle: "Election title",
    candidatesOneLine: "Candidates (one per line)",
    powDifficulty: "Proof-of-work difficulty (1-6)",
    blockExplorer: "Block explorer",
    refresh: "Refresh",
    verifyCounted: "Verify your vote was counted",
    yourReceipt: "Your receipt",
    fetchReceipt: "Fetch my receipt",
    identityCheck: "Identity check",
    signInFirst: "Sign in with RIDTP first",
    identityDescription: "RIDTP verifies the identity account. VoteSetu then binds your local voting credential to that verified identity.",
    usernameEmailPhone: "Username, email or phone",
    ridtpPassword: "RIDTP password",
    signInRidtp: "Sign in with RIDTP",
    generateRegister: "Generate key & register",
    votingStep: "Step 2 of 2 — Cast Your Ballot",
    ballotFinder: "Ballot finder",
    loadCredential: "1. Load your credential",
    chooseCandidate: "2. Choose a candidate",
    signCast: "Sign & cast my vote",
    yourDetails: "1. Your details",
    yourCredential: "2. Your credential",
    verifyStepLabel: "Verify",
    voteStepLabel: "Vote",
    registerStepLabel: "Register",
  };

  Object.keys(translations).forEach((language) => {
    const dictionary = translations[language];
    Object.entries(translationFallbacks).forEach(([key, value]) => {
      dictionary[key] ??= translations.en[key] ?? value;
    });
    dictionary.registerStepLabel = dictionary.register || dictionary.registerStepLabel || "Register";
    dictionary.voteStepLabel = dictionary.vote || dictionary.voteStepLabel || "Vote";
    dictionary.verifyStepLabel = dictionary.verify || dictionary.verifyStepLabel || "Verify";
  });

  const languageSelect = document.getElementById("language-select");
  const root = document.documentElement;
  const body = document.body;
  const storedLanguage = localStorage.getItem("votesetu_language") || "en";
  const storedSize = localStorage.getItem("votesetu_text_size") || "normal";

  languages.forEach(([code, label]) => languageSelect.add(new Option(label, code)));
  languageSelect.value = storedLanguage;

  function applyTranslations(language) {
    const dictionary = translations[language] || translations.en;
    root.lang = language;
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      if (dictionary[key]) element.textContent = dictionary[key];
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      const key = element.dataset.i18nAria;
      if (dictionary[key]) element.setAttribute("aria-label", dictionary[key]);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.dataset.i18nPlaceholder;
      if (dictionary[key]) element.setAttribute("placeholder", dictionary[key]);
    });
    const authBadge = document.getElementById("auth-badge");
    if (authBadge?.dataset.displayName) {
      const labels = { en: "Verified", as: "সত্যাপিত", bn: "যাচাই করা হয়েছে", brx: "सुद्रायगोनां", doi: "सत्यापित", gu: "ચકાસાયેલ", hi: "सत्यापित", kn: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ", ks: "تصدیق شدہ", kok: "तपासलें", mai: "सत्यापित", ml: "പരിശോധിച്ചു", mni: "শেমদোকপা", mr: "सत्यापित", ne: "प्रमाणित", or: "ଯାଞ୍ଚ ହୋଇଛି", pa: "ਪੜਤਾਲ ਕੀਤੀ", sa: "प्रमाणितम्", sat: "ᱧᱮᱞ ᱪᱟᱵᱟᱣᱟ", sd: "تصديق ٿيل", ta: "சரிபார்க்கப்பட்டது", te: "ధృవీకరించబడింది", ur: "تصدیق شدہ" };
      authBadge.textContent = `${labels[language] || "Verified"}: ${authBadge.dataset.displayName}`;
    }
    const languageNote = document.getElementById("language-note");
    languageNote.textContent = "";
    localStorage.setItem("votesetu_language", language);
  }

  function applyTextSize(size) {
    body.classList.remove("text-size-large", "text-size-xl");
    if (size !== "normal") body.classList.add(`text-size-${size === "large" ? "large" : "xl"}`);
    localStorage.setItem("votesetu_text_size", size);
  }

  languageSelect.addEventListener("change", () => applyTranslations(languageSelect.value));
  document.getElementById("font-decrease").addEventListener("click", () => applyTextSize("normal"));
  document.getElementById("font-normal").addEventListener("click", () => applyTextSize("normal"));
  document.getElementById("font-increase").addEventListener("click", () => applyTextSize("large"));
  document.getElementById("font-xl").addEventListener("click", () => applyTextSize("xl"));
  document.getElementById("contrast-toggle").addEventListener("click", () => {
    const enabled = body.classList.toggle("high-contrast");
    localStorage.setItem("votesetu_high_contrast", enabled ? "on" : "off");
  });

  applyTranslations(storedLanguage);
  applyTextSize(storedSize);
  if (localStorage.getItem("votesetu_high_contrast") === "on") body.classList.add("high-contrast");
})();
