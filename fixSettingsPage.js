const fs = require('fs');
const path = require('path');

function patchSettings(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.git'].includes(item)) patchSettings(fullPath);
    } else if (item.includes('settings')) {
      console.log('FOUND SETTINGS FILE:', fullPath);
      let content = fs.readFileSync(fullPath, 'utf8');

      // 1. تفعيل رفع الملفات
      content = content.replace(/<form enctype="multipart/form-data"/g, '<form enctype="multipart/form-data" enctype="multipart/form-data"');

      // 2. كود أشرطة التحكم والرفع
      const controls = `
      <div style="background:#18191c; border:2px solid #5865F2; border-radius:8px; padding:15px; margin:20px 0; color:#fff;">
        <h3 style="margin-top:0; color:#5865F2;">🎨 إعدادات الترحيب والصورة (Welcome Controls)</h3>
        
        <div style="margin-bottom:12px;">
          <label style="display:block; font-weight:bold; margin-bottom:5px;">📁 رفع صورة خلفية جديدة (Upload Background):</label>
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
          <label style="display:block; font-weight:bold; margin-bottom:5px;">🔍 حجم الأفاتار (Avatar Size):</label>
          <input type="range" name="avatarRadius" min="20" max="150" value="60" style="width:100%;">
        </div>
      </div>
      `;

      if (!content.includes('name="bgImage"')) {
        content = content.replace('
      <!-- WELCOME_CONTROLS_V2 -->
      <div style="background:#18191c; border:2px solid #5865F2; border-radius:8px; padding:15px; margin:20px 0; color:#fff;">
        <h3 style="color:#5865F2; margin-top:0;">🎨 إعدادات الترحب والصورة</h3>
        <div style="margin-bottom:10px;">
          <label style="display:block; font-weight:bold;">📁 رفع صورة خلفية جديدة:</label>
          <input type="file" name="bgImage" accept="image/*" style="background:#2b2d31; color:#fff; padding:6px; width:100%; border-radius:4px;">
        </div>
        <div style="margin-bottom:10px;">
          <label style="display:block; font-weight:bold;">↔️ موقع الأفاتار X:</label>
          <input type="range" name="avatarX" min="0" max="800" value="400" style="width:100%;">
        </div>
        <div style="margin-bottom:10px;">
          <label style="display:block; font-weight:bold;">↕️ موقع الأفاتار Y:</label>
          <input type="range" name="avatarY" min="0" max="360" value="120" style="width:100%;">
        </div>
        <div style="margin-bottom:10px;">
          <label style="display:block; font-weight:bold;">🔍 حجم الأفاتار:</label>
          <input type="range" name="avatarRadius" min="20" max="150" value="60" style="width:100%;">
        </div>
      </div>
      
</form>', controls + '\n</form>');
        fs.writeFileSync(fullPath, content);
        console.log('SUCCESSFULLY PATCHED:', fullPath);
      } else {
        console.log('ALREADY PATCHED:', fullPath);
      }
    }
  }
}

patchSettings(__dirname);
