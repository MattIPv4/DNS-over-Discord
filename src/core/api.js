import { RouteBases, Routes } from 'discord-api-types/rest';

const api = async (endpoint, method, token = undefined, data = undefined) => {
    const res = await fetch(
        `${RouteBases.api}${endpoint}`,
        {
            method,
            body: data ? JSON.stringify(data) : undefined,
            headers: {
                Authorization: token ? `${token.token_type} ${token.access_token}` : undefined,
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

export const grantToken = (clientId, clientSecret) => {
    const auth = Buffer.from(clientId + ':' + clientSecret).toString('base64');
    return api(`${Routes.oauth2TokenExchange()}?grant_type=client_credentials&scope=applications.commands.update`, 'POST', { token_type: 'Basic', access_token: auth })
        .then(res => res.json());
};

export const getCommands = async (applicationId, token, guildId = undefined) =>
    api(guildId ? Routes.applicationGuildCommands(applicationId, guildId) : Routes.applicationCommands(applicationId), 'GET', token)
        .then(res => res.json());

export const registerCommand = async (applicationId, token, data, guildId = undefined) =>
    api(guildId ? Routes.applicationGuildCommands(applicationId, guildId) : Routes.applicationCommands(applicationId), 'POST', token, data)
        .then(res => res.json());

export const updateCommand = async (applicationId, token, commandId, data, guildId = undefined) =>
    api(guildId ? Routes.applicationGuildCommand(applicationId, guildId, commandId) : Routes.applicationCommand(applicationId, commandId), 'PATCH', token, data)
        .then(res => res.json());

export const removeCommand = async (applicationId, token, commandId, guildId = undefined) =>
    api(guildId ? Routes.applicationGuildCommand(applicationId, guildId, commandId) : Routes.applicationCommand(applicationId, commandId), 'DELETE', token);

export const sendFollowup = async (interaction, data) =>
    api(`${Routes.webhook(interaction.application_id, interaction.token)}?wait=true`, 'POST', null, data)
        .then(res => res.json());

export const editDeferred = async (interaction, data) =>
    api(`${Routes.webhookMessage(interaction.application_id, interaction.token, interaction.message?.id || '@original')}?wait=true`, 'PATCH', null, data)
        .then(res => res.json());
