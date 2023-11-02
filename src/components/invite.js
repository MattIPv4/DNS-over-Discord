import { ComponentType, ButtonStyle } from 'discord-api-types/payloads';

const component = {
    type: ComponentType.Button,
    style: ButtonStyle.Link,
    url: `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=applications.commands`,
    label: 'Invite the bot',
};

export default {
    name: 'invite',
    component,
};
