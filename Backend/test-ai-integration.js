// Test script for AI integration
// Run with: node test-ai-integration.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function testAIIntegration() {
  console.log('🤖 Testing AI Integration...\n');
  
  // Check environment variables
  console.log('Environment Configuration:');
  console.log('- AI_PROVIDER:', process.env.AI_PROVIDER);
  console.log('- AI_MODEL:', process.env.AI_MODEL);
  console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('');
  
  if (process.env.AI_PROVIDER === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ OpenAI API key not found in .env.local');
      return;
    }
    
    try {
      console.log('Testing OpenAI connection...');
      const OpenAI = require('openai');
      
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      
      // Test simple completion
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Use cheaper model for testing
        messages: [
          {
            role: 'user',
            content: 'Say "Hello from OpenAI!" if you can read this.'
          }
        ],
        max_tokens: 50
      });
      
      console.log('✅ OpenAI connection successful!');
      console.log('Response:', response.choices[0].message.content);
      console.log('');
      
      // Test medical simplification
      console.log('Testing medical text simplification...');
      const medicalResponse = await openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a medical translator. Convert technical medical text to simple language for patients. Respond in Vietnamese.'
          },
          {
            role: 'user',
            content: 'Simplify this: "Patient diagnosed with acute myocardial infarction with ST-segment elevation."'
          }
        ],
        max_tokens: 200
      });
      
      console.log('✅ Medical simplification test successful!');
      console.log('Simplified text:', medicalResponse.choices[0].message.content);
      console.log('');
      
      console.log('🎉 All tests passed! Your AI integration is working correctly.');
      console.log('');
      console.log('Next steps:');
      console.log('1. Run your mobile app: cd MobileApp && npm start');
      console.log('2. Test the AI features in the app');
      console.log('3. Create the database table in Supabase (see ai_predictions_table.sql)');
      
    } catch (error) {
      console.log('❌ OpenAI test failed:', error.message);
      
      if (error.message.includes('API key')) {
        console.log('');
        console.log('💡 Possible solutions:');
        console.log('- Check your API key in .env.local');
        console.log('- Verify the key is active at https://platform.openai.com/api-keys');
        console.log('- Make sure you have credits in your OpenAI account');
      }
    }
  } else {
    console.log('ℹ️  Using mock AI (AI_PROVIDER=' + process.env.AI_PROVIDER + ')');
    console.log('✅ Mock AI is always available for testing');
    console.log('');
    console.log('To use real AI:');
    console.log('1. Set AI_PROVIDER=openai in .env.local');
    console.log('2. Add your OpenAI API key');
    console.log('3. Run this test again');
  }
}

testAIIntegration().catch(console.error);