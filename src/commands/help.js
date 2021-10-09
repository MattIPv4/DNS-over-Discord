const { InteractionResponseType } = require('discord-api-types/payloads');
const { createEmbed } = require('../utils/embed');
const { cmdExplainer } = require('../utils/commands');
const commands = require('../build/data/commands.json');

module.exports = {
    name: 'help',
    description: 'Find out more about using DNS over Discord',
    execute: async ({ response }) => {
        // Create the base embed and fetch commands
        const embed = createEmbed('Help');

        // Add help for each command
        embed.fields = Object.values(commands).map(command => ({
            name: command.name,
            value: `\`\`\`\n${cmdExplainer(command)}\n\`\`\``,
        }));

        // Respond
        return response({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                embeds: [embed],
            },
        });
    },
};
