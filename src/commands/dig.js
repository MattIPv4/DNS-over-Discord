const { ApplicationCommandOptionType, } = require('slash-commands');
const { VALID_TYPES } = require('../utils/dns');
const { validateDomain, handleDig } = require('../utils/dig');

const optionTypes = VALID_TYPES.slice(0, 25); // Discord has a limit of 25 options

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
            name: 'type',
            description: 'DNS record type to lookup',
            help: `Supported types:\n${optionTypes.map(type => `  ${type}`).join('\n')}\n\nDefaults to \`A\` records.`,
            type: ApplicationCommandOptionType.STRING,
            required: false,
            choices: optionTypes.map(type => ({
                name: `${type} records`,
                value: type,
            })),
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
        const rawType = ((interaction.data.options.find(opt => opt.name === 'type') || {}).value || '').trim();
        const rawShort = (interaction.data.options.find(opt => opt.name === 'short') || {}).value || false;

        // Parse domain input, return any error response
        const { domain, error } = validateDomain(rawDomain, response);
        if (error) return await error;

        // Validate type, fallback to 'A'
        const type = VALID_TYPES.includes(rawType) ? rawType : 'A';

        // Go!
        return await handleDig({ interaction, response, wait, domain, types: [type], short: rawShort, sentry });
    },
};
