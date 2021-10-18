const { ComponentType, ButtonStyle } = require('discord-api-types/payloads/v9');

const component = {
    type: ComponentType.Button,
    style: ButtonStyle.Link,
    url: `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=applications.commands`,
    label: 'Invite the bot',
};

module.exports = {
    name: 'invite',
    component,
};
