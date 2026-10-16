const fs = require('fs');
const content = fs.readFileSync('public/images/home-logo.svg', 'utf8');
const regex = /<path[^>]+fill="([^"]+)"[^>]+transform="([^"]+)"/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(`Fill: ${match[1]}, Transform: ${match[2]}`);
}
console.log('SVG viewBox / width-height: width=5496 height=786');
