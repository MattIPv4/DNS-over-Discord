import { env } from 'cloudflare:workers';
import { ComponentType, ButtonStyle } from 'discord-api-types/payloads';

const component = {
    type: ComponentType.Button,
    style: ButtonStyle.Link,
    url: `https://discord.com/oauth2/authorize?client_id=${env.DISCORD_CLIENT_ID}&scope=applications.commands`,
    label: 'Invite the bot to a server',
};

export default {
    name: 'invite',
    component,
};
