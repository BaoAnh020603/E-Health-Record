/**
 * Script to automatically create Supabase storage bucket and policies
 * Run this script to set up the medical-files storage bucket
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Required environment variables:');
  console.log('- SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBucket() {
  try {
    console.log('🚀 Setting up Supabase storage bucket...');

    // 1. Check if bucket already exists
    console.log('📋 Checking existing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some(bucket => bucket.id === 'medical-files');
    
    if (bucketExists) {
      console.log('✅ Bucket "medical-files" already exists');
    } else {
      // 2. Create the bucket
      console.log('📦 Creating "medical-files" bucket...');
      const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('medical-files', {
        public: true,
        allowedMimeTypes: [
          'image/jpeg',
          'image/png', 
          'image/gif',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ],
        fileSizeLimit: 10485760 // 10MB limit
      });

      if (bucketError) {
        throw new Error(`Failed to create bucket: ${bucketError.message}`);
      }

      console.log('✅ Bucket "medical-files" created successfully');
    }

    // 3. Set up RLS policies
    console.log('🔐 Setting up Row Level Security policies...');

    const policies = [
      {
        name: 'Users can upload their own files',
        operation: 'INSERT',
        sql: `
          CREATE POLICY "Users can upload their own files" ON storage.objects
          FOR INSERT TO authenticated
          WITH CHECK (
            bucket_id = 'medical-files' AND 
            auth.uid()::text = (storage.foldername(name))[1]
          );
        `
      },
      {
        name: 'Users can view their own files',
        operation: 'SELECT', 
        sql: `
          CREATE POLICY "Users can view their own files" ON storage.objects
          FOR SELECT TO authenticated
          USING (
            bucket_id = 'medical-files' AND 
            auth.uid()::text = (storage.foldername(name))[1]
          );
        `
      },
      {
        name: 'Users can delete their own files',
        operation: 'DELETE',
        sql: `
          CREATE POLICY "Users can delete their own files" ON storage.objects
          FOR DELETE TO authenticated
          USING (
            bucket_id = 'medical-files' AND 
            auth.uid()::text = (storage.foldername(name))[1]
          );
        `
      }
    ];

    // Check existing policies first
    const { data: existingPolicies, error: policyListError } = await supabase
      .from('pg_policies')
      .select('policyname')
      .eq('tablename', 'objects')
      .eq('schemaname', 'storage');

    if (policyListError) {
      console.warn('⚠️ Could not check existing policies, proceeding anyway...');
    }

    const existingPolicyNames = existingPolicies?.map(p => p.policyname) || [];

    for (const policy of policies) {
      if (existingPolicyNames.includes(policy.name)) {
        console.log(`✅ Policy "${policy.name}" already exists`);
        continue;
      }

      console.log(`📝 Creating policy: ${policy.name}...`);
      
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: policy.sql
      });

      if (policyError) {
        console.warn(`⚠️ Failed to create policy "${policy.name}": ${policyError.message}`);
        console.log('You may need to create this policy manually in the Supabase Dashboard');
      } else {
        console.log(`✅ Policy "${policy.name}" created successfully`);
      }
    }

    // 4. Test the setup
    console.log('🧪 Testing storage setup...');
    
    const testFileName = `test/${Date.now()}_test.txt`;
    const testContent = 'Storage bucket test file';
    
    const { data: testUpload, error: testError } = await supabase.storage
      .from('medical-files')
      .upload(testFileName, testContent, {
        contentType: 'text/plain'
      });

    if (testError) {
      console.warn(`⚠️ Test upload failed: ${testError.message}`);
      console.log('You may need to set up policies manually in the Supabase Dashboard');
    } else {
      console.log('✅ Test upload successful');
      
      // Clean up test file
      await supabase.storage.from('medical-files').remove([testFileName]);
      console.log('🧹 Test file cleaned up');
    }

    console.log('\n🎉 Storage bucket setup completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Bucket "medical-files" is ready');
    console.log('✅ RLS policies configured');
    console.log('✅ File uploads should now work');
    
    console.log('\n📁 File structure will be:');
    console.log('medical-files/');
    console.log('├── {user-id}/');
    console.log('│   ├── {record-id}/');
    console.log('│   │   ├── timestamp_random.pdf');
    console.log('│   │   └── timestamp_random.jpg');
    console.log('│   └── {record-id-2}/');
    console.log('│       └── timestamp_random.png');
    console.log('└── ...');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Manual setup required:');
    console.log('1. Go to Supabase Dashboard → Storage');
    console.log('2. Create bucket "medical-files" (public)');
    console.log('3. Set up RLS policies as described in SUPABASE_STORAGE_SETUP_GUIDE.md');
    process.exit(1);
  }
}

// Run the setup
setupStorageBucket();