import os
import sys
import re
import time
import json
import asyncio
import urllib.request
from collections import defaultdict
import discord
from discord import app_commands
from discord.ext import commands
from dotenv import load_dotenv

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

TOKEN = os.getenv('DISCORD_TOKEN')
GUILD_ID = int(os.getenv('GUILD_ID', '1566207225771589843'))
OWNER_ID = int(os.getenv('OWNER_ID', '920353166078410782'))
WEBSITE_URL = os.getenv('WEBSITE_URL', 'https://tickrate.eu')
GEMINI_KEY = os.getenv('GEMINI_API_KEY')

KNOWLEDGE = ""
knowledge_path = os.path.join(os.path.dirname(__file__), "knowledge.txt")
if os.path.exists(knowledge_path):
    with open(knowledge_path, "r", encoding="utf-8") as f:
        KNOWLEDGE = f.read()

user_request_timestamps = defaultdict(list)
RATE_LIMIT_MAX = 3
RATE_LIMIT_WINDOW = 60

def check_rate_limit(user_id: int) -> tuple[bool, int]:
    now = time.time()
    timestamps = user_request_timestamps[user_id]
    user_request_timestamps[user_id] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    if len(user_request_timestamps[user_id]) >= RATE_LIMIT_MAX:
        oldest = user_request_timestamps[user_id][0]
        wait_time = int(RATE_LIMIT_WINDOW - (now - oldest))
        return False, max(1, wait_time)
    user_request_timestamps[user_id].append(now)
    return True, 0

RELEVANT_KEYWORDS = {
    "cs", "csgo", "cs2", "counter", "strike", "valve", "steam", "map", "maps",
    "mirage", "inferno", "dust", "dust2", "nuke", "ancient", "anubis", "vertigo",
    "retake", "wingman", "duel", "duels", "1v1", "2v2", "5v5", "mr12", "mr8",
    "tick", "128", "tickrate", "stuff", "smoke", "flash", "nade", "warmup", "knife",
    "site", "plateforme", "connexion", "compte", "rang", "niveau", "point", "classement",
    "partie", "rejoindre", "serveur", "serveurs", "latence", "triche", "règles", "reglement",
    "bonjour", "salut", "comment", "pourquoi", "aide",
    "website", "platform", "login", "connect", "account", "rank", "ranks", "level",
    "points", "leaderboard", "match", "matchmaking", "game", "queue", "join", "server",
    "servers", "ping", "lag", "fps", "cheat", "cheater", "hacker", "rules", "ban", "report",
    "hello", "hi", "hey", "how", "why", "what", "where", "who", "help", "support", "issue", "bug",
    "кс", "ксго", "кс2", "сервер", "сервера", "тикрейт", "сайт", "ранг", "уровень",
    "эло", "elo", "матч", "поиск", "играть", "вход", "логин", "стим", "пинг", "лаг",
    "баг", "ошибка", "чит", "читер", "бан", "правила", "хелп", "помощь", "привет", "как",
    "jugar", "servidor", "servidores", "cuenta", "reglas", "ayuda", "hola",
    "spielen", "regeln", "hilfe", "hallo"
}

OFFTOPIC_TRIGGERS = [
    r"\b(recette|cuisine|ingr[eé]dient|recipe|cook|cooking|рецепт)\b",
    r"\b(po[eèé]sie|po[eè]me|poem|poetry|стих)\b",
    r"\b(pr[eé]sident|macron|biden|politique|politics|политика)\b",
    r"\b(devoir|dissertation|homework|math exercise|домашнее задание)\b",
    r"\b(fortnite|valorant|league of legends|lol|minecraft|roblox|fifa|дота|dota)\b",
    r"\b(crypto|bitcoin|btc|ethereum|trading|крипта)\b",
    r"\b(code python|write a script|напиши код)\b"
]

def is_topic_allowed(prompt: str) -> tuple[bool, str]:
    clean_text = prompt.strip().lower()

    if len(prompt) > 400:
        return False, "⚠️ Question too long / Question trop longue (max 400 chars) !"

    if len(prompt) < 2:
        return False, "⚠️ Question too short / Trop courte !"

    for pattern in OFFTOPIC_TRIGGERS:
        if re.search(pattern, clean_text):
            return False, "🛡️ **Firewall :** I only answer questions regarding **Tickrate.eu** and **Counter-Strike**."

    words = set(re.findall(r"[\w\u0400-\u04FF]+", clean_text))
    has_relevant_word = bool(words & RELEVANT_KEYWORDS)

    if not has_relevant_word:
        starters = ["c'est quoi", "comment", "pourquoi", "quand", "où", "what", "how", "why", "when", "where", "who", "как", "что", "где"]
        if not any(clean_text.startswith(q) for q in starters):
            return False, "🛡️ **Firewall :** Off-topic question ! Ask anything about **Tickrate.eu**, ELO ranks, CS servers or support."

    return True, ""

