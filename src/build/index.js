const path = require('path');
const fs = require('fs').promises;

const { getCommands, registerCommands } = require('./commands');

const mkdirSafe = dirPath => fs.access(dirPath).catch(() => fs.mkdir(dirPath, {
    recursive: true
}));

module.exports = async () => {
    // Create the output directory
    await mkdirSafe(path.join(__dirname, 'data'));

    /*
     * Export empty commands as JSON
     * This is so the help command doesn't error
     */
    await fs.writeFile(path.join(__dirname, 'data', 'commands.json'), JSON.stringify({}, null, 2));

    // Get all our local commands
    const commands = getCommands();

    // Register the commands with Discord
    const discordCommands = await registerCommands(commands);

    /*
     * Export the Discord commands as JSON
     * Mapped to be keyed by their API ID
     */
    const discordCommandsObj = discordCommands.reduce((obj, cmd) => {
        obj[cmd.id] = cmd;
        return obj;
    }, {});

    await fs.writeFile(path
        .join(__dirname, 'data', 'commands.json'), JSON.stringify(discordCommandsObj, null, 2));

    // Done
    console.log('Commands data ready to go!');
};
