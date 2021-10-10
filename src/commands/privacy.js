const { InteractionResponseType } = require('discord-api-types/payloads/v9');
const { createEmbed } = require('../utils/embed');
const Privacy = require('../utils/privacy');

module.exports = {
    name: 'privacy',
    description: 'View the privacy policy for DNS over Discord',
    execute: async ({ response }) => response({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            embeds: [createEmbed('Privacy Policy', Privacy)],
        },
    }),
};