def ask_gemini(user_prompt: str) -> str:
    if not GEMINI_KEY:
        return "IA Key missing / Clé d'IA manquante."

    system_instruction = (
        "You are the official helper bot for the Tickrate.eu Discord server (CS:GO/CS2 matchmaking platform created by @404).\n"
        "LANGUAGE RULE: You MUST automatically detect and respond in the EXACT SAME LANGUAGE as the user (English, French, Russian, Spanish, German, etc.).\n"
        "SECURITY RULE: Only answer questions related to Tickrate.eu, Counter-Strike, servers, matchmaking, ELO ranks, rules or support. Refuse off-topic requests.\n"
        "TONE: Friendly, relaxed, gamer tone. Concise response (2-4 sentences max).\n"
        "KNOWLEDGE BASE:\n"
        + KNOWLEDGE
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key={GEMINI_KEY}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_instruction}\n\nUser Message : {user_prompt}"}
                ]
            }
        ],
        "generationConfig": {
            "maxOutputTokens": 300,
            "temperature": 0.5
        }
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return data['candidates'][0]['content']['parts'][0]['text'].strip()
    except Exception as e:
        print(f"Erreur Gemini API : {e}")
        return f"Oups ! Error connecting to AI. Please contact <@{OWNER_ID}> or check #help !"

def get_channel_by_keyword(guild, keyword):
    if not guild: return None
    for ch in guild.text_channels:
        if keyword in ch.name.lower():
            return ch
    return None

def get_role_by_keyword(guild, keyword):
    if not guild: return None
    for r in guild.roles:
        if keyword in r.name.lower():
            return r
    return None

