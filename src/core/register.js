import equal from 'deep-equal';

import { grantToken, getCommands as getDiscordCommands, registerCommand, updateCommand, removeCommand } from './api.js';
import { validateCommands } from './util.js';

const consistentCommandOption = obj => ({
    type: obj.type,
    name: obj.name,
    description: obj.description,
    default: !!obj.default,
    required: !!obj.required,
    choices: obj.choices || [],
    options: obj.options || [],
});

const updatedCommandProps = (oldCmd, newCmd) => ({
    name: oldCmd.name !== newCmd.name,
    description: oldCmd.description !== newCmd.description,
    options: !equal(
        oldCmd.options && oldCmd.options.map(consistentCommandOption),
        newCmd.options && newCmd.options.map(consistentCommandOption),
    ),
});

const updatedCommandPatch = (cmd, diff) => Object.keys(cmd)
    .filter(key => key in diff && diff[key])
    .reduce((obj, key) => {
        obj[key] = cmd[key];
        return obj;
    }, {});

const registerCommands = async (clientId, clientSecret, commands, guildId = undefined) => {
    // Validate the provided commands
    const cmds = Object.values(validateCommands(commands));

    // Get a token to talk to Discord
    const token = await grantToken(clientId, clientSecret);

    // Define the commands and get what Discord currently has
    const discordCommands = await getDiscordCommands(clientId, token, guildId);

    // Remove old commands
    for (const command of discordCommands) {
        if (cmds.find(cmd => cmd.name === command.name)) continue;
        await removeCommand(clientId, token, command.id, guildId);
        await new Promise(resolve => setTimeout(resolve, 250));
    }

    // Register or update the commands with Discord
    const commandData = [];
    for (const command of cmds) {
        // This command already exists in Discord
        const discordCommand = discordCommands.find(cmd => cmd.name === command.name);
        if (discordCommand) {
            // Get which props have changed
            const cmdDiff = updatedCommandProps(discordCommand, command);

            // Only patch if a prop has changed
            if (Object.values(cmdDiff).includes(true)) {
                // Get the props to patch and do the update
                const cmdPatch = updatedCommandPatch(command, cmdDiff);
                const data = await updateCommand(clientId, token, discordCommand.id, cmdPatch, guildId);
                await new Promise(resolve => setTimeout(resolve, 250));
                commandData.push({ ...command, ...data });
                continue;
            }

            // Store the existing command, nothing changed
            commandData.push({ ...discordCommand, ...command });
            continue;
        }

        // Register the new command
        const data = await registerCommand(clientId, token, command, guildId);
        await new Promise(resolve => setTimeout(resolve, 250));
        commandData.push({ ...command, ...data });
    }

    // Done
    return commandData;
};

export default registerCommands;
