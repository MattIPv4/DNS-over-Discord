import { InteractionResponseType, MessageFlags, ComponentType } from 'discord-api-types/payloads/v9';
import docs from '../components/docs';
import invite from '../components/invite';
import { createEmbed } from '../utils/embed';
import { cmdExplainer } from '../utils/commands';
import commands from '../../tmp/commands.json';

export default {
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
