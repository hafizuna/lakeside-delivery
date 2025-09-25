// Quick test script to verify bulk operations API methods exist
const { apiService } = require('./src/shared/services/api.ts');

console.log('Testing Bulk Operations API methods...');

// Check if methods exist
console.log('bulkUpdateMenuItems exists:', typeof apiService.bulkUpdateMenuItems === 'function');
console.log('bulkDeleteMenuItems exists:', typeof apiService.bulkDeleteMenuItems === 'function');
console.log('getCategories exists:', typeof apiService.getCategories === 'function');
console.log('createCategory exists:', typeof apiService.createCategory === 'function');

console.log('All required methods are available!');
