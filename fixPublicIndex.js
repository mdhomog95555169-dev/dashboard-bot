const fs = require('fs');
const filePath = './public/index.html';

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. تحويل الـ Form ليدعم رفع الصور
  content = content.replace(/<form/g, '<form enctype="multipart/form-data"');

  // 2. كود أشرطة التحكم والرفع المباشر
  const controls = `
  <!-- UI Controls for Welcome Image & Avatar -->
  <div style="background:#18191c; border:1px solid #2f3136; border-radius:8px; padding:15px; margin:15px 0; color:#fff;">
    <h4 style="margin-top:0; color:#5865F2;">🎨 إعدادات الصورة والأفاتار</h4>
    
    <div style="margin-bottom:12px;">
      <label style="display:block; font-weight:bold; margin-bottom:5px;">📁 رفع صورة خلفية جديدة:</label>
      <input type="file" name="bgImage" accept="image/*" style="background:#2b2d31; color:#fff; padding:8px; border-radius:4px; width:100%;">
    </div>

    <div style="margin-bottom:12px;">
      <label style="display:block; font-weight:bold; margin-bottom:5px;">↔️ موقع الأفاتار أفقياً (Avatar X):</label>
      <input type="range" name="avatarX" min="0" max="800" value="400" style="width:100%;">
    </div>

    <div style="margin-bottom:12px;">
      <label style="display:block; font-weight:bold; margin-bottom:5px;">↕️ موقع الأفاتار عمودياً (Avatar Y):</label>
      <input type="range" name="avatarY" min="0" max="360" value="120" style="width:100%;">
    </div>

    <div style="margin-bottom:12px;">
      <label style="display:block; font-weight:bold; margin-bottom:5px;">🔍 حجم الأفاتار (Avatar Radius):</label>
      <input type="range" name="avatarRadius" min="20" max="150" value="60" style="width:100%;">
    </div>
  </div>
  `;

  if (!content.includes('name="bgImage"')) {
    // إضافة العناصر فوق زر Save Changes مباشرة
    content = content.replace('Save Changes', controls + '\nSave Changes');
    fs.writeFileSync(filePath, content);
    console.log('✅ تم تعديل public/index.html بنجاح!');
  } else {
    console.log('⚠️ التعديل موجود مسبقاً.');
  }
} else {
  console.log('❌ لم يتم العثور على الملف!');
}
