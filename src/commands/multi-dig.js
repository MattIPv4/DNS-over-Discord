const { InteractionResponseType } = require('discord-interactions');
const { ApplicationCommandOptionType } = require('slash-commands');
const { VALID_TYPES } = require('../utils/dns');
const { validateDomain, handleDig } = require('../utils/dig');
const { sendFollowup, editDeferred } = require('../utils/follow-up');
const { MessageComponentType } = require('../utils/components');
const { component } = require('../components/dig-refresh');

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

        // Do the processing after acknowledging the Discord command
        wait((async () => {
            // Run dig and get the embeds
            const embeds = await handleDig({ domain, types, short: rawShort });

            // Edit the original deferred response with the first 10 embeds
            await editDeferred(interaction, {
                embeds: embeds.splice(0, 10),
                components: [
                    {
                        type: MessageComponentType.ACTION_ROW,
                        components: [ component ],
                    },
                ],
            });

            // If we have more than 10 embeds, the extras need to be sent as followups
            while (embeds.length)
                await sendFollowup(interaction, {
                    embeds: embeds.splice(0, 10),
                    components: [
                        {
                            type: MessageComponentType.ACTION_ROW,
                            components: [ component ],
                        },
                    ],
                });
        })().catch(err => {
            // Log & re-throw any errors
            console.error(err);
            sentry.captureException(err);
            throw err;
        }));

        // Let Discord know we're working on the response
        return response({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
    },
};
