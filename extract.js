import fs from 'fs';
const js = fs.readFileSync('website_js.js', 'utf8');
const strings = js.match(/(?<=["'])([^"']{5,})(?=["'])/g);
if (strings) {
  const unique = [...new Set(strings)].filter(s => /[A-Za-z\s]{10,}/.test(s));
  console.log(unique.slice(0, 50).join('\n'));
}
