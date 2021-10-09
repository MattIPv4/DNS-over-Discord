const { InteractionResponseType } = require('discord-api-types/payloads');
const { createEmbed } = require('../utils/embed');

module.exports = {
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
