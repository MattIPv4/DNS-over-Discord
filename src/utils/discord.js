const fetch = require('node-fetch');
const { RouteBases, Routes } = require('discord-api-types/rest/v9');

const api = async (endpoint, method, token = undefined, tokenType = undefined, data = undefined) => {
    const res = await fetch(
        `${RouteBases.api}${endpoint}`,
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
        throw new Error(`Received unexpected status code ${res.status} from ${method} ${endpoint} - ${text}`);
    }

    return res;
};

module.exports.grantToken = () => {
    const auth = Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64');
    return api(`${Routes.oauth2TokenExchange()}?grant_type=client_credentials&scope=applications.commands.update`, 'POST', auth, 'Basic')
        .then(res => res.json());
};

module.exports.getCommands = async (applicationId, token, tokenType, guildId = undefined) =>
    api(guildId ? Routes.applicationGuildCommands(applicationId, guildId) : Routes.applicationCommands(applicationId), 'GET', token, tokenType)
        .then(res => res.json());

module.exports.registerCommand = async (applicationId, token, tokenType, data, guildId = undefined) =>
    api(guildId ? Routes.applicationGuildCommands(applicationId, guildId) : Routes.applicationCommands(applicationId), 'POST', token, tokenType, data)
        .then(res => res.json());

module.exports.updateCommand = async (applicationId, token, tokenType, commandId, data, guildId = undefined) =>
    api(guildId ? Routes.applicationGuildCommand(applicationId, guildId, commandId) : Routes.applicationCommand(applicationId, commandId), 'PATCH', token, tokenType, data)
        .then(res => res.json());

module.exports.removeCommand = async (applicationId, token, tokenType, commandId, guildId = undefined) =>
    api(guildId ? Routes.applicationGuildCommand(applicationId, guildId, commandId) : Routes.applicationCommand(applicationId, commandId), 'DELETE', token, tokenType);

module.exports.sendFollowup = async (interaction, data) =>
    api(`${Routes.webhook(process.env.CLIENT_ID, interaction.token)}?wait=true`, 'POST', null, null, data)
        .then(res => res.json());

module.exports.editDeferred = async (interaction, data) =>
    api(`${Routes.webhookMessage(process.env.CLIENT_ID, interaction.token, interaction.message?.id || '@original')}?wait=true`, 'PATCH', null, null, data)
        .then(res => res.json());
