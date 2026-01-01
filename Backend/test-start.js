// Test script to check if backend can start
console.log('🔍 Testing backend startup...');

try {
  // Test environment variables
  require('dotenv').config({ path: '.env.local' });
  console.log('✅ Environment variables loaded');
  
  // Test supabase client
  const { supabase } = require('./lib/supabase-client');
  console.log('✅ Supabase client loaded');
  
  // Test API modules
  const aiCredibility = require('./api/ai-credibility');
  console.log('✅ AI Credibility API loaded');
  
  const medicalReview = require('./api/medical-review');
  console.log('✅ Medical Review API loaded');
  
  const ministryIntegration = require('./api/ministry-integration');
  console.log('✅ Ministry Integration API loaded');
  
  console.log('🎉 All modules loaded successfully! Backend should start now.');
  
} catch (error) {
  console.error('❌ Error loading modules:', error.message);
  console.error('Stack:', error.stack);
}