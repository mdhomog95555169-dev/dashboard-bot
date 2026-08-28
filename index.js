const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('./config');
const { commands } = require('./commands');
const { connect, Settings } = require('./database');
const dashboard = require('./dashboard');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.commands = new Collection();
for (const command of commands) {
  client.commands.set(command.data.name, command);
}

async function deployCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);
    const commandData = commands.map(cmd => cmd.data.toJSON());
    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commandData }
    );
    console.log('✅ Commands Registered Successfully!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

client.once('ready', async () => {
  console.log(`🤖 Logged in as: ${client.user.tag}`);
  await connect();
  await deployCommands();

  const PORT = process.env.PORT || 3000;
  dashboard.listen(PORT, () => console.log(`🌐 Dashboard running on port ${PORT}`));
});

// التعامل مع التفاعلات والـ Select Menus
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) await command.execute(interaction).catch(console.error);
  } 
  else if (interaction.isStringSelectMenu()) {
    // معالجة اختيار أقسام المساعدة /help
    if (interaction.customId === 'help_category_select') {
      const selected = interaction.values[0];
      let title = '';
      let desc = '';

      if (selected === 'help_mod') {
        title = '🛡️ أوامر الإشراف والأعضاء (Moderation)';
        desc = '`/ban` - حظر عضو\n`/unban` - إلغاء حظر\n`/kick` - طرد عضو\n`/timeout` - إعطاء تايم أوت\n`/untimeout` - فك التايم أوت\n`/warn` - تحذير عضو\n`/clear` - مسح الرسائل\n`/role-add` - إضافة رتبة\n`/role-remove` - إزالة رتبة\n`/vkick` - طرد صوتي\n`/vmove` - نقل صوتي\n`/vmute` - كتم صوتي\n`/vunmute` - فك الكتم الصوتي\n`/vdeaf` - صمم صوتي\n`/vundeaf` - فك الصمم الصوتي';
      } else if (selected === 'help_chan') {
        title = '🔒 أوامر القنوات (Channels)';
        desc = '`/lock` - قفل القناة\n`/unlock` - فتح القناة\n`/hide` - إخفاء القناة\n`/unhide` - إظهار القناة\n`/slowmode` - وضع البطء';
      } else if (selected === 'help_util') {
        title = '⚙️ الأوامر العامة والمعلومات (Utility)';
        desc = '`/user` - عرض معلومات حسابك أو حساب آخر\n`/help` - عرض قائمة الأوامر المتاحة';
      }

      const categoryEmbed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(desc)
        .setColor('#2f3136');

      await interaction.reply({ embeds: [categoryEmbed] });
    }
    // معالجة اختيار التذاكر
    else if (interaction.customId === 'custom_ticket_select') {
      const ticketName = `ticket-${interaction.user.username}`;
      const existingChannel = interaction.guild.channels.cache.find(c => c.name === ticketName);

      if (existingChannel) {
        return interaction.reply({ content: `❌ **لديك تذكرة مفتوحة بالفعل:** ${existingChannel}` });
      }

      const settings = await Settings.findOne({ guildId: interaction.guild.id });
      const channelOptions = {
        name: ticketName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
        ],
      };

      if (settings && settings.ticketCategory) {
        channelOptions.parent = settings.ticketCategory;
      }

      const channel = await interaction.guild.channels.create(channelOptions);

      const ticketEmbed = new EmbedBuilder()
        .setTitle(`🎟️ تذكرة دعم جديدة`)
        .setDescription(`أهلاً بك <@${interaction.user.id}>!\nيرجى طرح مشكلتك أو استفسارك هنا، وسيقوم فريق الدعم بمساعدتك قريبًا.`)
        .setColor('#2f3136');

      const closeBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('إغلاق التذكرة')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

      await channel.send({ embeds: [ticketEmbed], components: [closeBtn] });
      await interaction.reply({ content: `✅ **تم إنشاء تذكرتك بنجاح:** ${channel}` });
    }
  } 
  else if (interaction.isButton()) {
    if (interaction.customId === 'close_ticket') {
      await interaction.reply({ content: '🔒 **جاري إغلاق التذكرة خلال 5 ثوانٍ...**' });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  }
});

client.login(config.token);
