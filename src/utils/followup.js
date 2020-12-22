const fetch = require('node-fetch');

module.exports.sendFollowup = async (interaction, data) => {
    const res = await fetch(
        `https://discord.com/api/v8/webhooks/${process.env.CLIENT_ID}/${interaction.token}`,
        {
            method: 'post',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        }
    )
    return await res.json();
};
