// Quick local route verification script
import http from 'http';

function probe(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://[::1]:3001${urlPath}`, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

async function run() {
  console.log('Testing local server on http://127.0.0.1:3001...');
  const paths = ['/', '/register', '/admin/dashboard'];
  for (const p of paths) {
    try {
      const res = await probe(p);
      console.log(`Path: ${p} | Status: ${res.status} | Length: ${res.data.length}`);
      if (p === '/') {
        console.log('  Includes home-logo.svg:', res.data.includes('home-logo.svg'));
        console.log('  Includes ABOUT AVISHKAR:', res.data.includes('ABOUT AVISHKAR'));
        console.log('  Includes Navy #0A2047:', res.data.includes('0A2047'));
      }
      if (p === '/register') {
        console.log('  Includes AVISHKAR Student Registration:', res.data.includes('AVISHKAR Student Registration'));
      }
      if (p === '/admin/dashboard') {
        console.log('  Includes AVISHKAR Portal Selection:', res.data.includes('AVISHKAR Portal Selection'));
        console.log('  Clean vector SVG icons (no raster png):', !res.data.includes('president-portal.png') && !res.data.includes('admin-management-portal.png'));
      }
    } catch (err) {
      console.error(`Error requesting ${p}:`, err.message);
    }
  }
}

run();
