import { InteractionResponseType, MessageFlags } from 'discord-api-types/payloads';
import { createEmbed } from '../utils/embed.js';
import Privacy from '../utils/strings/privacy.js';

export default {
    name: 'privacy',
    description: 'View the Privacy Policy for DNS over Discord',
    execute: async ({ response }) => response({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            embeds: [createEmbed('Privacy Policy', `${Privacy}\n\nThis notice can also be viewed online at https://dns-over-discord.v4.wtf/privacy`)],
            flags: MessageFlags.Ephemeral,
        },
    }),
};
