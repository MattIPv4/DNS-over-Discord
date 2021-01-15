const { InteractionResponseType } = require('slash-commands');
const { performLookup, presentTable } = require('./dns');
const { sendFollowup } = require('./follow-up');
const { createEmbed } = require('./embed');

module.exports.handleDig = async ({ interaction, env, response, wait, domain, types, short }) => {
    // Make the DNS queries
    const results = [];
    for (const type of types)
        results.push({
            type,
            data: await performLookup(domain, type),
        });

    // Define the presenter
    const present = data => {
        // No results
        if (typeof data === 'undefined' || (Array.isArray(data) && data.length === 0)) return 'No records found';

        // Error message
        if (typeof data === 'object' && data.message) return data.message;

        // Map the data if short requested
        const sourceRows = short ? data.map(x => x.data) : data;
        const finalRows = [];

        // Render the rows and truncated count
        const output = rows => {
            const trunc = sourceRows.length - rows.length;
            const truncStr = trunc ? `\n...(${trunc.toLocaleString()} row${trunc === 1 ? '' : 's'} truncated)` : '';
            const rowsStr = short ? rows.join('\n') : presentTable(rows);
            return `\`\`\`\n${rowsStr}${truncStr}\n\`\`\``;
        };

        // Keep adding rows until we reach Discord 2048 char limit
        for (const row of sourceRows) {
            if (output([...finalRows, row]).length > 2048) break;
            finalRows.push(row);
        }

        // Render and return final rows
        return output(finalRows);
    };

    // Convert results to an embed
    const embeds = results.map(({ type, data }) => createEmbed(`${type} records`, present(data), 'diggy diggy hole'));

    // If we have 10 or fewer embeds, we can respond with them directly
    if (embeds.length <= 10)
        return response({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: embeds.splice(0, 10),
            },
        });

    // Otherwise, ack and then send followups for chunks of 10 embeds
    //  This ensures the embeds arrive in the correct order
    wait((async () => {
        // TODO: The ack w/ message still shows up after followups sometimes
        await new Promise(resolve => setTimeout(resolve, 5));

        while (embeds.length) {
            await sendFollowup(interaction, env, {
                embeds: embeds.splice(0, 10),
            });
        }
    })());
    return response({ type: InteractionResponseType.ACK_WITH_SOURCE });
};
