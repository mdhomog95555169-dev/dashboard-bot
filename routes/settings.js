const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ status: 'Settings route working' });
});

module.exports = router;

      <div style="background:#18191c; border:2px solid #5865F2; border-radius:8px; padding:15px; margin:20px 0; color:#fff;">
        <h3 style="margin-top:0; color:#5865F2;">🎨 التحكم بالخلفية والأفاتار</h3>
        <div style="margin-bottom:12px;">
          <label style="display:block; font-weight:bold; margin-bottom:5px;">📁 رفع صورة خلفية جديدة:</label>
          <input type="file" name="bgImage" accept="image/*" style="background:#2b2d31; color:#fff; padding:8px; border-radius:4px; width:100%;">
        </div>
        <div style="margin-bottom:12px;">
          <label style="display:block; font-weight:bold; margin-bottom:5px;">↔️ موقع الأفاتار X:</label>
          <input type="range" name="avatarX" min="0" max="800" value="400" style="width:100%;">
        </div>
        <div style="margin-bottom:12px;">
          <label style="display:block; font-weight:bold; margin-bottom:5px;">↕️ موقع الأفاتار Y:</label>
          <input type="range" name="avatarY" min="0" max="360" value="120" style="width:100%;">
        </div>
        <div style="margin-bottom:12px;">
          <label style="display:block; font-weight:bold; margin-bottom:5px;">🔍 حجم الأفاتار:</label>
          <input type="range" name="avatarRadius" min="20" max="150" value="60" style="width:100%;">
        </div>
      </div>
      