import fs from 'fs';
import path from 'path';

async function run() {
  const fontsDir = path.resolve('public/fonts');
  fs.mkdirSync(fontsDir, { recursive: true });

  try {
    const res = await fetch('https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;700&display=swap', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const css = await res.text();
    console.log('CSS received, looking for woff2 urls...');

    // Regex match woff2 urls
    const matches = [...css.matchAll(/src:\s*url\((https:[^)]+\.woff2)\)/g)];
    console.log(`Found ${matches.length} font files in CSS.`);

    if (matches.length >= 2) {
      // First is regular, later is bold
      const regUrl = matches[0][1];
      const boldUrl = matches[matches.length - 1][1];

      console.log('Downloading Regular:', regUrl);
      const regRes = await fetch(regUrl);
      const regBuf = Buffer.from(await regRes.arrayBuffer());
      fs.writeFileSync(path.join(fontsDir, 'NotoSansKannada-Regular.woff2'), regBuf);

      console.log('Downloading Bold:', boldUrl);
      const boldRes = await fetch(boldUrl);
      const boldBuf = Buffer.from(await boldRes.arrayBuffer());
      fs.writeFileSync(path.join(fontsDir, 'NotoSansKannada-Bold.woff2'), boldBuf);

      console.log('Fonts downloaded successfully.');
    }
  } catch (err) {
    console.error('Font download error:', err);
  }
}

run();
