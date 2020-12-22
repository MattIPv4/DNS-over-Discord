const express = require('express');
const { InteractionType, verifyKeyMiddleware } = require('discord-interactions');

module.exports.runServer = commandsArray => {
    // Map commands to be keyed by their API ID
    const commands = commandsArray.reduce((obj, cmd) => {
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

    // Run the app
    app.listen(3000, () => {
        console.log('Example app listening at http://localhost:3000');
    });
};
