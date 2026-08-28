const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  commands: [
    // أمر إعداد لوحة التذاكر المتقدمة
    {
      data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('Setup an advanced Ticket Panel with custom embed, categories, and image banner')
        .addStringOption(opt => opt.setName('title').setDescription('Embed Title').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('Embed Description').setRequired(true))
        .addStringOption(opt => opt.setName('image_url').setDescription('Banner Image URL (Optional)').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const imageUrl = interaction.options.getString('image_url');

        const ticketEmbed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor('#5865F2')
          .setFooter({ text: 'Oscorp Ticket System • Choose a category below' })
          .setTimestamp();

        if (imageUrl) {
          ticketEmbed.setImage(imageUrl);
        }

        // قائمة منسدلة تحتوي على 6 أقسام مختلفة للتذاكر
        const categorySelect = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('select_ticket_category')
            .setPlaceholder('📂 Choose Ticket Category / اختر قسم التذكرة...')
            .addOptions([
              { label: 'General Help / تحتاج مساعدة', description: 'General support and technical assistance', value: 'help', emoji: '🛠️' },
              { label: 'Submit Complaint / تقديم شكوى', description: 'Report a member or staff issue', value: 'complaint', emoji: '⚠️' },
              { label: 'Billing & Store / الشراء والاستفسارات', description: 'Store, payments, and VIP roles', value: 'billing', emoji: '💳' },
              { label: 'Suggestions / اقتراحات', description: 'Share your ideas for the server', value: 'suggestion', emoji: '💡' },
              { label: 'Rewards & Claims / المكافآت والجوائز', description: 'Claim event rewards or giveaways', value: 'rewards', emoji: '🎁' },
              { label: 'Other Inquiries / استفسارات أخرى', description: 'Any other topics not listed above', value: 'other', emoji: '❓' }
            ])
        );

        await interaction.channel.send({ embeds: [ticketEmbed], components: [categorySelect] });
        await interaction.reply({ content: '✅ Advanced Ticket Panel deployed successfully!', ephemeral: true });
      }
    },
    // أمر المساعدة
    {
      data: new SlashCommandBuilder().setName('help').setDescription('Displays help and setup guide'),
      async execute(interaction) {
        const embed = new EmbedBuilder()
          .setTitle('✨ Oscorp System')
          .setDescription('Use `/ticket-setup` to deploy the customizable Ticket System with categories and banner images!')
          .setColor('#5865F2');
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  ]
};
