const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration
const SAMPLE_SIZE = 300000;
const PROPERTIES_FILE = 'data/land-registry-sales-cleaned.csv';
const EPC_FILE = 'data/epc-certificates-cleaned.csv';
const RESULTS_FILE = 'uid-matching-results-large-scale.json';

console.log('🚀 Starting Large-Scale UID Matching Test');
console.log(`📊 Testing ${SAMPLE_SIZE.toLocaleString()} properties`);

// Helper function to generate UID
function generateUID(property) {
    const number = (property.property_number || property.house_number || '').toString().toLowerCase().trim();
    const street = (property.street || property.street_name || '').toLowerCase().trim();
    const postcode = (property.postcode || '').toLowerCase().trim();
    
    // Clean and normalize components
    const cleanNumber = number.replace(/[^a-z0-9]/g, '');
    const cleanStreet = street.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    const cleanPostcode = postcode.replace(/\s+/g, '').toLowerCase();
    
    return `${cleanNumber}-${cleanStreet}-${cleanPostcode}`;
}

// Load and sample properties data
async function loadPropertiesSample() {
    console.log('📖 Loading properties data...');
    const properties = [];
    let count = 0;
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(PROPERTIES_FILE)
            .pipe(csv())
            .on('data', (row) => {
                if (count < SAMPLE_SIZE) {
                    properties.push({
                        ...row,
                        uid: generateUID(row)
                    });
                    count++;
                }
            })
            .on('end', () => {
                console.log(`✅ Loaded ${properties.length.toLocaleString()} properties`);
                resolve(properties);
            })
            .on('error', reject);
    });
}

// Load EPC data
async function loadEPCData() {
    console.log('📖 Loading EPC data...');
    const epcData = [];
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(EPC_FILE)
            .pipe(csv())
            .on('data', (row) => {
                epcData.push({
                    ...row,
                    uid: generateUID(row)
                });
            })
            .on('end', () => {
                console.log(`✅ Loaded ${epcData.length.toLocaleString()} EPC records`);
                resolve(epcData);
            })
            .on('error', reject);
    });
}

// Create UID index for fast lookup
function createUIDIndex(data) {
    const index = new Map();
    data.forEach(item => {
        if (item.uid) {
            if (!index.has(item.uid)) {
                index.set(item.uid, []);
            }
            index.get(item.uid).push(item);
        }
    });
    return index;
}

// Test matching accuracy
function testMatchingAccuracy(properties, epcIndex) {
    console.log('🔍 Testing matching accuracy...');
    
    let exactMatches = 0;
    let partialMatches = 0;
    let noMatches = 0;
    const matchDetails = [];
    
    properties.forEach((property, index) => {
        if (index % 10000 === 0) {
            console.log(`  Processed ${index.toLocaleString()} properties...`);
        }
        
        const exactMatch = epcIndex.get(property.uid);
        
        if (exactMatch && exactMatch.length > 0) {
            exactMatches++;
            matchDetails.push({
                property: property,
                match: exactMatch[0],
                matchType: 'exact',
                uid: property.uid
            });
        } else {
            // Try partial matching (postcode + street)
            const postcode = property.postcode?.replace(/\s+/g, '').toLowerCase();
            const street = property.street?.toLowerCase().trim();
            
            let foundPartial = false;
            for (const [epcUid, epcRecords] of epcIndex) {
                const epcPostcode = epcRecords[0].postcode?.replace(/\s+/g, '').toLowerCase();
                const epcStreet = epcRecords[0].street?.toLowerCase().trim();
                
                if (postcode === epcPostcode && street === epcStreet) {
                    partialMatches++;
                    foundPartial = true;
                    matchDetails.push({
                        property: property,
                        match: epcRecords[0],
                        matchType: 'partial',
                        uid: property.uid,
                        epcUid: epcUid
                    });
                    break;
                }
            }
            
            if (!foundPartial) {
                noMatches++;
            }
        }
    });
    
    return {
        exactMatches,
        partialMatches,
        noMatches,
        total: properties.length,
        matchDetails
    };
}

// Analyze match quality
function analyzeMatchQuality(results) {
    console.log('📊 Analyzing match quality...');
    
    const qualityAnalysis = {
        exactMatchRate: (results.exactMatches / results.total * 100).toFixed(2),
        partialMatchRate: (results.partialMatches / results.total * 100).toFixed(2),
        totalMatchRate: ((results.exactMatches + results.partialMatches) / results.total * 100).toFixed(2),
        noMatchRate: (results.noMatches / results.total * 100).toFixed(2)
    };
    
    // Analyze UID patterns
    const uidPatterns = {};
    results.matchDetails.forEach(detail => {
        const uid = detail.uid;
        if (!uidPatterns[uid]) {
            uidPatterns[uid] = 0;
        }
        uidPatterns[uid]++;
    });
    
    const duplicateUIDs = Object.values(uidPatterns).filter(count => count > 1).length;
    
    return {
        ...qualityAnalysis,
        duplicateUIDs,
        uniqueUIDs: Object.keys(uidPatterns).length
    };
}

// Main test execution
async function runLargeScaleTest() {
    try {
        const startTime = Date.now();
        
        // Load data
        const properties = await loadPropertiesSample();
        const epcData = await loadEPCData();
        
        // Create EPC index
        console.log('🔍 Creating EPC index...');
        const epcIndex = createUIDIndex(epcData);
        
        // Test matching
        const results = testMatchingAccuracy(properties, epcIndex);
        
        // Analyze results
        const analysis = analyzeMatchQuality(results);
        
        // Save results
        const testResults = {
            timestamp: new Date().toISOString(),
            sampleSize: SAMPLE_SIZE,
            propertiesLoaded: properties.length,
            epcRecordsLoaded: epcData.length,
            results,
            analysis,
            executionTime: Date.now() - startTime
        };
        
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(testResults, null, 2));
        
        // Display results
        console.log('\n🎯 LARGE-SCALE UID MATCHING RESULTS');
        console.log('=====================================');
        console.log(`📊 Sample Size: ${SAMPLE_SIZE.toLocaleString()} properties`);
        console.log(`📊 EPC Records: ${epcData.length.toLocaleString()}`);
        console.log(`⏱️  Execution Time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
        console.log('');
        console.log('📈 MATCHING ACCURACY:');
        console.log(`  ✅ Exact Matches: ${results.exactMatches.toLocaleString()} (${analysis.exactMatchRate}%)`);
        console.log(`  🔍 Partial Matches: ${results.partialMatches.toLocaleString()} (${analysis.partialMatchRate}%)`);
        console.log(`  ❌ No Matches: ${results.noMatches.toLocaleString()} (${analysis.noMatchRate}%)`);
        console.log(`  🎯 Total Match Rate: ${analysis.totalMatchRate}%`);
        console.log('');
        console.log('🔍 UID ANALYSIS:');
        console.log(`  🆔 Unique UIDs: ${analysis.uniqueUIDs.toLocaleString()}`);
        console.log(`  🔄 Duplicate UIDs: ${analysis.duplicateUIDs.toLocaleString()}`);
        console.log('');
        console.log(`💾 Results saved to: ${RESULTS_FILE}`);
        
        return testResults;
        
    } catch (error) {
        console.error('❌ Error in large-scale test:', error);
        throw error;
    }
}

// Run the test
if (require.main === module) {
    runLargeScaleTest()
        .then(() => {
            console.log('\n✅ Large-scale UID matching test completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { runLargeScaleTest }; 