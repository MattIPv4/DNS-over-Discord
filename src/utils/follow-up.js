module.exports.sendFollowup = async (interaction, data) => {
    const res = await fetch(
        `https://discord.com/api/v8/webhooks/${process.env.CLIENT_ID}/${interaction.token}`,
        {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        },
    );
    return await res.json();
};

module.exports.editDeferred = async (interaction, data) => {
    const res = await fetch(
        `https://discord.com/api/v8/webhooks/${process.env.CLIENT_ID}/${interaction.token}/messages/@original`,
        {
            method: 'PATCH',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        },
    );
    return await res.json();
};
