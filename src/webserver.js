const express = require('express');
const { InteractionType, InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');

const main = () => {
    const app = express();

    app.post('/interactions', verifyKeyMiddleware(process.env.CLIENT_PUBLIC_KEY), (req, res) => {
        const interaction = req.body;
        if (interaction.type !== InteractionType.COMMAND) return;
        const command = interaction.data;

        switch (command.name) {
            case 'dig':
                res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content: 'Diggy diggy hole',
                    },
                });
                break;

            default:
                console.error('Unknown command', interaction);
                break;
        }
    });

    app.listen(8999, () => {
        console.log('Example app listening at http://localhost:8999');
    });
};

main();
