import { InteractionResponseType, MessageFlags, ApplicationIntegrationType, InteractionContextType } from 'discord-api-types/payloads';

import { createEmbed } from '../utils/embed.js';
import Terms from '../utils/strings/terms.js';

export default {
    name: 'terms',
    description: 'View the Terms of Service for DNS over Discord',
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
                    'Terms of Service',
                    `${Terms}\n\nThis notice can also be viewed online at https://dns-over-discord.v4.wtf/terms`,
                ),
            ],
            flags: MessageFlags.Ephemeral,
        },
    }),
};
