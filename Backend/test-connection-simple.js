/**
 * Simple Connection Test
 * Test if server is accessible
 */

const http = require('http');

const testUrls = [
  'http://localhost:3001/api/prescription/health',
  'http://192.168.1.172:3001/api/prescription/health'
];

console.log('🧪 TESTING SERVER CONNECTION\n');
console.log('='.repeat(70));

async function testConnection(url) {
  return new Promise((resolve) => {
    console.log(`\n📡 Testing: ${url}`);
    
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success && result.status === 'running') {
            console.log('✅ SUCCESS - Server is running!');
            console.log(`   Status: ${result.status}`);
            console.log(`   Service: ${result.service}`);
            resolve(true);
          } else {
            console.log('⚠️  WARNING - Unexpected response');
            console.log(`   Response: ${data}`);
            resolve(false);
          }
        } catch (error) {
          console.log('❌ ERROR - Invalid JSON response');
          console.log(`   Response: ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ ERROR - Connection failed');
      console.log(`   Error: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ ERROR - Connection timeout');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function runTests() {
  let successCount = 0;
  
  for (const url of testUrls) {
    const success = await testConnection(url);
    if (success) successCount++;
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 RESULTS: ${successCount}/${testUrls.length} tests passed\n`);
  
  if (successCount === 0) {
    console.log('❌ Server is not accessible!');
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('   1. Make sure server is running: node server.js');
    console.log('   2. Check if port 3001 is available');
    console.log('   3. Check firewall settings');
    console.log('   4. Try: http://localhost:3001/api/prescription/health in browser');
  } else if (successCount < testUrls.length) {
    console.log('⚠️  Some URLs are not accessible');
    console.log('\n💡 FOR MOBILE APP:');
    console.log('   - If using Android Emulator: Use http://10.0.2.2:3001');
    console.log('   - If using iOS Simulator: Use http://localhost:3001');
    console.log('   - If using Physical Device: Use http://192.168.1.172:3001');
    console.log('   - Make sure device is on same WiFi network');
  } else {
    console.log('✅ All tests passed! Server is accessible.');
  }
  
  console.log('');
}

runTests();
