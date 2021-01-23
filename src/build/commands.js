const fs = require('fs');
const path = require('path');
const equal = require('deep-equal');
const { DiscordInteractions } = require('slash-commands');
const { grantToken } = require('./token');

const consistentCommandOption = obj => ({
    type: obj.type,
    name: obj.name,
    description: obj.description,
    default: !!obj.default,
    required: !!obj.required,
    choices: obj.choices || [],
    options: obj.options || [],
});

const updatedCommandProps = (oldCmd, newCmd) => ({
    name: oldCmd.name !== newCmd.name,
    description: oldCmd.description !== newCmd.description,
    options: !equal(
        oldCmd.options && oldCmd.options.map(consistentCommandOption),
        newCmd.options && newCmd.options.map(consistentCommandOption),
    ),
});

const updatedCommandPatch = (cmd, diff) => Object.keys(cmd)
    .filter(key => key in diff && diff[key])
    .reduce((obj, key) => {
        obj[key] = cmd[key];
        return obj;
    }, {});

module.exports.getCommands = () => {
    const commands = [];

    // Get all files in the commands directory
    const commandDirectory = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandDirectory);

    // Work through each file
    for (const commandFile of commandFiles) {
        // Load the file in if JS
        if (!commandFile.endsWith('.js')) continue;
        const commandData = require(path.join(commandDirectory, commandFile));

        // Validate it is a command
        if (!('name' in commandData)) continue;
        if (!('execute' in commandData)) continue;

        // Remove execute for storing and add file
        delete commandData.execute;
        commandData.file = commandFile;

        // Store
        commands.push(commandData);
    }

    return commands;
};

module.exports.registerCommands = async commands => {
    // Get a token to talk to Discord
    const token = await grantToken();

    // Define the builder
    const interaction = new DiscordInteractions({
        applicationId: process.env.CLIENT_ID,
        authToken: token.access_token,
        tokenPrefix: token.token_type,
        publicKey: process.env.CLIENT_PUBLIC_KEY,
    });

    // Define the commands and get what Discord currently has
    const discordCommands = await interaction.getApplicationCommands(process.env.TEST_GUILD_ID);

    // Remove old commands
    for (const command of discordCommands) {
        if (commands.find(cmd => cmd.name === command.name)) continue;
        await interaction.deleteApplicationCommand(command.id, process.env.TEST_GUILD_ID);
    }

    // Register or update the commands with Discord
    const commandData = [];
    for (const command of commands) {
        // This command already exists in Discord
        const discordCommand = discordCommands.find(cmd => cmd.name === command.name);
        if (discordCommand) {
            // Get which props have changed
            const cmdDiff = updatedCommandProps(discordCommand, command);

            // Only patch if a prop has changed
            if (Object.values(cmdDiff).includes(true)) {
                // Get the props to patch and do the update
                const cmdPatch = updatedCommandPatch(command, cmdDiff);
                const data = await interaction.editApplicationCommand(discordCommand.id, cmdPatch, process.env.TEST_GUILD_ID);
                commandData.push({ ...command, ...data });
                continue;
            }

            // Store the existing command, nothing changed
            commandData.push({ ...command });
            continue;
        }

        // Register the new command
        const data = await interaction.createApplicationCommand(command, process.env.TEST_GUILD_ID);
        commandData.push({ ...command, ...data });
    }

    // Done
    return commandData;
};
