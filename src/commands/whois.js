import { InteractionResponseType, ApplicationCommandOptionType } from 'discord-api-types/payloads/v9';
import { captureException, contextualThrow } from '../utils/error.js';
import { performLookupWithCache } from '../utils/whois.js';
import { editDeferred } from '../utils/discord.js';
import { createEmbed } from '../utils/embed.js';
import { presentTable } from '../utils/table.js';

export default {
    name: 'whois',
    description: 'Perform a WHOIS lookup for a domain, IP or ASN',
    options: [
        {
            name: 'query',
            description: 'The domain name, IP address or ASN to lookup',
            type: ApplicationCommandOptionType.String,
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
            const data = await performLookupWithCache(query).catch(err => contextualThrow(err, { lookup: { query } }));

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
            // Log any errors
            captureException(err, sentry);

            // Tell the user it errored
            editDeferred(interaction, {
                content: 'Sorry, something went wrong when processing your WHOIS query',
            }).catch(() => {}); // Ignore any further errors

            // Re-throw the error for Cf
            throw err;
        }));

        // Let Discord know we're working on the response
        return response({ type: InteractionResponseType.DeferredChannelMessageWithSource });
    },
};
