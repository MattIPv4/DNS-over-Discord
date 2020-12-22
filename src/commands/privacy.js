const { InteractionResponseType } = require('slash-commands');
const { createEmbed } = require('../utils/embed');
const Privacy = require('../utils/privacy');

module.exports = {
    name: 'privacy',
    description: 'View the privacy policy for DNS over Discord',
    execute: async (interaction, respond) => {
        // Respond
        respond({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [createEmbed('Privacy Policy', Privacy)],
            },
        });
    },
};
