const botanicZooApi = require('botanic-zoo-api');

async function testBotanicZooApi() {
  console.log('Testing Botanic Zoo API...');

  console.log('Trying getAnimal method with "red panda"...');
  try {
    const encodedAnimal = encodeURIComponent('red panda');
    const redPandaInfo = await botanicZooApi.getAnimal(encodedAnimal);
    console.log('Red Panda Info:', JSON.stringify(redPandaInfo, null, 2));
  } catch (error) {
    console.error('Error using getAnimal method:', error.message);
    console.log('Red Panda Info: {}');
    console.log(
      'Using fallback fact: "The red panda is a fascinating creature in the animal kingdom!"',
    );
  }

  console.log('\nTrying getAnimalOfTheDay method...');
  try {
    const animalOfTheDay = await botanicZooApi.getAnimalOfTheDay();
    console.log('Animal of the Day:', JSON.stringify(animalOfTheDay, null, 2));
  } catch (error) {
    console.error('Error using getAnimalOfTheDay method:', error.message);
    console.log('Animal of the Day: {}');
    console.log(
      'Using fallback animal of the day: "Today\'s featured animal is the lion, king of the jungle!"',
    );
  }

  console.log('\nAPI testing completed!');
}

testBotanicZooApi();