def create_bot(with_privileged=True):
    intents = discord.Intents.default()
    if with_privileged:
        intents.message_content = True
        intents.members = True

    b = commands.Bot(command_prefix="!", intents=intents, help_command=None)

    @b.event
    async def on_ready():
        print("==================================================")
        print(f"🤖 Bot connecté en tant que : {b.user.name} ({b.user.id})")
        print(f"🧠 IA Gemini : {'ACTIVÉE (Multilingue auto FR/EN/RU...)' if GEMINI_KEY else 'DÉSACTIVÉE'}")
        print(f"🛡️ Firewall Anti-Abus : ACTIVÉ")
        print(f"🌐 Privileged Intents : {'ACTIFS' if with_privileged else 'DÉSACTIVÉS (Mode Slash Commands)'}")
        print("==================================================")

        activity = discord.Activity(type=discord.ActivityType.watching, name="tickrate.eu • /ask ou /help")
        await b.change_presence(status=discord.Status.online, activity=activity)

        guild = discord.Object(id=GUILD_ID)
        try:
            b.tree.copy_global_to(guild=guild)
            synced = await b.tree.sync(guild=guild)
            print(f"✅ {len(synced)} commande(s) slash synchronisée(s) !")
        except Exception as e:
            print(f"⚠️ Erreur sync slash commands : {e}")

    if with_privileged:
        @b.event
        async def on_member_join(member):
            guild = member.guild
            role_membre = get_role_by_keyword(guild, "membre")
            if role_membre:
                try:
                    await member.add_roles(role_membre)
                except Exception:
                    pass

            chan_general = get_channel_by_keyword(guild, "général") or get_channel_by_keyword(guild, "general")
            chan_bienvenue = get_channel_by_keyword(guild, "bienvenue")
            chan_help = get_channel_by_keyword(guild, "help")

            if chan_general:
                embed = discord.Embed(
                    title=f"🎉 Welcome / Bienvenue sur Tickrate.eu, {member.display_name} !",
                    description=(
                        f"Welcome {member.mention} !\n\n"
                        f"• Check {chan_bienvenue.mention if chan_bienvenue else '#bienvenue'} to get started.\n"
                        f"• Need help ? Feel free to ask in {chan_help.mention if chan_help else '#help'}.\n\n"
                        f"Have fun ! 🎮"
                    ),
                    color=0x5865F2
                )
                embed.set_thumbnail(url=member.display_avatar.url)
                embed.set_footer(text="Tickrate.eu Helper")
                try:
                    await chan_general.send(embed=embed)
                except Exception:
                    pass

        @b.event
        async def on_message(message):
            if message.author.bot:
                return

            content = message.content.strip()
            is_mentioned = b.user.mentioned in [user for user in message.mentions]
            is_help_channel = "help" in message.channel.name.lower()

            if is_help_channel or is_mentioned:
                cleaned_content = content.replace(f"<@{b.user.id}>", "").strip()
                if not cleaned_content:
                    cleaned_content = "Hello, who are you ?"

                allowed, wait_sec = check_rate_limit(message.author.id)
                if not allowed:
                    await message.reply(f"⏳ Cooldown ! Wait **{wait_sec}s** before asking again.", mention_author=False)
                    return

                is_ok, reason = is_topic_allowed(cleaned_content)
                if not is_ok:
                    await message.reply(reason, mention_author=False)
                    return

                async with message.channel.typing():
                    loop = asyncio.get_event_loop()
                    reply_text = await loop.run_in_executor(None, ask_gemini, cleaned_content)

                    embed = discord.Embed(
                        description=reply_text,
                        color=0x5865F2
                    )
                    embed.set_footer(text="Tickrate.eu Helper • Gemini Multilingual & @404")
                    await message.reply(embed=embed, mention_author=False)

            await b.process_commands(message)

    @b.tree.command(name="ask", description="Ask any question about Tickrate.eu to the AI (Multilingual)")
    @app_commands.describe(question="Your question in English, French, Russian, etc.")
    async def slash_ask(interaction: discord.Interaction, question: str):
        allowed, wait_sec = check_rate_limit(interaction.user.id)
        if not allowed:
            await interaction.response.send_message(
                f"⏳ Cooldown ! Please wait **{wait_sec} seconds**.",
                ephemeral=True
            )
            return

        is_ok, reason = is_topic_allowed(question)
        if not is_ok:
            await interaction.response.send_message(reason, ephemeral=True)
            return

        await interaction.response.defer()
        loop = asyncio.get_event_loop()
        reply_text = await loop.run_in_executor(None, ask_gemini, question)

        embed = discord.Embed(
            title=f"❓ {question}",
            description=reply_text,
            color=0x00C0FF
        )
        embed.set_footer(text="Tickrate.eu Helper • Gemini Multilingual")
        await interaction.followup.send(embed=embed)

    @b.tree.command(name="help", description="Show bot commands and info")
    async def slash_help(interaction: discord.Interaction):
        guild = interaction.guild
        chan_bugs = get_channel_by_keyword(guild, "bugs")
        chan_help = get_channel_by_keyword(guild, "help")
        embed = discord.Embed(
            title="🤖 Tickrate.eu Assistant — Commands",
            description=(
                f"I'm the official helper bot developed by <@{OWNER_ID}>.\n\n"
                f"**Commands :**\n"
                f"• `/ask [question]` : Ask anything in any language (EN, FR, RU...)\n"
                f"• `/site` : Link to web platform\n"
                f"• `/regles` : Community rules summary\n"
                f"• `/ping` : Bot latency\n"
                f"• `/contact` : Contact staff or developer\n\n"
                f"**Need help ?**\n"
                f"Ask in {chan_help.mention if chan_help else '#help'} or report issues in {chan_bugs.mention if chan_bugs else '#bugs-et-suggestions'} !"
            ),
            color=0x5865F2
        )
        embed.set_footer(text="Tickrate.eu • Always here to help !")
        await interaction.response.send_message(embed=embed)

    @b.tree.command(name="site", description="Direct link to Tickrate.eu platform")
    async def slash_site(interaction: discord.Interaction):
        embed = discord.Embed(
            title="🌐 Play on Tickrate.eu",
            description=f"Matchmaking, 128-tick servers, and rankings :\n\n👉 **[{WEBSITE_URL}]({WEBSITE_URL})**",
            color=0x00C0FF
        )
        await interaction.response.send_message(embed=embed)

    @b.tree.command(name="ping", description="Check bot latency")
    async def slash_ping(interaction: discord.Interaction):
        latency = round(b.latency * 1000)
        await interaction.response.send_message(f"🏓 Pong ! Latency : **{latency}ms**", ephemeral=True)

    @b.tree.command(name="regles", description="Show server and game rules")
    async def slash_regles(interaction: discord.Interaction):
        guild = interaction.guild
        chan_reglement = get_channel_by_keyword(guild, "règlement") or get_channel_by_keyword(guild, "reglement")
        embed = discord.Embed(
            title="📜 Fair-play & Rules",
            description=(
                f"1. **Respect** all players.\n"
                f"2. **Zero tolerance** for cheating, exploits or toxicity.\n"
                f"3. **No spam / unauthorized advertising**.\n\n"
                f"Full rules in {chan_reglement.mention if chan_reglement else '#règlement'} !"
            ),
            color=0xF1C40F
        )
        await interaction.response.send_message(embed=embed)

    @b.tree.command(name="contact", description="How to contact support or @404")
    async def slash_contact(interaction: discord.Interaction):
        embed = discord.Embed(
            title="📞 Support & Contact",
            description=(
                f"• Developer / Urgent : <@{OWNER_ID}>\n"
                f"• Technical bugs : post in the dedicated bugs channel.\n"
                f"• Website : **[{WEBSITE_URL}]({WEBSITE_URL})**"
            ),
            color=0xE74C3C
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)

    return b

if __name__ == "__main__":
    if not TOKEN:
        print("❌ ERREUR: Le DISCORD_TOKEN n'est pas défini !")
        sys.exit(1)

    try:
        b = create_bot(with_privileged=True)
        b.run(TOKEN)
    except discord.errors.PrivilegedIntentsRequired:
        print("\n⚠️ Privileged Gateway Intents non activés sur le Developer Portal.")
        print("🔄 Bascule automatique en mode intents standard (Commandes slash actives)...\n")
        b = create_bot(with_privileged=False)
        b.run(TOKEN)
