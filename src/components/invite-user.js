import { ComponentType, ButtonStyle, ApplicationIntegrationType } from 'discord-api-types/payloads';

const component = {
    type: ComponentType.Button,
    style: ButtonStyle.Link,
    url: `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=applications.commands&integration_type=${ApplicationIntegrationType.UserInstall}`,
    label: 'Add the bot to your account',
};

export default {
    name: 'invite-user',
    component,
};
