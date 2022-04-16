import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { getCommands, registerCommands } from './commands.js';

const mkdirSafe = path => fs.access(path).catch(() => fs.mkdir(path, { recursive: true }));

export default async () => {
    // Create the output directory
    const tmp = fileURLToPath(new URL('../../tmp', import.meta.url));
    await mkdirSafe(tmp);

    // Export empty commands as JSON
    // This is so the help command doesn't error
    await fs.writeFile(path.join(tmp, 'commands.json'), JSON.stringify({}, null, 2));

    // Get all our local commands
    const commands = await getCommands();

    // Register the commands with Discord
    const discordCommands = await registerCommands(commands);

    // Export the Discord commands as JSON
    // Mapped to be keyed by their API ID
    const discordCommandsObj = discordCommands.reduce((obj, cmd) => {
        obj[cmd.id] = cmd;
        return obj;
    }, {});
    await fs.writeFile(path.join(tmp, 'commands.json'), JSON.stringify(discordCommandsObj, null, 2));

    // Done
    console.log('Commands data ready to go!');
};
