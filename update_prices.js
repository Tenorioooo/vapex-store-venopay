const fs = require('fs');
const path = require('path');

function updatePrices(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/price:\s*([\d.]+)/g, (match, priceStr) => {
    const price = parseFloat(priceStr);
    const newPrice = (price * 1.22).toFixed(2);
    // keep it as a number if it was an integer, else float
    return `price: ${parseFloat(newPrice)}`;
  });
  
  content = content.replace(/old_price:\s*([\d.]+)/g, (match, priceStr) => {
    const price = parseFloat(priceStr);
    const newPrice = (price * 1.22).toFixed(2);
    return `old_price: ${parseFloat(newPrice)}`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

updatePrices(path.join(__dirname, 'src/data/products.ts'));
updatePrices(path.join(__dirname, 'src/data/MOCK_PRODUCTS.ts'));

