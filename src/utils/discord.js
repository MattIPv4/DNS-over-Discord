const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

module.exports.grantToken = async () => {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('scope', 'applications.commands.update');
    const auth = Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64');
    const res = await fetch(
        'https://discord.com/api/v8/oauth2/token',
        {
            method: 'POST',
            body: params,
            headers: { Authorization: `Basic ${auth}` },
        },
    );

    if (!res.ok) {
        const data = await res.text();
        throw new Error(`Received unexpected status code ${res.status} from token POST - ${data}`);
    }

    return await res.json();
};

module.exports.getCommands = async (applicationId, token, tokenType, guildId = undefined) => {
    const res = await fetch(
        `https://discord.com/api/v8/applications/${applicationId}${guildId ? `/guilds/${guildId}` : ''}/commands`,
        {
            method: 'GET',
            headers: {
                Authorization: `${tokenType} ${token}`,
            },
        },
    );

    if (!res.ok) {
        const data = await res.text();
        throw new Error(`Received unexpected status code ${res.status} from commands GET - ${data}`);
    }

    return await res.json();
};

module.exports.registerCommand = async (applicationId, token, tokenType, data, guildId = undefined) => {
    const res = await fetch(
        `https://discord.com/api/v8/applications/${applicationId}${guildId ? `/guilds/${guildId}` : ''}/commands`,
        {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                Authorization: `${tokenType} ${token}`,
                'Content-Type': 'application/json',
            },
        },
    );

    if (!res.ok) {
        const data = await res.text();
        throw new Error(`Received unexpected status code ${res.status} from commands POST - ${data}`);
    }

    return await res.json();
};

module.exports.updateCommand = async (applicationId, token, tokenType, commandId, data, guildId = undefined) => {
    const res = await fetch(
        `https://discord.com/api/v8/applications/${applicationId}${guildId ? `/guilds/${guildId}` : ''}/commands/${commandId}`,
        {
            method: 'PATCH',
            body: JSON.stringify(data),
            headers: {
                Authorization: `${tokenType} ${token}`,
                'Content-Type': 'application/json',
            },
        },
    );

    if (!res.ok) {
        const data = await res.text();
        throw new Error(`Received unexpected status code ${res.status} from commands PATCH - ${data}`);
    }

    return await res.json();
};

module.exports.removeCommand = async (applicationId, token, tokenType, commandId, guildId = undefined) => {
    const res = await fetch(
        `https://discord.com/api/v8/applications/${applicationId}${guildId ? `/guilds/${guildId}` : ''}/commands/${commandId}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `${tokenType} ${token}`,
            },
        },
    );

    if (!res.ok) {
        const data = await res.text();
        throw new Error(`Received unexpected status code ${res.status} from commands DELETE - ${data}`);
    }
};

module.exports.sendFollowup = async (interaction, data) => {
    const res = await fetch(
        `https://discord.com/api/v8/webhooks/${process.env.CLIENT_ID}/${interaction.token}?wait=true`,
        {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        },
    );

    if (!res.ok) {
        const data = await res.text();
        throw new Error(`Received unexpected status code ${res.status} from webhooks POST - ${data}`);
    }

    return await res.json();
};

module.exports.editDeferred = async (interaction, data) => {
    const res = await fetch(
        `https://discord.com/api/v8/webhooks/${process.env.CLIENT_ID}/${interaction.token}/messages/${(interaction.message && interaction.message.id) || '@original'}?wait=true`,
        {
            method: 'PATCH',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        },
    );

    if (!res.ok) {
        const data = await res.text();
        throw new Error(`Received unexpected status code ${res.status} from webhooks PATCH - ${data}`);
    }

    return await res.json();
};
