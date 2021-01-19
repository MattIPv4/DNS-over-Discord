const { InteractionResponseType } = require('slash-commands');
const { performLookup } = require('./dns');
const { presentTable } = require('./table');
const { sendFollowup } = require('./follow-up');
const { createEmbed } = require('./embed');

module.exports.handleDig = async ({ interaction, response, wait, domain, types, short }) => {
    // Make the DNS queries
    const results = [];

    for (const type of types) results.push({
        type,
        // Following rule is disabled because the result of the statement after it is needed.
        // eslint-disable-next-line no-await-in-loop
        data: await performLookup(domain, type),
    });


    // Define the presenter
    const present = data => {
        // No results
        if (typeof data === 'undefined' ||
            Array.isArray(data) &&
            data.length === 0) return 'No records found';


        // Error message
        if (typeof data === 'object' && data.message) return data.message;


        // Map the data if short requested
        const sourceRows = short
            ? data.map(x => x.data)
            : data;
        const finalRows = [];

        // Render the rows and truncated count
        const output = rows => {
            const trunc = sourceRows.length - rows.length;
            const truncStr = trunc
                ? `\n...(${trunc.toLocaleString()} row${trunc === 1 ? '' : 's'} truncated)` : '';
            const rowsStr = short
                ? rows.join('\n')
                : presentTable([
                    ['NAME', 'TTL', 'DATA'],
                    ...rows.map(row => [row.name, `${row.TTL.toLocaleString()}s`, row.data]),
                ]);

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
    const embeds = results
        .map(({ type, data }) => createEmbed(`${type} records`, present(data), 'diggy diggy hole'));

    // If we have 10 or fewer embeds, we can respond with them directly
    if (embeds.length <= 10) return response({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: embeds.splice(0, 10),
        },
    });


    /*
     * Otherwise, ack and then send followups for chunks of 10 embeds
     *  This ensures the embeds arrive in the correct order
     */
    wait((async () => {
        // Give Discord time to process the ACK response
        await new Promise(resolve => setTimeout(resolve, 250));

        // Send the embeds
        while (embeds.length) await sendFollowup(interaction, {
            embeds: embeds.splice(0, 10),
        });

    })());
    return response({ type: InteractionResponseType.ACK_WITH_SOURCE });
};
