import { InteractionResponseType, ComponentType, ButtonStyle } from 'discord-api-types/payloads/v9';
import { VALID_TYPES } from '../utils/dns.js';
import { handleDig, parseEmbed } from '../utils/dig.js';
import { editDeferred } from '../utils/discord.js';

const component = {
    type: ComponentType.Button,
    style: ButtonStyle.Secondary,
    label: 'Refresh',
    custom_id: 'dig-refresh',
};

export default {
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
                        type: ComponentType.ActionRow,
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

        // Disable the button, letting Discord and the user know we're working on an update
        return response({
            type: InteractionResponseType.UpdateMessage,
            data: {
                embeds: interaction.message.embeds,
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                ...component,
                                disabled: true,
                            },
                        ],
                    },
                ],
            },
        });
    },
};
