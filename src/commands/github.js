import { InteractionResponseType } from 'discord-api-types/payloads/v9';
import { createEmbed } from '../utils/embed';

export default {
    name: 'github',
    description: 'Get a link to the open-source GitHub repository for DNS over Discord',
    execute: async ({ response }) => response({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            embeds: [
                createEmbed(
                    'GitHub',
                    'View the DNS over Discord source code on GitHub at https://dns-over-discord.v4.wtf/github',
                ),
            ],
        },
    }),
};
