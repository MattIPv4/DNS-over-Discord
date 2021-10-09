const fetch = require('node-fetch');

const api = async (endpoint, method, token = undefined, tokenType = undefined, data = undefined) => {
    const res = await fetch(
        `https://discord.com/api/v8${endpoint}`,
        {
            method,
            body: data ? JSON.stringify(data) : undefined,
            headers: {
                Authorization: token && tokenType ? `${tokenType} ${token}` : undefined,
                'Content-Type': data ? 'application/json' : undefined,
            },
        },
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Received unexpected status code ${res.status} from ${endpoint} ${method} - ${text}`);
    }

    return res;
};

module.exports.grantToken = () => {
    const auth = Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64');
    return api('/oauth2/token?grant_type=client_credentials&scope=applications.commands.update', 'POST', auth, 'Basic')
        .then(res => res.json());
};

module.exports.getCommands = async (applicationId, token, tokenType, guildId = undefined) =>
    api(`/applications/${applicationId}${guildId ? `/guilds/${guildId}` : ''}/commands`, 'GET', token, tokenType)
        .then(res => res.json());

module.exports.registerCommand = async (applicationId, token, tokenType, data, guildId = undefined) =>
    api(`/applications/${applicationId}${guildId ? `/guilds/${guildId}` : ''}/commands`, 'POST', token, tokenType, data)
        .then(res => res.json());

module.exports.updateCommand = async (applicationId, token, tokenType, commandId, data, guildId = undefined) =>
    api(`/applications/${applicationId}${guildId ? `/guilds/${guildId}` : ''}/commands/${commandId}`, 'PATCH', token, tokenType, data)
        .then(res => res.json());

module.exports.removeCommand = async (applicationId, token, tokenType, commandId, guildId = undefined) =>
    api(`/applications/${applicationId}${guildId ? `/guilds/${guildId}` : ''}/commands/${commandId}`, 'DELETE', token, tokenType);

module.exports.sendFollowup = async (interaction, data) =>
    api(`/webhooks/${process.env.CLIENT_ID}/${interaction.token}?wait=true`, 'POST', null, null, data)
        .then(res => res.json());

module.exports.editDeferred = async (interaction, data) =>
    api(`/webhooks/${process.env.CLIENT_ID}/${interaction.token}/messages/${(interaction.message && interaction.message.id) || '@original'}?wait=true`, 'PATCH', null, null, data)
        .then(res => res.json());
