import { ComponentType, InteractionResponseType, ApplicationIntegrationType, InteractionContextType } from 'discord-api-types/payloads';

import { createEmbed } from '../utils/embed.js';
import invite from '../components/invite.js';
import inviteUser from '../components/invite-user.js';

export default {
    name: 'invite',
    description: 'Get a link to add DNS over Discord to your server',
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
                    'Invite',
                    'Invite DNS over Discord to your server with https://dns-over-discord.v4.wtf/invite\n\nOr, use the bot anywhere by adding it to your account with https://dns-over-discord.v4.wtf/invite/user',
                ),
            ],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [ invite.component, inviteUser.component ],
                },
            ],
        },
    }),
};
