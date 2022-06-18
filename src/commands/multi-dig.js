import { InteractionResponseType, ApplicationCommandOptionType, ComponentType, MessageFlags } from 'discord-api-types/payloads/v9';
import digProvider from '../components/dig-provider.js';
import { VALID_TYPES } from '../utils/dns.js';
import { validateDomain, handleDig } from '../utils/dig.js';
import { sendFollowup, editDeferred } from '../utils/discord.js';
import digRefresh from '../components/dig-refresh.js';
import providers from '../utils/providers.js';

export default {
    name: 'multi-dig',
    description: 'Perform a DNS over Discord lookup with multiple record types',
    options: [
        {
            name: 'domain',
            description: 'The domain to lookup',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'types',
            description: 'Space-separated DNS record types to lookup, `*` for all types',
            help: `Supported types:\n  ${VALID_TYPES.slice(0).sort().join(', ')}\n\nUse \`*\` to lookup all types.`,
            type: ApplicationCommandOptionType.String,
            required: false,
            // TODO: https://github.com/discord/discord-api-docs/issues/2331
        },
        {
            name: 'short',
            description: 'Display the results in short form',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        },
        {
            name: 'provider',
            description: 'DNS provider to use',
            help: `Supported providers:\n  ${Object.keys(providers).join(', ')}\n\nDefaults to ${providers[0].name}.`,
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: providers.map(({ name }) => ({ name, value: name })),
        },
    ],
    execute: async ({ interaction, response, wait, sentry }) => {
        // Get the raw values from Discord
        const rawDomain = ((interaction.data.options.find(opt => opt.name === 'domain') || {}).value || '').trim();
        const rawTypes = ((interaction.data.options.find(opt => opt.name === 'types') || {}).value || '').trim();
        const rawShort = (interaction.data.options.find(opt => opt.name === 'short') || {}).value || false;
        const rawProvider = ((interaction.data.options.find(opt => opt.name === 'provider') || {}).value || '').trim();

        // Parse domain input, return any error response
        const { domain, error } = validateDomain(rawDomain, response);
        if (error) return error;

        // Parse types input, mapping '*' to all records and defaulting to 'A' if none given
        const types = rawTypes === '*'
            ? VALID_TYPES
            : rawTypes.split(' ').map(x => x.trim().toUpperCase()).filter(x => VALID_TYPES.includes(x));
        if (!types.length) types.push('A');

        // Validate provider, fallback to Cloudflare
        const provider = providers.find(p => p.name === rawProvider) || providers[0];

        // Make messages ephemeral if more than 5 types
        const flags = types.length > 5 ? MessageFlags.Ephemeral : undefined;

        // Track if we successfully edited the deferred message
        let deferredEdited = false;

        // Do the processing after acknowledging the Discord command
        wait((async () => {
            // Run dig and get the embeds
            const embeds = await handleDig({ domain, types, short: rawShort, provider });

            // Edit the original deferred response with the first 10 embeds
            const messageBase = {
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            digProvider.component(provider.name),
                        ],
                    },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            digRefresh.component,
                        ],
                    },
                ],
                flags,
            };
            await editDeferred(interaction, { ...messageBase, embeds: embeds.splice(0, 10) });

            // Track that the deferred message was edited for error handling
            deferredEdited = true;

            // If we have more than 10 embeds, the extras need to be sent as followups
            while (embeds.length)
                await sendFollowup(interaction, { ...messageBase, embeds: embeds.splice(0, 10) });
        })().catch(err => {
            // Log any error
            console.error(err);
            sentry.captureException(err);

            // Tell the user it errored (don't edit the deferred if we've already edited it)
            (deferredEdited ? sendFollowup : editDeferred)(interaction, {
                content: 'Sorry, something went wrong when processing your DNS query',
                flags,
            }).catch(() => {}); // Ignore any further errors

            // Re-throw the error for Cf
            throw err;
        }));

        // Let Discord know we're working on the response
        return response({ type: InteractionResponseType.DeferredChannelMessageWithSource, data: { flags } });
    },
};
