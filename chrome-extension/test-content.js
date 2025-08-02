console.log('TEST EXTENSION: Content script loaded!');
console.log('TEST EXTENSION: Current URL:', window.location.href);

// Create a simple test element
const testDiv = document.createElement('div');
testDiv.style.cssText = `
  position: fixed;
  top: 50px;
  left: 10px;
  background: green;
  color: white;
  padding: 10px;
  z-index: 999999;
  font-size: 14px;
  border: 2px solid white;
  font-family: Arial, sans-serif;
`;
testDiv.textContent = 'TEST EXTENSION WORKING!';
document.body.appendChild(testDiv);

console.log('TEST EXTENSION: Test element created'); 