const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

const DISCORD_API = 'https://discord.com/api/v8';

module.exports.sendFollowup = async (interaction, data) => {
    const res = await fetch(
        `${DISCORD_API}/webhooks/${process.env.CLIENT_ID}/${interaction.token}`,
        {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        },
    );
    return await res.json();
};

module.exports.grantToken = async () => {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('scope', 'applications.commands.update');
    const auth = Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64');
    const res = await fetch(
        `${DISCORD_API}/oauth2/token`,
        {
            method: 'POST',
            body: params,
            headers: { Authorization: `Basic ${auth}` },
        },
    );
    return await res.json();
};
