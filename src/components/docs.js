import { ComponentType, ButtonStyle } from 'discord-api-types/payloads/v9';

const component = {
    type: ComponentType.Button,
    style: ButtonStyle.Link,
    url: 'https://developers.cloudflare.com/1.1.1.1/other-ways-to-use-1.1.1.1/dns-over-discord',
    label: 'Read the docs',
};

export default {
    name: 'docs',
    component,
};
