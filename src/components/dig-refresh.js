import { InteractionResponseType, ComponentType, ButtonStyle } from 'discord-api-types/payloads';

import { updateComponents } from '../utils/components.js';
import { handleDig, parseEmbed } from '../utils/dig.js';
import { captureException } from '../utils/error.js';

const component = {
    type: ComponentType.Button,
    custom_id: 'dig-refresh',
    style: ButtonStyle.Secondary,
    label: 'Refresh',
};

export default {
    name: 'dig-refresh',
    component,
    execute: async ({ interaction, response, wait, edit, context, sentry }) => {
        // Parse all the embeds
        const embeds = (interaction.message.embeds || [])
            .map(embed => parseEmbed(embed)).filter(data => data !== null);

        // If no embeds found, fail
        if (!embeds.length) return new Response(null, { status: 400 });

        // Do the processing after acknowledging the Discord command
        wait((async () => {
            // Run dig and get the embeds
            const opts = {
                domain: embeds[0].name,
                types: embeds.map(data => data.type),
                options: embeds[0].options,
                provider: embeds[0].provider,
            };
            const updatedEmbeds = await handleDig(opts, context.env.CACHE, sentry);

            // Edit the message with the new embeds
            await edit({
                embeds: updatedEmbeds,
                components: updateComponents(
                    interaction.message.components,
                    c => ({
                        ...c,
                        disabled: false,
                    }),
                ),
            });
        })().catch(err => {
            // Log any errors
            captureException(err, sentry);

            // TODO: Indicate to the user something went wrong?

            // Re-throw the error for Cf
            throw err;
        }));

        // Disable the button, letting Discord and the user know we're working on an update
        return response({
            type: InteractionResponseType.UpdateMessage,
            data: {
                embeds: interaction.message.embeds,
                components: updateComponents(
                    interaction.message.components,
                    c => ({
                        ...c,
                        disabled: true,
                    }),
                ),
            },
        });
    },
};
