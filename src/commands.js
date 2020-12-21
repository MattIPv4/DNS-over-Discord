const { DiscordInteractions, ApplicationCommandOptionType, InteractionResponseType } = require('slash-commands');

module.exports.registerCommands = async () => {
    // Define the builder
    const interaction = new DiscordInteractions({
        applicationId: process.env.CLIENT_ID,
        authToken: process.env.CLIENT_BOT_TOKEN,
        publicKey: process.env.CLIENT_PUBLIC_KEY,
    });

    // Define the commands
    const commands = [{
        name: 'dig',
        description: 'Perform a DNS over Discord lookup',
        options: [
            {
                name: 'domain',
                description: 'The domain to lookup',
                type: ApplicationCommandOptionType.STRING,
                required: true,
            },
            {
                name: 'types',
                description: 'Space-separated DNS record types to lookup',
                type: ApplicationCommandOptionType.STRING,
                required: false,
                // TODO: https://github.com/discord/discord-api-docs/issues/2331
            },
        ],
        execute: (data, respond) => {
            const domain = data.options.find(opt => opt.name === 'domain') || {};
            const types = data.options.find(opt => opt.name === 'types') || {};

            respond({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: `Diggy diggy hole ${domain.value} ${types.value}`,
                },
            });
        },
    }];

    // Register the commands with Discord
    const commandData = [];
    for (const command of commands) {
        const data = await interaction.createApplicationCommand(command, '613327370807672833');
        commandData.push({ ...command, ...data });
    }

    // Done
    return commandData;
};
