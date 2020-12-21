const { ApplicationCommandOptionType, InteractionResponseType } = require('slash-commands');
const { performLookup, ValidTypes, presentData } = require('../utils/dns');

module.exports = {
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
    execute: async (data, respond) => {
        const rawDomain = ((data.options.find(opt => opt.name === 'domain') || {}).value || '').trim();
        const rawTypes = ((data.options.find(opt => opt.name === 'types') || {}).value || '').trim();

        // Parse domain input
        // TODO: Validate domain
        const domain = rawDomain;

        // Parse types input, mapping '*' to all records and defaulting to 'A' if none given
        const types = rawTypes === '*'
            ? ValidTypes
            : rawTypes.split(' ').map(x => x.trim().toUpperCase()).filter(x => ValidTypes.includes(x));
        if (!types.length) types.push('A');

        // Make the DNS queries
        const results = [];
        for (const type of types)
            results.push({
                type,
                data: await performLookup(domain, type),
            });

        // Convert results to embed fields
        // TODO: Truncate field values to 1024 chars
        const fields = results.map(({ type, data }) => ({
            name: `${type} records`,
            value: `\`\`\`\n${presentData(data)}\n\`\`\``,
            inline: false,
        }));

        // Respond
        respond({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [{
                    title: 'DNS over Discord',
                    color: 0xf48120,
                    timestamp: (new Date).toISOString(),
                    footer: {
                        text: 'diggy diggy hole',
                    },
                    fields,
                }],
            },
        });
    },
};
