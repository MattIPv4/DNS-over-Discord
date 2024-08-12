import { InteractionResponseType, MessageFlags, ApplicationIntegrationType, InteractionContextType } from 'discord-api-types/payloads';

import { createEmbed } from '../utils/embed.js';
import Privacy from '../utils/strings/privacy.js';

export default {
    name: 'privacy',
    description: 'View the Privacy Policy for DNS over Discord',
    contexts: {
        installation: [
            ApplicationIntegrationType.GuildInstall,
            ApplicationIntegrationType.UserInstall,
        ],
        interaction: [
            InteractionContextType.Guild,
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel,
        ],
    },
    execute: ({ response }) => response({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            embeds: [
                createEmbed(
                    'Privacy Policy',
                    `${Privacy}\n\nThis notice can also be viewed online at https://dns-over-discord.v4.wtf/privacy`,
                ),
            ],
            flags: MessageFlags.Ephemeral,
        },
    }),
};
