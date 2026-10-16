const fs = require('fs');
const content = fs.readFileSync('public/images/home-logo.svg', 'utf8');
const regex = /transform="translate\(([-0-9.]+),\s*([-0-9.]+)\)"/g;
let match;
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
while ((match = regex.exec(content)) !== null) {
  const x = parseFloat(match[1]);
  const y = parseFloat(match[2]);
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
  if (y < minY) minY = y;
  if (y > maxY) maxY = y;
}
console.log('Translate range: X: [', minX, ',', maxX, '], Y: [', minY, ',', maxY, ']');
