require('dotenv').config();
const express = require('express');
const { InteractionType, verifyKeyMiddleware } = require('discord-interactions');
const Privacy = require('./utils/privacy');
const { registerCommands } = require('./utils/commands');

const PORT = process.env.PORT || 3000;

const main = async () => {
    // Register the commands with Discord
    const discordCommands = await registerCommands();

    // Map commands to be keyed by their API ID
    const commands = discordCommands.reduce((obj, cmd) => {
        obj[cmd.id] = cmd;
        return obj;
    }, {});

    // Create the Express app
    const app = express();

    // Add our route for Discord
    // Middleware handles PINGs and verifying requests
    app.post('/interactions', verifyKeyMiddleware(process.env.CLIENT_PUBLIC_KEY), (req, res) => {
        // Only handle commands
        const interaction = req.body;
        if (interaction.type !== InteractionType.COMMAND) return;

        // Locate the command
        const command = commands[interaction.data.id];
        if (!command) return;

        // Execute
        command.execute(interaction, res.send.bind(res));
    });

    app.get('/invite', (req, res) => {
        res.redirect(`https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=applications.commands`);
    });

    app.get('/server', (req, res) => {
        res.redirect('https://discord.gg/JgxVfGn');
    });

    app.get('/github', (req, res) => {
        res.redirect('https://github.com/MattIPv4/DNS-over-Discord/');
    });

    app.get('/privacy', (req, res) => {
        res.set('Content-Type', 'text/plain');
        res.send(Privacy);
    });

    app.get('/', (req, res) => {
        res.redirect('https://developers.cloudflare.com/1.1.1.1/fun-stuff/dns-over-discord');
    });

    // Run the app
    app.listen(PORT, () => {
        console.log(`DNS over Discord listening at http://localhost:${PORT}`);
    });
};

main().then(() => {});
