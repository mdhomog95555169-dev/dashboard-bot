const fs = require('fs');
const path = require('path');

// البحث عن ملفات الـ HTML والـ JS الخاصة باللوحة
function findAndFixHTML(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git')) {
        findAndFixHTML(fullPath);
      }
    } else if (file.endsWith('.ejs') || file.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('Background') && content.includes('Avatar')) {
        console.log('Updating UI in:', fullPath);
        
        // تحسين قسم التحكم وتبديل الخيارات ديناميكياً
        const customScript = `
        <script>
        document.addEventListener("DOMContentLoaded", function() {
          const bgTab = document.querySelector('[data-tab="background"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Background'));
          const avatarTab = document.querySelector('[data-tab="avatar"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Avatar'));
          const container = document.querySelector('.TEXT_CONTENT')?.parentElement || document.querySelector('#welcome-controls');

          if(bgTab) {
            bgTab.addEventListener('click', function(e) {
              e.preventDefault();
              showBackgroundControls();
            });
          }
          if(avatarTab) {
            avatarTab.addEventListener('click', function(e) {
              e.preventDefault();
              showAvatarControls();
            });
          }

          function showBackgroundControls() {
            const controlsArea = document.querySelector('.controls-area') || container;
            if(!controlsArea) return;
            controlsArea.innerHTML = \`
              <div style="margin-top:15px;">
                <label style="color:#fff; display:block; margin-bottom:5px;">Upload Background Image:</label>
                <input type="file" id="bgImageUpload" name="bgImage" accept="image/*" style="color:#fff; background:#1e1f22; padding:8px; border-radius:5px; width:100%;">
                <label style="color:#fff; display:block; margin-top:10px; margin-bottom:5px;">Or Background URL:</label>
                <input type="text" name="bgUrl" placeholder="https://..." style="width:100%; padding:8px; background:#1e1f22; color:#fff; border:1px solid #333; border-radius:5px;">
              </div>
            \`;
          }

          function showAvatarControls() {
            const controlsArea = document.querySelector('.controls-area') || container;
            if(!controlsArea) return;
            controlsArea.innerHTML = \`
              <div style="margin-top:15px; color:#fff;">
                <label>Avatar X Position: <input type="range" name="avatarX" min="0" max="800" value="400"></label><br><br>
                <label>Avatar Y Position: <input type="range" name="avatarY" min="0" max="360" value="120"></label><br><br>
                <label>Avatar Size (Radius): <input type="range" name="avatarRadius" min="20" max="150" value="60"></label>
              </div>
            \`;
          }
        });
        </script>
        `;
        if (!content.includes('bgImageUpload')) {
          content += customScript;
          fs.writeFileSync(fullPath, content);
        }
      }
    }
  }
}

findAndFixHTML(__dirname);
