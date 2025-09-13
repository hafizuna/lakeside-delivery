import { Platform } from 'react-native';

export const testServerConnection = async () => {
  const baseUrl = Platform.OS === 'web' 
    ? 'http://localhost:3001' 
    : 'http://192.168.219.154:3001';
    
  console.log('🧪 Testing server connection...');
  console.log('📍 Platform:', Platform.OS);
  console.log('🌐 Testing URL:', baseUrl);
  
  try {
    // Test basic connection to server root
    const response = await fetch(`${baseUrl}/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Server connection successful!');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('- Response:', text);
    
    return { success: true, status: response.status, message: text };
  } catch (error: any) {
    console.log('❌ Server connection failed!');
    console.log('- Error:', error.message);
    console.log('- Error type:', error.constructor.name);
    
    if (error.message.includes('Network request failed')) {
      console.log('💡 Suggestion: Check if server is running and IP address is correct');
    }
    
    return { success: false, error: error.message };
  }
};

export const testAPIEndpoint = async () => {
  const baseUrl = Platform.OS === 'web' 
    ? 'http://localhost:3001/api' 
    : 'http://192.168.219.154:3001/api';
    
  console.log('🧪 Testing API endpoint...');
  console.log('🌐 Testing URL:', `${baseUrl}/health`);
  
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ API endpoint accessible!');
    console.log('- Status:', response.status);
    
    const data = await response.json();
    console.log('- Response:', data);
    
    return { success: true, status: response.status, data };
  } catch (error: any) {
    console.log('❌ API endpoint test failed!');
    console.log('- Error:', error.message);
    
    return { success: false, error: error.message };
  }
};
