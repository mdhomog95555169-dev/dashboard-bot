require('dotenv').config();
const { handleWelcome } = require("./welcomeService");
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// إعداد مجلد رفع الصور
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'public/uploads')),
    filename: (req, file, cb) => cb(null, `bg_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')) });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// توجيه جميع الطلبات المباشرة للواجهة الجديدة
app.use(express.static(path.join(__dirname, 'public')));

const CONFIG_PATH = path.join(__dirname, 'welcomeConfig.json');

function getConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        }
    } catch (e) {}
    return {
        enabled: true, imageEnabled: true, channelId: '', message: 'Welcome {user} to {server}!',
        textOverlay: 'Welcome to Our Server', textColor: '#ffffff', bgColor: '#1e2238',
        avatarX: 400, avatarY: 120, avatarRadius: 60, bgUrl: '', bgImagePath: ''
    };
}

function saveConfig(cfg) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

app.get('/api/config', (req, res) => res.json(getConfig()));

app.post('/api/config', upload.single('bgImage'), (req, res) => {
    let current = getConfig();
    const number = (value, fallback, min, max) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : fallback));
    let updated = {
        enabled: req.body.welcomeEnabled === 'true',
        imageEnabled: req.body.welcomeEnabled === 'true',
        channelId: req.body.welcomeChannelId || '',
        message: req.body.welcomeMsg || current.message,
        textOverlay: req.body.textContent || current.textOverlay,
        textColor: req.body.textColor || current.textColor,
        bgUrl: req.body.bgUrl || '',
        avatarX: number(req.body.avatarX, current.avatarX || 400, 0, 800),
        avatarY: number(req.body.avatarY, current.avatarY || 120, 0, 360),
        avatarRadius: number(req.body.avatarRadius, current.avatarRadius || 60, 20, 160)
    };

    if (req.file) {
        updated.bgImagePath = `/uploads/${req.file.filename}`;
    }

    const finalConfig = { ...current, ...updated };
    saveConfig(finalConfig);
    res.json({ success: true, config: finalConfig });
});

app.get('/api/channels', (req, res) => {
    try {
        const guild = client.guilds.cache.first();
        if (!guild) return res.json([]);
        const channels = guild.channels.cache
            .filter(c => c.isTextBased())
            .map(c => ({ id: c.id, name: c.name }));
        res.json(channels);
    } catch (e) {
        res.json([]);
    }
});

// فتح الواجهة الجديدة عند الدخول للموقع مباشرة
app.get('*', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

app.listen(PORT, () => console.log(`🚀 New Dashboard active on port ${PORT}`));
client.login(process.env.BOT_TOKEN || process.env.DISCORD_TOKEN);

client.on("guildMemberAdd", async (member) => { await handleWelcome(member); });

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(require('path').join(__dirname, 'public', 'index.html'));
});