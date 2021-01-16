const { ApplicationCommandOptionType, InteractionResponseType } = require('slash-commands');
const { createEmbed } = require('../utils/embed');
const { performLookup } = require('../utils/whois');

module.exports = {
    name: 'whois',
    description: 'Perform a WHOIS lookup for a domain or IP',
    options: [
        {
            name: 'domain_or_ip',
            description: 'The domain/IP to lookup',
            type: ApplicationCommandOptionType.STRING,
            required: true,
        },
    ],
    execute: async ({ interaction, response }) => {
        // Get the raw values from Discord
        const rawDomainIP = ((interaction.data.options.find(opt => opt.name === 'domain_or_ip') || {}).value || '').trim();

        // Try doing an rdap/whois lookup
        console.log(JSON.stringify(await performLookup(rawDomainIP), null, 2));

        // Respond
        return response({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [createEmbed('TODO', 'TODO')],
            },
        });
    },
};
