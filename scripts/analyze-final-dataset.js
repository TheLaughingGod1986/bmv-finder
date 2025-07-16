const fs = require('fs');
const csv = require('csv-parser');

async function analyzeFinalDataset() {
  console.log('📊 Analyzing final unified dataset...');
  
  const data = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream('data/aligned-2006-final/unified-sample-final.csv')
      .pipe(csv())
      .on('data', (row) => {
        data.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log(`📈 Total properties: ${data.length.toLocaleString()}`);
  
  // EPC data analysis
  const withEPC = data.filter(row => row.bedrooms && row.bedrooms !== '');
  const withoutEPC = data.filter(row => !row.bedrooms || row.bedrooms === '');
  
  console.log(`\n🏠 EPC Data Coverage:`);
  console.log(`   With EPC data: ${withEPC.length} (${(withEPC.length/data.length*100).toFixed(1)}%)`);
  console.log(`   Without EPC data: ${withoutEPC.length} (${(withoutEPC.length/data.length*100).toFixed(1)}%)`);
  
  // Bedroom distribution
  const bedroomCounts = {};
  withEPC.forEach(row => {
    const bedrooms = parseInt(row.bedrooms);
    if (!isNaN(bedrooms)) {
      bedroomCounts[bedrooms] = (bedroomCounts[bedrooms] || 0) + 1;
    }
  });
  
  console.log(`\n🛏️ Bedroom Distribution:`);
  Object.keys(bedroomCounts).sort((a, b) => parseInt(a) - parseInt(b)).forEach(bedrooms => {
    console.log(`   ${bedrooms} bedrooms: ${bedroomCounts[bedrooms]} properties`);
  });
  
  // Property size analysis
  const withSize = withEPC.filter(row => row.property_size && row.property_size !== '');
  const sizeStats = withSize.map(row => parseFloat(row.property_size)).filter(size => !isNaN(size));
  
  if (sizeStats.length > 0) {
    const avgSize = sizeStats.reduce((a, b) => a + b, 0) / sizeStats.length;
    const minSize = Math.min(...sizeStats);
    const maxSize = Math.max(...sizeStats);
    
    console.log(`\n📏 Property Size (${sizeStats.length} properties):`);
    console.log(`   Average: ${avgSize.toFixed(1)} m²`);
    console.log(`   Range: ${minSize} - ${maxSize} m²`);
  }
  
  // EPC ratings
  const ratingCounts = {};
  withEPC.forEach(row => {
    const rating = row.epc_rating;
    if (rating && rating !== '') {
      ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
    }
  });
  
  console.log(`\n⚡ EPC Ratings:`);
  Object.keys(ratingCounts).sort().forEach(rating => {
    console.log(`   ${rating}: ${ratingCounts[rating]} properties`);
  });
  
  // Price analysis
  const prices = data.map(row => parseInt(row.price)).filter(price => !isNaN(price));
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  console.log(`\n💰 Price Analysis:`);
  console.log(`   Average: £${avgPrice.toLocaleString()}`);
  console.log(`   Range: £${minPrice.toLocaleString()} - £${maxPrice.toLocaleString()}`);
  
  // Sample properties with full data
  const fullDataProperties = withEPC.filter(row => 
    row.bedrooms && row.property_size && row.epc_rating && row.energy_consumption
  );
  
  console.log(`\n✅ Properties with complete data: ${fullDataProperties.length} (${(fullDataProperties.length/data.length*100).toFixed(1)}%)`);
  
  if (fullDataProperties.length > 0) {
    console.log(`\n📋 Sample Properties with Complete Data:`);
    fullDataProperties.slice(0, 5).forEach((row, i) => {
      console.log(`${i+1}. ${row.paon} ${row.street}, ${row.postcode}`);
      console.log(`   Price: £${parseInt(row.price).toLocaleString()}`);
      console.log(`   Bedrooms: ${row.bedrooms}, Size: ${row.property_size}m²`);
      console.log(`   EPC: ${row.epc_rating}, Energy: ${row.energy_consumption} kWh/m²/year`);
      console.log(`   Heating Cost: £${row.heating_cost}/year`);
      console.log(`   HPI Value: ${row.hpi_value}`);
      console.log('');
    });
  }
  
  console.log('🎉 Analysis complete! The unified dataset is ready for Elasticsearch indexing.');
}

analyzeFinalDataset().catch(console.error); 