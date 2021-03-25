const { ApplicationCommandOptionType } = require('slash-commands');
const { VALID_TYPES } = require('../utils/dns');
const { validateDomain, handleDig } = require('../utils/dig');

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
            help: `Supported types:\n${VALID_TYPES.slice(0).sort().map(type => `  ${type}`).join('\n')}\n\nUse \`*\` to lookup all types.`,
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
    execute: async ({ interaction, response, wait, sentry }) => {
        // Get the raw values from Discord
        const rawDomain = ((interaction.data.options.find(opt => opt.name === 'domain') || {}).value || '').trim();
        const rawTypes = ((interaction.data.options.find(opt => opt.name === 'types') || {}).value || '').trim();
        const rawShort = (interaction.data.options.find(opt => opt.name === 'short') || {}).value || false;

        // Parse domain input, return any error response
        const { domain, error } = validateDomain(rawDomain, response);
        if (error) return await error;

        // Parse types input, mapping '*' to all records and defaulting to 'A' if none given
        const types = rawTypes === '*'
            ? VALID_TYPES
            : rawTypes.split(' ').map(x => x.trim().toUpperCase()).filter(x => VALID_TYPES.includes(x));
        if (!types.length) types.push('A');

        // Go!
        return await handleDig({ interaction, response, wait, domain, types, short: rawShort, sentry });
    },
};
