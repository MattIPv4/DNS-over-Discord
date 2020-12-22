const { ApplicationCommandOptionType } = require('slash-commands');
const { ValidTypes } = require('../utils/dns');
const { handleDig } = require('../utils/dig');

module.exports = {
    name: 'multi-dig',
    description: 'Perform a DNS over Discord lookup with multiple record types',
    options: [
        {
            name: 'domain',
            description: 'The domain to lookup',
            type: ApplicationCommandOptionType.STRING,
            required: true,
        },
        {
            name: 'types',
            description: 'Space-separated DNS record types to lookup, `*` for all types',
            type: ApplicationCommandOptionType.STRING,
            required: false,
            // TODO: https://github.com/discord/discord-api-docs/issues/2331
        },
        {
            name: 'short',
            description: 'Display the results in short form',
            type: ApplicationCommandOptionType.BOOLEAN,
            required: false,
        },
    ],
    execute: async (interaction, respond) => {
        // Get the raw values from Discord
        const rawDomain = ((interaction.data.options.find(opt => opt.name === 'domain') || {}).value || '').trim();
        const rawTypes = ((interaction.data.options.find(opt => opt.name === 'types') || {}).value || '').trim();
        const rawShort = (interaction.data.options.find(opt => opt.name === 'short') || {}).value || false;

        // Parse domain input
        // TODO: Validate domain
        const domain = rawDomain;

        // Parse types input, mapping '*' to all records and defaulting to 'A' if none given
        const types = rawTypes === '*'
            ? ValidTypes
            : rawTypes.split(' ').map(x => x.trim().toUpperCase()).filter(x => ValidTypes.includes(x));
        if (!types.length) types.push('A');

        // Go!
        await handleDig(interaction, respond, domain, types, rawShort);
    },
};
