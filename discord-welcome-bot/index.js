const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// ضع آيدي روم الترحيب وتوكن البوت هنا
const WELCOME_CHANNEL_ID = 'ضع_آيدي_الروم_هنا';
const BOT_TOKEN = 'ضع_توكن_البوت_هنا';

client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    try {
        const canvas = createCanvas(1024, 450);
        const ctx = canvas.getContext('2d');

        // رابط الخلفية
        const background = await loadImage('https://probot.media/IqoX.png');
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        // قص رسمة الأفتار بشكل دائري
        ctx.save();
        ctx.beginPath();
        ctx.arc(512, 180, 100, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.drawImage(avatar, 412, 80, 200, 200);
        ctx.restore();

        // كتابة اسم العضو وعدد الأعضاء
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px Sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Welcome, ${member.user.username}!`, 512, 340);

        ctx.font = '30px Sans-serif';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`Member #${member.guild.memberCount}`, 512, 390);

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'welcome-image.png' });
        channel.send({
            content: `مرحبًا بك ${member} في السيرفر!`,
            files: [attachment]
        });
    } catch (err) {
        console.error('Error generating welcome image:', err);
    }
});

client.login(BOT_TOKEN);
