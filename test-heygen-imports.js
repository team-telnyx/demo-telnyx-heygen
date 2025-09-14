// Test file to debug Heygen imports
console.log('Testing Heygen imports...');

// Try to inspect the module
try {
  const heygenModule = require('@heygen/streaming-avatar');
  console.log('Module loaded via require:', typeof heygenModule);
  console.log('Module keys:', Object.keys(heygenModule));
  console.log('Default export:', typeof heygenModule.default);
} catch (error) {
  console.error('Error with require:', error.message);
}

// Try import syntax
import('@heygen/streaming-avatar').then(module => {
  console.log('Module loaded via import():', typeof module);
  console.log('Module keys:', Object.keys(module));
  console.log('Default export:', typeof module.default);
  console.log('StreamingAvatar:', typeof module.StreamingAvatar);
  console.log('AvatarQuality:', typeof module.AvatarQuality);
}).catch(error => {
  console.error('Error with import():', error.message);
});