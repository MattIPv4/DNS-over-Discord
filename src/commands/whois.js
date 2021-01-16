const { ApplicationCommandOptionType, InteractionResponseType } = require('slash-commands');
const { createEmbed } = require('../utils/embed');
const { performLookup } = require('../utils/whois');

module.exports = {
    name: 'whois',
    description: 'Perform a WHOIS lookup for a domain, IP or ASN',
    options: [
        {
            name: 'query',
            description: 'The domain name, IP address or ASN to lookup',
            type: ApplicationCommandOptionType.STRING,
            required: true,
        },
    ],
    execute: async ({ interaction, response }) => {
        // Get the raw values from Discord
        const query = ((interaction.data.options.find(opt => opt.name === 'query') || {}).value || '').trim()
            .replace(/^as([0-9]+)$/i, '$1') // Remove 'AS' from start of an ASN
            .replace(/^[a-z][a-z0-9+.-]+:\/\/(.+)$/i, '$1') // Remove scheme from a URI
            .replace(/^([0-9]{1,3}(?:\.[0-9]{1,3}){3}):[0-9]+$/i, '$1'); // Remove port from an IPv4 address

        // Do the rdap/whois lookup
        const data = await performLookup(query);

        // If no result, send back simple message
        if (!data)
            return response({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [createEmbed('WHOIS',
                        'The query does not appear to be a valid domain name, IP address or ASN')],
                },
            });

        // Generate the fields
        const fields = Object.entries(data).filter(entry => entry[1] !== undefined).map(([ name, value ]) => ({
            name: ['asn', 'cidr'].includes(name)
                ? name.toUpperCase()
                : name[0].toUpperCase() + name.slice(1).toLowerCase(),
            value: value instanceof Date
                ? value.toUTCString()
                : value.toString(),
        }));

        // TODO: Print as a table (keys in first column), similar to DNS results

        // Send the embed
        const em = createEmbed('WHOIS', '');
        em.fields = fields;
        return response({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [em],
            },
        });
    },
};
