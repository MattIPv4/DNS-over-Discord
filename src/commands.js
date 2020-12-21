const fs = require('fs').promises;
const path = require('path');
const { DiscordInteractions } = require('slash-commands');

module.exports.registerCommands = async () => {
    // Define the builder
    // TODO: Investigate replacing token with https://discord.com/developers/docs/topics/oauth2#client-credentials-grant
    const interaction = new DiscordInteractions({
        applicationId: process.env.CLIENT_ID,
        authToken: process.env.CLIENT_BOT_TOKEN,
        publicKey: process.env.CLIENT_PUBLIC_KEY,
    });

    // Define the commands
    const commands = [];
    const commandDirectory = path.join(__dirname, 'commands');
    const commandFiles = await fs.readdir(commandDirectory);
    for (const commandFile of commandFiles) {
        if (!commandFile.endsWith('.js')) continue;
        const commandData = require(path.join(commandDirectory, commandFile));
        if (!('name' in commandData)) continue;
        if (!('execute' in commandData)) continue;
        commands.push(commandData);
    }

    // TODO: Fetch existing commands from Discord, only create missing ones, update outdated ones, remove old ones

    // Register the commands with Discord
    const commandData = [];
    for (const command of commands) {
        const data = await interaction.createApplicationCommand(command, '613327370807672833');
        commandData.push({ ...command, ...data });
    }

    // Done
    return commandData;
};
