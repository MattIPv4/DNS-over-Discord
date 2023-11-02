import { InteractionResponseType, ComponentType } from 'discord-api-types/payloads';
import { updateComponents } from '../utils/components.js';
import { handleDig, parseEmbed } from '../utils/dig.js';
import { editDeferred } from '../utils/discord.js';
import { captureException } from '../utils/error.js';
import providers from '../utils/providers.js';

const component = name => ({
    type: ComponentType.SelectMenu,
    custom_id: 'dig-provider',
    placeholder: 'Change DNS Provider',
    options: providers.map(provider => ({
        label: provider.name,
        value: provider.name,
        default: name === provider.name,
    })),
});

export default {
    name: 'dig-provider',
    component,
    execute: async ({ interaction, response, wait, sentry }) => {
        // Parse all the embeds
        const embeds = (interaction.message.embeds || [])
            .map(embed => parseEmbed(embed)).filter(data => data !== null);

        // Find the new provider
        const provider = providers.find(provider => provider.name === interaction.data.values[0]);

        // If invalid new provider, or no embeds found, fail
        if (!provider || !embeds.length) return new Response(null, { status: 400 });

        // Do the processing after acknowledging the Discord command
        wait((async () => {
            // Run dig and get the embeds
            const opts = {
                domain: embeds[0].name,
                types: embeds.map(data => data.type),
                options: embeds[0].options,
                provider,
            };
            const updatedEmbeds = await handleDig(opts, sentry);

            // Edit the message with the new embeds
            await editDeferred(interaction, {
                embeds: updatedEmbeds,
                components: updateComponents(
                    interaction.message.components,
                    c => ({
                        ...(c.custom_id === 'dig-provider' ? component(provider.name) : c),
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

        // Disable the menu, letting Discord and the user know we're working on an update
        return response({
            type: InteractionResponseType.UpdateMessage,
            data: {
                embeds: interaction.message.embeds,
                components: updateComponents(
                    interaction.message.components,
                    c => ({
                        ...(c.custom_id === 'dig-provider' ? component(provider.name) : c),
                        disabled: true,
                    }),
                ),
            },
        });
    },
};
