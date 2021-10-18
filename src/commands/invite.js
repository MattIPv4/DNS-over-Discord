const { InteractionResponseType } = require('discord-api-types/payloads/v9');
const { createEmbed } = require('../utils/embed');

module.exports = {
    name: 'invite',
    description: 'Get a link to add DNS over Discord to your server',
    execute: async ({ response }) => response({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            embeds: [
                createEmbed(
                    'Invite',
                    `Invite DNS over Discord to your server with [https://dns-over-discord.v4.wtf/invite](https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=applications.commands)`,
                ),
            ],
        },
    }),
};
