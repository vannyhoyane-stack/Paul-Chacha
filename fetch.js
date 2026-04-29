import https from 'https';
import fs from 'fs';

https.get('https://vanny-gaming-store-and-video-574042133490.europe-west3.run.app/assets/index-PaHfbx1j.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => fs.writeFileSync('website_js.js', data));
});
https.get('https://vanny-gaming-store-and-video-574042133490.europe-west3.run.app/assets/index-Di0PLPNj.css', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => fs.writeFileSync('website_css.css', data));
});
