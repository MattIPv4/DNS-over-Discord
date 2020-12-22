const { ApplicationCommandOptionType } = require('slash-commands');
const { ValidTypes, PopularTypes } = require('../utils/dns');
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
            help: `Supported types:\n${PopularTypes.map(type => `  ${type}`).join('\n')}\n\nDefaults to \`A\` records.`,
            type: ApplicationCommandOptionType.STRING,
            required: false,
            choices: PopularTypes.map(type => ({
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
    execute: async (interaction, respond) => {
        // Get the raw values from Discord
        const rawDomain = ((interaction.data.options.find(opt => opt.name === 'domain') || {}).value || '').trim();
        const rawType = ((interaction.data.options.find(opt => opt.name === 'type') || {}).value || '').trim();
        const rawShort = (interaction.data.options.find(opt => opt.name === 'short') || {}).value || false;

        // Parse domain input
        // TODO: Validate domain
        const domain = rawDomain;

        // Validate type, fallback to 'A'
        const type = ValidTypes.includes(rawType) ? rawType : 'A';

        // Go!
        await handleDig(interaction, respond, domain, [type], rawShort);
    },
};
