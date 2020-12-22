const { InteractionResponseType } = require('slash-commands');
const { createEmbed } = require('../utils/embed');
const { getCommands, cmdExplainer } = require('../utils/commands');

module.exports = {
    name: 'help',
    description: 'Find out more about using DNS over Discord',
    execute: async (interaction, respond) => {
        // Create the base embed and fetch commands
        const embed = createEmbed('Help');
        const commands = getCommands();

        // Add help for each command
        embed.fields = commands.map(command => ({
            name: command.name,
            value: `\`\`\`\n${cmdExplainer(command)}\n\`\`\``,
        }));

        // Respond
        respond({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            },
        });
    },
};
