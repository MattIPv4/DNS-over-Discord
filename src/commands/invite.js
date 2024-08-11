import { ComponentType, InteractionResponseType } from 'discord-api-types/payloads';

import { createEmbed } from '../utils/embed.js';
import invite from '../components/invite.js';

export default {
    name: 'invite',
    description: 'Get a link to add DNS over Discord to your server',
    execute: ({ response }) => response({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            embeds: [
                createEmbed(
                    'Invite',
                    'Invite DNS over Discord to your server with https://dns-over-discord.v4.wtf/invite',
                ),
            ],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [ invite.component ],
                },
            ],
        },
    }),
};
