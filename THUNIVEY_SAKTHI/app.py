from flask import Flask, request, jsonify, render_template
import re
import random
import datetime

app = Flask(__name__)

# ─── Phishing URL Detection ──────────────────────────────────────────────────
SUSPICIOUS_KEYWORDS = [
    "login", "signin", "verify", "update", "secure", "account", "banking",
    "paypal", "ebay", "amazon", "apple", "microsoft", "netflix",
    "password", "credential", "confirm", "wallet", "free", "winner", "prize"
]

TRUSTED_DOMAINS = [
    "google.com", "microsoft.com", "apple.com", "amazon.com", "facebook.com",
    "twitter.com", "linkedin.com", "github.com", "stackoverflow.com", "wikipedia.org"
]

VALID_TLDS = [
    ".com", ".org", ".net", ".edu", ".gov", ".io", ".co", ".in", ".uk",
    ".us", ".de", ".fr", ".au", ".ca", ".jp", ".cn", ".info", ".biz",
    ".app", ".dev", ".ai", ".tech", ".online", ".store", ".  club", ".xyz",
    ".site", ".web", ".me", ".tv", ".cc", ".ac", ".id", ".sg", ".nz"
]
import re

# ── Scam detection patterns ───────────────────────────────────────
SCAM_PATTERNS = [
    (r"you\s+won",                                     50),
    (r"cash\s+priz?e",                                45),
    (r"claim\s+at\s+(this\s+)?link",                  35),
    (r"\d[\d,]{4,}",                                  15),  # large numbers
    (r"(congratulations|congrats).{0,30}won",         50),
    (r"selected\s+(as\s+)?(a\s+)?winner",             45),
    (r"verify.{0,20}account",                         25),
    (r"your account.{0,20}(suspended|limited)",       25),
    (r"urgent.{0,10}action",                          20),
    (r"https?://\S+",                                 20),  # any URL
    (r"click\s+(this\s+)?(link|here)",                15),
    (r"send\s+(money|payment|fee)",                   35),
    (r"wire\s+transfer",                              30),
    (r"gift\s+card",                                  30),
    (r"\b(prise|thish|recieve)\b",                    20),  # typos
    (r"nigerian|prince|inheritance",                  40),
    (r"100\s*%\s*(free|guarantee)",                   15),
]

COMBO_BONUS = [
    # Prize + URL together = strong scam signal
    ([r"(you\s+won|cash\s+priz?e|winner)", r"https?://\S+"], 30),
    # Typo + URL = low-quality scam
    ([r"\b(prise|thish)\b", r"https?://"], 25),
]

def analyze_text(text):
    tl = text.lower()
    score = 0
    flags = []

    for pattern, weight in SCAM_PATTERNS:
        if re.search(pattern, tl, re.IGNORECASE):
            score += weight
            flags.append(f"Matched: {pattern}")

    for patterns, bonus in COMBO_BONUS:
        if all(re.search(p, tl, re.IGNORECASE) for p in patterns):
            score += bonus
            flags.append(f"Combo bonus: +{bonus}")

    score = min(score, 100)

    if score >= 60:
        verdict, color = "SCAM", "red"
    elif score >= 35:
        verdict, color = "SUSPICIOUS", "orange"
    else:
        verdict, color = "LIKELY SAFE", "green"

    return {"verdict": verdict, "risk_score": score,
            "color": color, "flags": flags}
# ── End scam patterns ─────────────────────────────────────────────

def is_valid_domain(domain):
    """Check if domain looks like a real domain (has a valid TLD and proper structure)."""
    # Must contain at least one dot
    if '.' not in domain:
        return False
    # Must have a valid TLD
    has_valid_tld = any(domain.endswith(tld) for tld in VALID_TLDS)
    if not has_valid_tld:
        return False
    # Domain parts must be reasonable length
    parts = domain.split('.')
    for part in parts:
        if len(part) == 0 or len(part) > 63:
            return False
    # Domain must not be pure numbers/gibberish (no vowels at all in main label)
    main_label = parts[0]
    if len(main_label) >= 4 and not any(v in main_label for v in 'aeiou'):
        return False
    return True

