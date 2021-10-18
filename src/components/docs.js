const { ComponentType, ButtonStyle } = require('discord-api-types/payloads/v9');

const component = {
    type: ComponentType.Button,
    style: ButtonStyle.Link,
    url: 'https://developers.cloudflare.com/1.1.1.1/other-ways-to-use-1.1.1.1/dns-over-discord',
    label: 'Read the docs',
};

module.exports = {
    name: 'docs',
    component,
};
