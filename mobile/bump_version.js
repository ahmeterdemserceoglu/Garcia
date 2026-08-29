const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, 'app.json');
const buildGradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');

try {
  // 1. Update app.json
  const data = fs.readFileSync(appJsonPath, 'utf8');
  const appJson = JSON.parse(data);

  let oldCode = appJson.expo.android.versionCode || 1;
  const newCode = oldCode + 1;
  
  appJson.expo.android.versionCode = newCode;

  let oldIos = parseInt(appJson.expo.ios.buildNumber || '1', 10);
  if (!isNaN(oldIos)) {
    appJson.expo.ios.buildNumber = (oldIos + 1).toString();
  }

  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

  // 2. Update android/app/build.gradle
  if (fs.existsSync(buildGradlePath)) {
    let gradleData = fs.readFileSync(buildGradlePath, 'utf8');
    // Replace "versionCode 1", "versionCode 2", etc. with the new code
    gradleData = gradleData.replace(/versionCode \d+/g, `versionCode ${newCode}`);
    fs.writeFileSync(buildGradlePath, gradleData);
  }

  console.log(`✅ Sürüm başarıyla güncellendi! Yeni versionCode: ${newCode}`);
} catch (error) {
  console.error("Hata oluştu:", error);
}
