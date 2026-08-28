const mongoose = require('mongoose');
const config = require('./config');

async function connect() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ تم الاتصال بقاعدة البيانات MongoDB بنجاح!');
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
  }
}

module.exports = { connect };
