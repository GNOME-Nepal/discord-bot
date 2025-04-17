const { loadCommands } = require('./Src/cmd/utils/commandLoader.js');

async function testCommandLoader() {
  try {
    console.log('Testing command loader...');
    const commands = await loadCommands();
    console.log('Command loading successful!');
    console.log(`Loaded ${commands.slashCommands.size} slash commands`);
    console.log(`Loaded ${commands.memberCommands.size} member commands`);
    console.log(`Loaded ${commands.contributorCommands.size} contributor commands`);
    console.log(`Loaded ${commands.maintainerCommands.size} maintainer commands`);
  } catch (error) {
    console.error('Error loading commands:', error);
  }
}

testCommandLoader();