def analyze_url(url):
    original_input = url.strip()
    url = url.lower().strip()
    score = 0
    flags = []

    # ── Step 1: Reject completely empty input ──────────────────────────
    if not url:
        return {"score": 0, "status": "INVALID", "flags": ["No URL provided"], "url": original_input}

    # ── Step 2: Strip protocol if present ─────────────────────────────
    has_https = url.startswith("https://")
    has_http  = url.startswith("http://")

    if not has_https and not has_http:
        url = "http://" + url

    # ── Step 3: HTTPS check ────────────────────────────────────────────
    if url.startswith("http://"):
        score += 25
        flags.append("No HTTPS – connection not encrypted")

    # ── Step 4: Extract domain ─────────────────────────────────────────
    domain_match = re.search(r'https?://([^/?#]+)', url)
    domain = domain_match.group(1) if domain_match else ""

    # ── Step 5: Validate domain structure ─────────────────────────────
    if not domain:
        return {
            "score": 85, "status": "DANGER",
            "flags": ["Invalid URL – no domain found", "Cannot verify this address"],
            "url": original_input
        }

    # No dot at all = not a real URL (e.g. "hjdd", "abc123")
    if '.' not in domain:
        return {
            "score": 80, "status": "DANGER",
            "flags": [
                f"'{original_input}' is not a valid URL",
                "Real URLs must contain a domain like example.com",
                "No top-level domain (.com, .in, .org etc.) found",
                "This input cannot be a legitimate website address"
            ],
            "url": original_input
        }

    # Has a dot but no recognized TLD = suspicious/invalid
    if not is_valid_domain(domain):
        score += 50
        flags.append(f"Unrecognized or invalid domain extension in '{domain}'")
        flags.append("No known top-level domain (.com, .in, .org, etc.) found")

    # ── Step 6: IP address used as domain ─────────────────────────────
    if re.search(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', domain):
        score += 35
        flags.append("IP address used instead of domain name – highly suspicious")

    # ── Step 7: Too many subdomains ────────────────────────────────────
    if domain.count('.') > 3:
        score += 20
        flags.append(f"Too many subdomains detected ({domain.count('.')} dots)")

    # ── Step 8: Domain impersonation ──────────────────────────────────
    for trusted in TRUSTED_DOMAINS:
        if trusted in domain and not domain.endswith(trusted):
            score += 40
            flags.append(f"Impersonating trusted domain: {trusted}")
            break

    # ── Step 9: Suspicious keywords in URL ────────────────────────────
    found_keywords = [kw for kw in SUSPICIOUS_KEYWORDS if kw in url]
    for kw in found_keywords[:3]:  # report up to 3
        score += 10
        flags.append(f"Suspicious keyword in URL: '{kw}'")

    # ── Step 10: URL length ────────────────────────────────────────────
    if len(url) > 100:
        score += 15
        flags.append(f"Unusually long URL ({len(url)} characters)")

    # ── Step 11: Special characters ───────────────────────────────────
    if re.search(r'[@%]', url):
        score += 20
        flags.append("Special characters (@, %) detected – common phishing trick")

    # ── Step 12: Mixed numbers in domain ──────────────────────────────
    if re.search(r'\d{4,}', domain.split('.')[0]):
        score += 15
        flags.append("Domain contains unusual number sequence")

    # ── Step 13: Dash-heavy domain ────────────────────────────────────
    if domain.count('-') >= 3:
        score += 15
        flags.append("Too many hyphens in domain – often used in fake sites")

    # ── Clamp and classify ─────────────────────────────────────────────
    score = min(score, 100)

    if score >= 60:
        status = "DANGER"
    elif score >= 30:
        status = "SUSPICIOUS"
    else:
        status = "SAFE"

    # If no flags were raised, it's clean
    if not flags:
        flags = ["No suspicious patterns detected"]

    return {"score": score, "status": status, "flags": flags, "url": original_input}


# ─── Email / Text Scam Detection ─────────────────────────────────────────────
SCAM_PHRASES = [
    ("you have won", 40), ("click here to claim", 35), ("limited time offer", 25),
    ("verify your account", 30), ("your account has been suspended", 35),
    ("urgent action required", 30), ("send money", 40), ("wire transfer", 35),
    ("nigerian prince", 50), ("lottery winner", 45), ("free gift", 20),
    ("act now", 20), ("risk free", 15), ("100% free", 15), ("dear friend", 20),
    ("earn money fast", 35), ("work from home", 20), ("congratulations you", 30),
    ("otp", 25), ("bank details", 35), ("credit card number", 40)
]

def analyze_text(text):
    text_lower = text.lower()
    score = 0
    found_phrases = []

    for phrase, weight in SCAM_PHRASES:
        if phrase in text_lower:
            score += weight
            found_phrases.append(phrase)

    if re.search(r'\b\d{10,16}\b', text):
        score += 30
        found_phrases.append("Phone/card number pattern detected")

    if text.count('!') > 3:
        score += 10
        found_phrases.append("Excessive exclamation marks")

    if re.search(r'[A-Z]{5,}', text):
        score += 10
        found_phrases.append("Excessive capitalization")

    score = min(score, 100)

    if score >= 60:
        status = "SCAM"
    elif score >= 30:
        status = "SUSPICIOUS"
    else:
        status = "LIKELY_SAFE"

    return {"score": score, "status": status, "triggers": found_phrases}


# ─── Scam Alert Map Data ──────────────────────────────────────────────────────
SCAM_ALERTS = [
    {"city": "Chennai", "lat": 13.0827, "lng": 80.2707, "type": "Phishing Email", "count": 142, "severity": "high"},
    {"city": "Mumbai", "lat": 19.0760, "lng": 72.8777, "type": "UPI Fraud", "count": 89, "severity": "high"},
    {"city": "Delhi", "lat": 28.6139, "lng": 77.2090, "type": "OTP Scam", "count": 201, "severity": "critical"},
    {"city": "Bangalore", "lat": 12.9716, "lng": 77.5946, "type": "Job Fraud", "count": 67, "severity": "medium"},
    {"city": "Hyderabad", "lat": 17.3850, "lng": 78.4867, "type": "Phishing SMS", "count": 54, "severity": "medium"},
    {"city": "Coimbatore", "lat": 11.0168, "lng": 76.9558, "type": "Loan Scam", "count": 38, "severity": "medium"},
    {"city": "Kolkata", "lat": 22.5726, "lng": 88.3639, "type": "Investment Fraud", "count": 73, "severity": "high"},
    {"city": "Pune", "lat": 18.5204, "lng": 73.8567, "type": "Phishing URL", "count": 45, "severity": "medium"},
    {"city": "Jaipur", "lat": 26.9124, "lng": 75.7873, "type": "KYC Fraud", "count": 29, "severity": "low"},
    {"city": "Lucknow", "lat": 26.8467, "lng": 80.9462, "type": "Lottery Scam", "count": 61, "severity": "high"},
]


# ─── AI Chatbot Responses ─────────────────────────────────────────────────────
CHATBOT_RESPONSES = {
    "phishing": "🛡️ Phishing is when cybercriminals create fake websites/emails mimicking trusted sources to steal your credentials. Always check the URL carefully, look for HTTPS, and never click suspicious links. When in doubt, type the website URL directly into your browser!",
    "password": "🔐 Strong passwords are your first defense! Use at least 12 characters with a mix of uppercase, lowercase, numbers, and symbols. Never reuse passwords. Consider a password manager like Bitwarden or LastPass. Enable 2FA wherever possible!",
    "otp": "⚠️ NEVER share your OTP with anyone! Legitimate banks and companies will NEVER ask for your OTP over call or SMS. If someone asks for your OTP, it's a scam. Hang up immediately and report to cybercrime helpline 1930.",
    "upi": "💰 UPI Safety Tips: Never scan QR codes from strangers. 'Receive money' never requires your PIN. Verify the receiver's name before sending. Report UPI fraud immediately to your bank and on cybercrime.gov.in",
    "social media": "📱 Protect your social media: Use strong unique passwords, enable 2FA, be careful what you share publicly, don't accept friend requests from strangers, and regularly review your privacy settings.",
    "emergency": "🚨 EMERGENCY CYBER HELP: Call National Cybercrime Helpline: 1930 | Report online: cybercrime.gov.in | Women's helpline: 181 | Police: 100. Don't panic – document everything and report immediately!",
    "safe": "✅ General cyber safety tips: Keep software updated, use antivirus, avoid public WiFi for banking, backup your data regularly, and trust your instincts – if something feels wrong, it probably is!",
    "hello": "Vanakkam! 🌸 I'm Cyber Sakthi, your AI cybersecurity assistant! I'm here to help you stay safe online. Ask me about phishing, passwords, OTP scams, UPI fraud, or any cybersecurity topic!",
    "help": "I can help you with: 🔍 Phishing detection | 🔐 Password safety | 💰 UPI/Banking fraud | 📱 Social media safety | 🚨 Emergency cyber help | Ask me anything about staying safe online!",
    "default": "I'm Cyber Sakthi! 🛡️ I specialize in cybersecurity awareness for women's digital safety. Could you be more specific? You can ask me about phishing, passwords, OTP scams, UPI fraud, social media safety, or emergency help!",
    "stalking" : "🛡️ If you feel stalked online, capture screenshots, block the person, and report to the platform and 1930 immediately.",
    "fake_apps": "🚫 Only download apps from official stores like Play Store or App Store. Check reviews before installing.",
    "deepfake": "🎥 AI Deepfakes: If you see a suspicious video or photo of yourself, don't panic. Report it immediately on cybercrime.gov.in and inform your family.",
    "privacy_settings": "🔐 Privacy Check: Set your social media profiles to 'Private'. Never share your location, phone number, or home address in public posts.",
    "public_wifi": "🌐 Public Wi-Fi Alert: Avoid using open Wi-Fi at airports or cafes for banking or shopping. Hackers can easily steal your passwords there.",
    "screen_sharing": "📱 Screen Sharing Warning: Never download apps like AnyDesk or TeamViewer if a stranger asks you to. They can see everything on your phone!",
    "romance_scam": "💔 Online Friendship: Be careful with strangers who profess love quickly and ask for money or 'urgent help'. It's often a trap.",
    "webcam_safety": "📷 Webcam Cover: Always cover your laptop camera when not in use. Some malware can turn it on without you knowing.",
    "job_scam": "💼 Fake Job Offers: If a company asks for 'registration fees' or 'security deposit' before giving a job, it is 100% a scam.",
    "data_leak": "📧 Data Breach: Check 'Have I Been Pwned' to see if your email was leaked. If yes, change your passwords immediately.",
    "two_factor": "🔑 2FA: Enable Two-Factor Authentication (2FA) on WhatsApp, Instagram, and Gmail. It adds an extra layer of security beyond your password.",
    "loan_apps": "💸 Illegal Loan Apps: Avoid instant loan apps that ask for access to your contacts and gallery. They might use your photos to harass you later.",
    "digital_footprint": "👣 Digital Footprint: Think before you post! Once something is online, it stays there forever, even if you delete it.",
    "qr_code_scam": "🔳 QR Code Scam: Never scan a QR code to 'receive money'. Scanning a code is only for 'sending money' or making payments.",
    "sim_swapping": "📱 SIM Swapping: If your phone signal suddenly disappears for hours, contact your operator immediately. Someone might be trying to steal your SIM!",
    "parcel_scam": "📦 Fake Parcel Scam: If you get a call saying your 'courier' has drugs or illegal items and they ask for money to clear the case, it's a SCAM! Hang up.",
    "video_call_scam": "📸 Video Call Blackmail: Never pick up video calls from unknown numbers on WhatsApp. They might record you and use it for blackmail.",
    "dark web": "🌐 Dark Web: Your leaked data might be on the dark web. Use 'Google One' or 'Have I Been Pwned' to monitor your email leaks.",
    "customer_care": "📞 Fake Support: Never search for customer care numbers on Google Images or Maps. Always use the official website or app.",
    "gaming_scams": "🎮 Gaming Safety: Don't click on links for 'free skins' or 'free UC' in games. These are phishing links to steal your account.",
    "e_wallet_safety": "👛 Wallet Safety: Set a transaction limit on your GPay/PhonePe. This prevents large amounts from being stolen at once.",
    "identity_theft": "🆔 ID Theft: Never share photos of your Aadhar card, PAN card, or Passport on social media or with strangers.",
    "darkweb": "🌐 Dark_Web: Your leaked data might be on the dark web. Use 'Google One' or 'Have I Been Pwned' to monitor your email leaks."
}

def get_chatbot_response(message):
    message_lower = message.lower()
    for keyword, response in CHATBOT_RESPONSES.items():
        if keyword in message_lower:
            return response
    return CHATBOT_RESPONSES["default"]


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/check-url', methods=['POST'])
def check_url():
    data = request.get_json()
    url = data.get('url', '').strip()
    if not url:
        return jsonify({"error": "URL is required"}), 400
    result = analyze_url(url)
    return jsonify(result)

@app.route('/api/check-text', methods=['POST'])
def check_text():
    data = request.get_json()
    text = data.get('text', '').strip()
    if not text:
        return jsonify({"error": "Text is required"}), 400
    result = analyze_text(text)
    return jsonify(result)

@app.route('/api/check-screenshot', methods=['POST'])
def check_screenshot():
    # Simulated screenshot analysis (in production, use OCR + ML)
    results = [
        {"score": random.randint(60, 95), "status": "PHISHING_DETECTED",
         "findings": ["Fake login form detected", "Mismatched domain in URL bar", "Suspicious SSL certificate"]},
        {"score": random.randint(10, 25), "status": "APPEARS_SAFE",
         "findings": ["No suspicious elements found", "HTTPS connection", "Known trusted domain"]},
        {"score": random.randint(30, 55), "status": "SUSPICIOUS",
         "findings": ["Unusual page layout", "Requesting sensitive information", "Verify before proceeding"]},
    ]
    result = random.choice(results)
    return jsonify(result)

@app.route('/api/scam-alerts', methods=['GET'])
def scam_alerts():
    return jsonify({"alerts": SCAM_ALERTS, "total": sum(a["count"] for a in SCAM_ALERTS),
                    "updated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")})

