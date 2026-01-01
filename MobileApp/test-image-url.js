/**
 * Test if image URLs are accessible
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const testUrls = [
  'https://aadydqifnwrcbjtxanje.supabase.co/storage/v1/object/public/medical-files/6466562f-573f-4ed4-a0b9-474c58e69105/151038f1-a62c-4079-8b1f-0d8ea1ffb27d/1766978665076_jq7k0q.jpg',
  'https://aadydqifnwrcbjtxanje.supabase.co/storage/v1/object/public/medical-files/6466562f-573f-4ed4-a0b9-474c58e69105/151038f1-a62c-4079-8b1f-0d8ea1ffb27d/1766978669985_k2lupj.pdf'
]

async function testImageUrls() {
  console.log('🧪 Testing Image URLs\n')
  console.log('=' .repeat(60))

  for (const url of testUrls) {
    console.log(`\n📷 Testing: ${url.split('/').pop()}`)
    console.log(`   URL: ${url}`)

    try {
      const response = await fetch(url, {
        method: 'HEAD' // Just check headers, don't download
      })

      console.log(`   Status: ${response.status} ${response.statusText}`)
      console.log(`   Content-Type: ${response.headers.get('content-type')}`)
      console.log(`   Content-Length: ${response.headers.get('content-length')} bytes`)
      console.log(`   Cache-Control: ${response.headers.get('cache-control')}`)
      console.log(`   Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin')}`)

      if (response.ok) {
        console.log('   ✅ URL is accessible!')
      } else {
        console.log('   ❌ URL returned error status')
      }

    } catch (error) {
      console.error('   ❌ Error:', error.message)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n💡 If URLs are accessible (200 OK):')
  console.log('   - URLs work fine')
  console.log('   - Issue might be in React Native Image component')
  console.log('   - Check console logs in app for Image load errors')
  console.log('\n💡 If URLs return 403/404:')
  console.log('   - Check bucket is PUBLIC')
  console.log('   - Check file paths are correct')
  console.log('   - Check storage policies')
}

testImageUrls()
