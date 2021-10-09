const { ApplicationCommandOptionType } = require('slash-commands');
const { InteractionResponseType } = require('discord-interactions');
const { performLookupWithCache } = require('../utils/whois');
const { editDeferred } = require('../utils/follow-up');
const { createEmbed } = require('../utils/embed');
const { presentTable } = require('../utils/table');

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
    execute: async ({ interaction, response, wait, sentry }) => {
        // Do the processing after acknowledging the Discord command
        wait((async () => {
            // Get the raw values from Discord
            const query = ((interaction.data.options.find(opt => opt.name === 'query') || {}).value || '').trim()
                .replace(/^as([0-9]+)$/i, '$1') // Remove 'AS' from start of an ASN
                .replace(/^[a-z][a-z0-9+.-]+:\/\/(.+)$/i, '$1') // Remove scheme from a URI
                .replace(/^([0-9]{1,3}(?:\.[0-9]{1,3}){3}):[0-9]+$/, '$1'); // Remove port from an IPv4 address

            // TODO: Try to validate as domain/IPv4/IPv6/ASN before running lookup

            // Do the rdap/whois lookup
            const data = await performLookupWithCache(query);

            // If no result, send back simple message
            if (!data)
                return editDeferred(interaction, {
                    embeds: [
                        createEmbed(
                            'WHOIS',
                            'The query does not appear to be a valid domain name, IP address or ASN, or no results could be found',
                        ),
                    ],
                });

            // Generate the fields
            const fields = Object.entries(data).filter(entry => entry[1] !== undefined).map(([ name, value ]) => ([
                ['asn', 'cidr'].includes(name)
                    ? name.toUpperCase()
                    : name[0].toUpperCase() + name.slice(1).toLowerCase(),
                value instanceof Date
                    ? value.toUTCString()
                    : value.toString(),
            ]));

            // Generate the table
            const table = presentTable([
                ['', ''],
                ...fields,
            ]).split('\n').slice(1).join('\n');

            // Title for the result (query, but with 'AS' added to any ASN)
            const title = query.replace(/^([0-9]+)$/, 'AS$1');

            // Edit our deferred message with the results
            await editDeferred(interaction, {
                embeds: [createEmbed('WHOIS', `\`\`\`\n${title}\n${table}\n\`\`\``)],
            });
        })().catch(err => {
            // Log any error
            console.error(err);
            sentry.captureException(err);

            // Tell the user it errored
            editDeferred(interaction, {
                content: 'Sorry, something went wrong when processing your WHOIS query',
            }).catch(() => {}); // Ignore any further errors

            // Re-throw the error for Cf
            throw err;
        }));

        // Let Discord know we're working on the response
        return response({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
    },
};
