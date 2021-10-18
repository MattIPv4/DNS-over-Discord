const { InteractionResponseType, ApplicationCommandOptionType, ComponentType } = require('discord-api-types/payloads/v9');
const { VALID_TYPES } = require('../utils/dns');
const { validateDomain, handleDig } = require('../utils/dig');
const { editDeferred } = require('../utils/discord');
const { component } = require('../components/dig-refresh');

const optionTypes = Object.freeze(VALID_TYPES.slice(0, 25)); // Discord has a limit of 25 options

module.exports = {
    name: 'dig',
    description: 'Perform a DNS over Discord lookup',
    options: [
        {
            name: 'domain',
            description: 'The domain to lookup',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'type',
            description: 'DNS record type to lookup',
            help: `Supported types:\n  ${optionTypes.join(', ')}\n\nDefaults to \`A\` records.`,
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: optionTypes.map(type => ({
                name: `${type} records`,
                value: type,
            })),
        },
        {
            name: 'short',
            description: 'Display the results in short form',
            type: ApplicationCommandOptionType.Boolean,
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
        if (error) return error;

        // Validate type, fallback to 'A'
        const type = VALID_TYPES.includes(rawType) ? rawType : 'A';

        // Do the processing after acknowledging the Discord command
        wait((async () => {
            // Run dig and get the embeds
            const [ embed ] = await handleDig({ domain, types: [ type ], short: rawShort });

            // Edit the original deferred response
            await editDeferred(interaction, {
                embeds: [ embed ],
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [ component ],
                    },
                ],
            });
        })().catch(err => {
            // Log any error
            console.error(err);
            sentry.captureException(err);

            // Tell the user it errored
            editDeferred(interaction, {
                content: 'Sorry, something went wrong when processing your DNS query',
            }).catch(() => {}); // Ignore any further errors

            // Re-throw the error for Cf
            throw err;
        }));

        // Let Discord know we're working on the response
        return response({ type: InteractionResponseType.DeferredChannelMessageWithSource });
    },
};
