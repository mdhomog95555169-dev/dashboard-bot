const { PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

const helpCommand = {
  name: 'help',
  description: 'View the interactive help menu | قائمة المساعدة',
  options: [],

  execute: async (ctx) => {
    const client = ctx.raw.client;

    const categories = {
      moderation: {
        label: 'Moderation',
        emoji: '🛡️',
        description: `> **مرحباً بك في لوحة تحكم OS.**
> **اختر القسم المطلوب من القائمة بالأسفل.**

✈️ \`/ban\`
حظر عضو من السيرفر

🔓 \`/unban\`
فك الحظر بواسطة ID

👢 \`/kick\`
طرد عضو من السيرفر

🔊 \`/vkick\`
طرد عضو من الروم الصوتي

⏱️ \`/timeout\`
إسكات مؤقت لعضو

🔄 \`/untimeout\`
إلغاء الإسكات المؤقت

🔇 \`/mutetext\`
كتم عضو عن الكتابة

🔊 \`/unmutetext\`
إلغاء كتم الكتابة

🔇 \`/mutevoice\`
كتم صوت عضو

🔊 \`/unmutevoice\`
إلغاء كتم صوت عضو

⚠️ \`/warn\`
إضافة تحذير لعضو

🗑️ \`/warn_remove\`
حذف تحذير معين

📋 \`/warnings\`
عرض تحذيرات عضو

🧹 \`/clear\`
مسح عدد من الرسائل`
      },

      channels: {
        label: 'Channels & Roles',
        emoji: '📂',
        description: `🔒 \`/lock\`
قفل القناة الحالية

🔓 \`/unlock\`
فتح القناة الحالية

🎭 \`/role\`
إضافة أو إزالة رتبة

🎨 \`/setcolor\`
تغيير لون رتبة

🐢 \`/slowmode\`
ضبط الوضع البطيء

🏷️ \`/setnick\`
تغيير لقب المستخدم

📊 \`/points\`
نظام نقاط الأعضاء`
      },

      utility: {
        label: 'Utility',
        emoji: '🧰',
        description: `📢 \`/embed\`
إرسال رسالة مخصصة

💬 \`/say\`
جعل البوت يرسل رسالة

🤖 \`/botinfo\`
معلومات البوت وحالته

⚙️ \`/help\`
عرض قائمة المساعدة`
      }
    };

    function buildHelpEmbed(categoryKey) {
      const category = categories[categoryKey];

      return new EmbedBuilder()
        .setTitle('⚡ OS System — Control Center')
        .setDescription(category.description)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setFooter({
          text: 'OS System Engine'
        })
        .setColor(0x2f3136);
    }

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('os_help_category')
        .setPlaceholder('Choose a category')
        .addOptions(
          {
            label: 'Moderation',
            value: 'moderation',
            emoji: '🛡️',
            description: 'Moderation commands'
          },
          {
            label: 'Channels & Roles',
            value: 'channels',
            emoji: '📂',
            description: 'Channel and role commands'
          },
          {
            label: 'Utility',
            value: 'utility',
            emoji: '🧰',
            description: 'Utility commands'
          }
        )
    );

    let message;

    if (ctx.isSlash) {
      await ctx.raw.reply({
        embeds: [buildHelpEmbed('moderation')],
        components: [row]
      });

      message = await ctx.raw.fetchReply();
    } else {
      message = await ctx.raw.reply({
        embeds: [buildHelpEmbed('moderation')],
        components: [row]
      });
    }

    const collector = message.createMessageComponentCollector({
      time: 120000
    });

    collector.on('collect', async (interaction) => {
      try {
        if (interaction.user.id !== ctx.invoker.id) {
          return interaction.reply({
            content: '❌ This menu is not for you.',
            ephemeral: true
          });
        }

        const selectedCategory = interaction.values[0];

        if (!categories[selectedCategory]) {
          return interaction.reply({
            content: '❌ Invalid category.',
            ephemeral: true
          });
        }

        await interaction.update({
          embeds: [buildHelpEmbed(selectedCategory)],
          components: [row]
        });
      } catch (error) {
        console.error('Help menu error:', error);
      }
    });

    collector.on('end', async () => {
      try {
        await message.edit({
          components: []
        });
      } catch {}
    });
  }
};

module.exports = { helpCommand };
