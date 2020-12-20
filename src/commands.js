const { DiscordInteractions, ApplicationCommandOptionType } = require('slash-commands');

const main = async () => {
    const interaction = new DiscordInteractions({
        applicationId: process.env.CLIENT_ID,
        authToken: process.env.CLIENT_BOT_TOKEN,
        publicKey: process.env.CLIENT_PUBLIC_KEY,
    });

    const command = {
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
                description: 'The record types to lookup',
                type: ApplicationCommandOptionType.STRING,
                required: false,
                // TODO: This needs https://github.com/discord/discord-api-docs/issues/2331
                choices: [
                    {
                        name: 'A',
                        value: 'A',
                    },
                    {
                        name: 'AAAA',
                        value: 'AAAA',
                    },
                ],
            },
        ],
    };

    await interaction
        .createApplicationCommand(command, '613327370807672833')
        .then(console.log)
        .catch(console.error);
};

main().then(() => {});