@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    data = request.get_json()
    message = data.get('message', '')
    response = get_chatbot_response(message)
    return jsonify({"response": response, "timestamp": datetime.datetime.now().strftime("%H:%M")})

@app.route('/api/voice-check', methods=['POST'])
def voice_check():
    data = request.get_json()
    url = data.get('url', '').strip()
    result = analyze_url(url)
    if result['status'] == 'DANGER':
        voice_msg = f"Warning! This URL is dangerous. Risk score: {result['score']} out of 100. Do not visit this website."
    elif result['status'] == 'SUSPICIOUS':
        voice_msg = f"Caution! This URL appears suspicious. Risk score: {result['score']} out of 100. Proceed carefully."
    else:
        voice_msg = f"This URL appears safe. Risk score: {result['score']} out of 100."
    result['voice_message'] = voice_msg
    return jsonify(result)

@app.route('/api/emergency', methods=['POST'])
def emergency():
    return jsonify({
        "message": "Emergency alert sent!",
        "helplines": [
            {"name": "National Cybercrime Helpline", "number": "1930"},
            {"name": "Women's Helpline", "number": "181"},
            {"name": "Police Emergency", "number": "100"},
            {"name": "Report Online", "url": "cybercrime.gov.in"}
        ]
    })
    
    @app.route('/analyze', methods=['POST'])
    def analyze():
        data = request.get_json()     # ← 4 spaces indent
        text = data.get('text', '')    # ← 4 spaces indent
        result = analyze_text(text)    # ← 4 spaces indent
        return jsonify(result)         # ← 4 spaces indent

if __name__ == '__main__':
    app.run(debug=True, port=5001)
