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
