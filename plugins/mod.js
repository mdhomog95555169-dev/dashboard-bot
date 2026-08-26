module.exports = {
  name: 'clear',
  aliases: ['مسح', 'مسح_الرسائل'],
  async execute(message, args) {
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ لا تملك صلاحية إدارة الرسائل.');
    }
    const amount = parseInt(args[0]) || 10;
    if (amount > 100 || amount < 1) return message.reply('⚠️ حدد عدداً بين 1 و 100.');
    
    await message.channel.bulkDelete(amount, true);
    const reply = await message.channel.send(`🧹 تم مسح ${amount} رسالة بنجاح.`);
    setTimeout(() => reply.delete().catch(() => {}), 3000);
  }
};
