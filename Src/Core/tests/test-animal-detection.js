const botanicZooApi = require('botanic-zoo-api');
const Table = require('cli-table3');
const animalSystem = require('../../../Event/Ubucon-asia/Guess.js');

// Sample animal names to test
const testAnimals = [
    'dog',
    'cat',
    'red panda',
    'elephant',
    'giraffe',
    'not an animal',
    'hello world',
    'computer',
    'javascript'
];

// Results array for the table
const results = [];

/**
 * Tests if a string contains an animal name
 * @param {string} text - The text to test
 */
async function testAnimalDetection(text) {
    console.log(`Testing: "${text}"`);
    
    try {
        // Use the containsAnimalKeyword function from Guess.js
        const { isAnimal, animalName } = await animalSystem.containsAnimalKeyword(text);
        
        if (isAnimal) {
            console.log(`✓ Detected animal: ${animalName}`);
            
            // Try to get animal facts
            try {
                const encodedAnimal = encodeURIComponent(animalName);
                const animalInfo = await botanicZooApi.getAnimal(encodedAnimal);
                
                // Add to results
                results.push({
                    text: text,
                    result: '✓',
                    animal: animalName,
                    api_status: Object.keys(animalInfo).length > 0 ? '✓' : '✗',
                    notes: 'Animal detected'
                });
            } catch (error) {
                // API error but animal was detected
                results.push({
                    text: text,
                    result: '✓',
                    animal: animalName,
                    api_status: '✗',
                    notes: `API error: ${error.message.substring(0, 30)}`
                });
            }
        } else {
            console.log(`✗ No animal detected`);
            
            // Add to results
            results.push({
                text: text,
                result: '✗',
                animal: 'N/A',
                api_status: 'N/A',
                notes: 'Not an animal'
            });
        }
    } catch (error) {
        console.error(`Error testing "${text}":`, error.message);
        
        // Add error to results
        results.push({
            text: text,
            result: '!',
            animal: 'ERROR',
            api_status: '!',
            notes: error.message.substring(0, 30)
        });
    }
    
    console.log('---');
}

/**
 * Display results in a formatted table
 */
function displayResults() {
    const resultsTable = new Table({
        head: ['Text', 'Is Animal', 'Animal Name', 'API Status', 'Notes'],
        colWidths: [20, 10, 15, 10, 30]
    });
    
    results.forEach(result => {
        resultsTable.push([
            result.text.substring(0, 18),
            result.result,
            result.animal,
            result.api_status,
            result.notes
        ]);
    });
    
    console.log('\n=== Animal Detection Test Results ===');
    console.log(resultsTable.toString());
    
    const detected = results.filter(r => r.result === '✓').length;
    const notDetected = results.filter(r => r.result === '✗').length;
    const errors = results.filter(r => r.result === '!').length;
    
    console.log(`Test complete: ${detected} animals detected, ${notDetected} non-animals, ${errors} errors`);
}

/**
 * Run all tests
 */
async function runTests() {
    console.log('=== Testing Animal Detection System ===');
    
    // Add containsAnimalKeyword to the exported functions if it's not already there
    if (!animalSystem.containsAnimalKeyword) {
        console.error('Error: containsAnimalKeyword function is not exported from Guess.js');
        return;
    }
    
    // Test each sample text
    for (const text of testAnimals) {
        await testAnimalDetection(text);
    }
    
    // Display results
    displayResults();
}

// Run the tests
runTests();