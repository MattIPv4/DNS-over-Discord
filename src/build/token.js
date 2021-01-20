const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

module.exports.grantToken = async () => {
    const params = new URLSearchParams();

    params.append('grant_type', 'client_credentials');
    params.append('scope', 'applications.commands.update');
    const auth = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64');
    const res = await fetch(
        'https://discord.com/api/v8/oauth2/token',
        {
            method: 'POST',
            body: params,
            headers: { Authorization: `Basic ${auth}` },
        }
    );

    return res.json();
};
