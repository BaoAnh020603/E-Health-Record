// Test script to verify personalized AI greetings
// Run this with: node test-personalized-ai.js

const { simplifyDoctorNotes, getDiseasePredict } = require('./services/aiMedicalAssistant');

async function testPersonalizedGreetings() {
  console.log('🧪 Testing Personalized AI Greetings...\n');

  // Test 1: Medical text simplification with user name
  console.log('1. Testing medical text simplification with personalized greeting...');
  try {
    const result = await simplifyDoctorNotes(
      'Bệnh nhân được chẩn đoán mắc hội chứng ruột kích thích với triệu chứng đau bụng tái phát và rối loạn nhu động ruột.'
    );
    
    if (result.success && result.data) {
      console.log('✅ Simplified text:', result.data.simplifiedText.substring(0, 100) + '...');
      
      // Check if greeting is included
      if (result.data.simplifiedText.includes('Xin chào')) {
        console.log('✅ Personalized greeting detected!');
      } else {
        console.log('⚠️  No personalized greeting found');
      }
    } else {
      console.log('❌ Error:', result.error);
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  console.log('\n2. Testing disease prediction with personalized greeting...');
  try {
    const result = await getDiseasePredict({
      userId: 'test-user-123',
      diseaseCode: 'J45',
      currentSymptoms: ['Khó thở', 'Ho khan', 'Đau ngực'],
      medicalHistory: {
        previousDiagnoses: [],
        chronicConditions: [],
        medications: [],
        allergies: []
      },
      lifestyle: {
        smoking: false,
        alcohol: false,
        exercise: 'moderate',
        diet: 'average'
      }
    });

    if (result.success && result.data) {
      console.log('✅ Disease prediction completed');
      
      // Check prevention advice for personalized greeting
      if (result.data.preventionAdvice && result.data.preventionAdvice.length > 0) {
        const firstAdvice = result.data.preventionAdvice[0].recommendations[0];
        if (firstAdvice && firstAdvice.includes('Xin chào')) {
          console.log('✅ Personalized greeting in prevention advice detected!');
        } else {
          console.log('⚠️  No personalized greeting in prevention advice');
        }
      }
    } else {
      console.log('❌ Error:', result.error);
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  console.log('\n🎉 Personalized AI greeting tests completed!');
  console.log('\n📝 Expected behavior:');
  console.log('- When user is logged in, AI responses should start with "Xin chào [UserName]!"');
  console.log('- When user name is not available, AI should use "Xin chào!"');
  console.log('- This applies to both medical text simplification and disease prediction');
}

// Run the test
testPersonalizedGreetings().catch(console.error);