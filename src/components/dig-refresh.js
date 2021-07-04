const { InteractionResponseType } = require('discord-interactions');
const { VALID_TYPES } = require('../utils/dns');
const { handleDig, parseEmbed } = require('../utils/dig');
const { editDeferred } = require('../utils/follow-up');
const { MessageComponentType, MessageComponentButtonStyle } = require('../utils/components');

const component = {
    type: MessageComponentType.BUTTON,
    style: MessageComponentButtonStyle.SECONDARY,
    label: 'Refresh',
    id: 'dig-refresh',
};

module.exports = {
    name: 'dig-refresh',
    component,
    execute: async ({ interaction, response, wait, sentry }) => {
        // Parse all the embeds
        const embeds = (interaction.message.embeds || [])
            .map(embed => parseEmbed(embed))
            .filter(data => data !== null && VALID_TYPES.includes(data.type));

        // If no types found, fail
        if (!embeds.length) return new Response(null, { status: 400 });

        // Do the processing after acknowledging the Discord command
        wait((async () => {
            // Run dig and get the embeds
            const updatedEmbeds = await handleDig({
                domain: embeds[0].name,
                types: embeds.map(data => data.type),
                short: embeds[0].short,
            });

            // Edit the message with the new embeds
            await editDeferred(interaction, {
                embeds: updatedEmbeds,
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
        return response({ type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE });
    },
};
