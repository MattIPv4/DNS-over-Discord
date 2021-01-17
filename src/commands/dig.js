const { ApplicationCommandOptionType } = require('slash-commands');
const { VALID_TYPES, POPULAR_TYPES } = require('../utils/dns');
const { handleDig } = require('../utils/dig');

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
            help: `Supported types:\n${POPULAR_TYPES.map(type => `  ${type}`).join('\n')}\n\nDefaults to \`A\` records.`,
            type: ApplicationCommandOptionType.STRING,
            required: false,
            choices: POPULAR_TYPES.map(type => ({
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
    execute: async ({ interaction, response, wait }) => {
        // Get the raw values from Discord
        const rawDomain = ((interaction.data.options.find(opt => opt.name === 'domain') || {}).value || '').trim();
        const rawType = ((interaction.data.options.find(opt => opt.name === 'type') || {}).value || '').trim();
        const rawShort = (interaction.data.options.find(opt => opt.name === 'short') || {}).value || false;

        // Parse domain input
        // TODO: Validate domain
        const domain = rawDomain;

        // Validate type, fallback to 'A'
        const type = VALID_TYPES.includes(rawType) ? rawType : 'A';

        // Go!
        return await handleDig({ interaction, response, wait, domain, types: [type], short: rawShort });
    },
};
