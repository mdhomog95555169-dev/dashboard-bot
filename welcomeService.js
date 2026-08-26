const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

async function handleWelcome(member) {
  try {
    const configPath = path.join(__dirname, 'welcomeConfig.json');
    if (!fs.existsSync(configPath)) return;

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!config.enabled || !config.channelId) return;

    const channel = member.guild.channels.cache.get(config.channelId);
    if (!channel) return;

    // 1. تجهيز نص الترحيب
    let text = config.message || 'Welcome {user} to {server}!';
    text = text
      .replace(/{user}/g, `<@${member.id}>`)
      .replace(/{username}/g, member.user.username)
      .replace(/{server}/g, member.guild.name)
      .replace(/{memberCount}/g, member.guild.memberCount);

    // إذا كانت ميزة الصورة غير مفعلة نكتفي بالنص
    if (!config.imageEnabled) {
      await channel.send({ content: text });
      return;
    }

    // 2. تصميم صورة Canvas بالخيارات المحددة من اللوحة
    const canvasWidth = config.canvasWidth || 800;
    const canvasHeight = config.canvasHeight || 360;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // أ) الخلفية (صورة مرفوعة أو رابط أو لون)
    let bgImage;
    if (config.bgImagePath) {
      const relativePath = config.bgImagePath.replace(/^\/+/, '');
      const localPath = path.join(__dirname, 'public', relativePath);
      if (fs.existsSync(localPath)) {
        try { bgImage = await loadImage(localPath); } catch (e) {}
      }
    }
    if (!bgImage && config.bgUrl) {
      try { bgImage = await loadImage(config.bgUrl); } catch (e) {}
    }

    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, canvasWidth, canvasHeight);
    } else {
      ctx.fillStyle = config.bgColor || '#23272A';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // ب) الأفاتار (الموقع والحجم والإحداثيات من الـ Bars)
    const avatarX = Number(config.avatarX ?? 400);
    const avatarY = Number(config.avatarY ?? 120);
    const avatarRadius = Number(config.avatarRadius ?? 60);

    try {
      const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
      const avatarImg = await loadImage(avatarUrl);

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(
        avatarImg,
        avatarX - avatarRadius,
        avatarY - avatarRadius,
        avatarRadius * 2,
        avatarRadius * 2
      );
      ctx.restore();

      // رسم الإطار الدائري
      if (config.borderWidth !== 0) {
        ctx.strokeStyle = config.borderColor || '#FFFFFF';
        ctx.lineWidth = Number(config.borderWidth ?? 4);
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
        ctx.stroke();
      }
    } catch (e) {
      console.error('Error drawing avatar:', e);
    }

    // ج) نص الترحيب المخصص داخل الصورة
    const textOverlay = config.textOverlay || `Welcome to ${member.guild.name}`;
    const textX = Number(config.textX ?? (canvasWidth / 2));
    const textY = Number(config.textY ?? (canvasHeight - 50));
    const fontSize = Number(config.fontSize ?? 32);

    ctx.font = `bold ${fontSize}px Sans-serif`;
    ctx.fillStyle = config.textColor || '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(textOverlay, textX, textY);

    // 3. تصدير الصورة وإرسالها
    const buffer = await canvas.encode('png');
    const attachment = new AttachmentBuilder(buffer, { name: 'welcome.png' });

    await channel.send({ content: text, files: [attachment] });

  } catch (err) {
    console.error('Error in Welcome Service:', err);
  }
}

module.exports = { handleWelcome };
