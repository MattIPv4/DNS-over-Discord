const { InteractionResponseType } = require('slash-commands');
const { createEmbed } = require('../utils/embed');

module.exports = {
    name: 'invite',
    description: 'Get a link to add DNS over Discord to your server',
    execute: async (interaction, respond) => {
        respond({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [createEmbed('Invite',
                    'Invite DNS over Discord to your server with https://dns-over-discord.v4.wtf/invite')],
            },
        });
    },
};
