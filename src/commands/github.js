const { InteractionResponseType } = require('slash-commands');
const { createEmbed } = require('../utils/embed');

module.exports = {
    name: 'github',
    description: 'Get a link to the open-source GitHub repository for DNS over Discord',
    execute: ({ response }) => response({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [
                createEmbed(
                    'Invite',
                    'View the DNS over Discord source code on GitHub at https://dns-over-discord.v4.wtf/github'
                ),
            ],
        },
    }),
};
