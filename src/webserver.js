const express = require('express');
const { InteractionType, InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');

module.exports.runServer = commandsArray => {
    // Map commands to be keyed by their API ID
    const commands = commandsArray.reduce((obj, cmd) => {
        obj[cmd.id] = cmd;
        return obj;
    }, {});

    // Create the Express app
    const app = express();

    // Add our route for Discord
    app.post('/interactions', verifyKeyMiddleware(process.env.CLIENT_PUBLIC_KEY), (req, res) => {
        const interaction = req.body;

        // Handle PINGs
        if (interaction.type === InteractionType.PING) return res.send({ type: InteractionResponseType.PONG });

        // Only handle commands past this point
        if (interaction.type !== InteractionType.COMMAND) return;

        // Locate the command
        const commandData = interaction.data;
        const command = commands[commandData.id];
        if (!command) return;

        // Execute
        command.execute(commandData, res.send.bind(res));
    });

    // Run the app
    app.listen(3000, () => {
        console.log('Example app listening at http://localhost:3000');
    });
};
