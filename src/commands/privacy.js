const { InteractionResponseType, MessageFlags } = require('discord-api-types/payloads/v9');
const { createEmbed } = require('../utils/embed');
const Privacy = require('../utils/privacy');

module.exports = {
    name: 'privacy',
    description: 'View the privacy policy for DNS over Discord',
    execute: async ({ response }) => response({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            embeds: [createEmbed('Privacy Policy', `${Privacy}\n\nThis notice can also be viewed online at https://dns-over-discord.v4.wtf/privacy`)],
            flags: MessageFlags.Ephemeral,
        },
    }),
};
