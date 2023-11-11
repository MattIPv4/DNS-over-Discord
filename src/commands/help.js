import { InteractionResponseType, MessageFlags, ComponentType } from 'discord-api-types/payloads';

import { createEmbed } from '../utils/embed.js';
import { cmdExplainer } from '../utils/commands.js';

import docs from '../components/docs.js';
import invite from '../components/invite.js';

export default {
    name: 'help',
    description: 'Find out more about using DNS over Discord',
    execute: ({ response, commands }) => {
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
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [ docs.component, invite.component ],
                    },
                ],
                flags: MessageFlags.Ephemeral,
            },
        });
    },
};
