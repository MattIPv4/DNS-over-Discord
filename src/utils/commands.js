const fs = require('fs');
const path = require('path');
const { DiscordInteractions } = require('slash-commands');

const getCommands = module.exports.getCommands = () => {
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
        commands.push(commandData);
    }

    return commands;
};

module.exports.registerCommands = async () => {
    // Define the builder
    // TODO: Investigate replacing token with https://discord.com/developers/docs/topics/oauth2#client-credentials-grant
    const interaction = new DiscordInteractions({
        applicationId: process.env.CLIENT_ID,
        authToken: process.env.CLIENT_BOT_TOKEN,
        publicKey: process.env.CLIENT_PUBLIC_KEY,
    });

    // Define the commands
    const commands = getCommands();

    // TODO: Fetch existing commands from Discord, only create missing ones, update outdated ones, remove old ones

    // Register the commands with Discord
    const commandData = [];
    for (const command of commands) {
        const data = await interaction.createApplicationCommand(command, process.env.TEST_GUILD_ID);
        commandData.push({ ...command, ...data });
    }

    // Done
    return commandData;
};

const optSignature = module.exports.optSignature = opt =>
    `${opt.required ? '<' : '['}${opt.name}${opt.required ? '>' : ']'}`;

const cmdSignature = module.exports.cmdSignature = cmd =>
    `/${cmd.name} ${(cmd.options || []).map(optSignature).join(' ')}`.trim();

const optExplainer = opt =>
    `${optSignature(opt)}:\n  ${opt.description}\n\n  ${(opt.help || '').replace(/\n/g, '\n  ')}`.trim();

const optsExplainer = opts =>
    (opts || []).map(optExplainer).join('\n\n').trim();

module.exports.cmdExplainer = cmd =>
    `${cmdSignature(cmd)}\n\n${cmd.description}\n\n${optsExplainer(cmd.options)}`.trim();
