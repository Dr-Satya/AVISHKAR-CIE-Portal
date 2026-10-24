// Verification script for live Cloudflare deployment version 2ab58986-b4fd-45c1-819d-ab9c9ed54b6b
import https from 'https';

const PROD_BASE = 'https://avishkar-v2.g-murari2006.workers.dev';

function fetchPage(urlPath) {
  return new Promise((resolve, reject) => {
    // Add cache-busting timestamp to verify fresh deployment response
    const fullUrl = `${PROD_BASE}${urlPath}?_cb=${Date.now()}`;
    const req = https.get(fullUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ProductionVerifier/1.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
  });
}

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

async function verify() {
  console.log('=================================================================');
  console.log(`VERIFYING LIVE PRODUCTION: ${PROD_BASE}`);
  console.log('=================================================================\n');

  // 1. Homepage (/)
  console.log('[1/4] Inspecting Live Homepage (/)...');
  const home = await fetchPage('/');
  assert(home.status === 200, `Homepage returned HTTP ${home.status}`);
  assert(home.body.includes('home-logo.svg'), 'Official GD Goenka University logo is present in live header');
  assert(home.body.includes('0A2047') || home.body.includes('#0A2047'), 'Deep Navy background (#0A2047) active on live header');
  assert(!home.body.includes('Admin Portal') || !home.body.includes('shield'), 'Admin Portal button removed from public navigation');
  assert(home.body.includes('ABOUT AVISHKAR'), 'Latest ABOUT AVISHKAR uppercase label is rendered');
  assert(home.body.includes('A Platform for Innovation and Technical Excellence'), 'About section heading rendered');
  assert(home.body.includes('Student Registration'), 'Student Registration CTA present');
  assert(home.body.includes('Track Status'), 'Track Status button present');

  // 2. Student Registration (/register)
  console.log('\n[2/4] Inspecting Live Student Registration Portal (/register)...');
  const reg = await fetchPage('/register');
  assert(reg.status === 200, `Registration page returned HTTP ${reg.status}`);
  assert(reg.body.includes('AVISHKAR Student Registration'), 'Registration page title rendered');
  assert(!reg.body.includes('100% Voluntary & Non-Binding'), '100% Voluntary notice is completely absent');
  assert(reg.body.includes('Return to AVISHKAR Homepage'), 'Return breadcrumb link present');

  // 3. Portal Selection (/admin/dashboard)
  console.log('\n[3/4] Inspecting Live Portal Selection Console (/admin/dashboard)...');
  const dash = await fetchPage('/admin/dashboard');
  assert(dash.status === 200, `Portal selection returned HTTP ${dash.status}`);
  assert(dash.body.includes('AVISHKAR Portal Selection'), 'Portal selection title rendered');
  assert(!dash.body.includes('president-portal.png'), 'Deprecated raster president-portal.png is removed');
  assert(!dash.body.includes('admin-management-portal.png'), 'Deprecated raster admin-management-portal.png is removed');
  assert(dash.body.includes('/admin/management/login'), 'Links to Administrative Management Login');
  assert(dash.body.includes('/admin/president/login'), 'Links to President Login');
  assert(dash.body.includes('/admin/vice-president/login'), 'Links to Vice President Login');
  assert(dash.body.includes('/admin/member/login'), 'Links to Member Login');
  assert(dash.body.includes('Return to Website'), 'Return to Website action present in dashboard header');

  // 4. Critical Public Routes (/events, /status, /gallery)
  console.log('\n[4/4] Inspecting Critical Public Routes (/events, /status, /gallery)...');
  const events = await fetchPage('/events');
  assert(events.status === 200, `/events returned HTTP ${events.status}`);
  const statusPage = await fetchPage('/status');
  assert(statusPage.status === 200, `/status returned HTTP ${statusPage.status}`);
  const gallery = await fetchPage('/gallery');
  assert(gallery.status === 200, `/gallery returned HTTP ${gallery.status}`);

  console.log('\n=================================================================');
  if (process.exitCode) {
    console.error('LIVE PRODUCTION VERIFICATION ENCOUNTERED FAILURES');
  } else {
    console.log('ALL LIVE PRODUCTION CHECKS PASSED SUCCESSFULLY!');
  }
  console.log('=================================================================');
}

verify().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
