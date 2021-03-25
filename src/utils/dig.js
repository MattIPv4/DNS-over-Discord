const { InteractionResponseType } = require('slash-commands');
const isValidDomain = require('is-valid-domain');
const { performLookup } = require('./dns');
const { presentTable } = require('./table');
const { editDeferred, sendFollowup } = require('./follow-up');
const { createEmbed } = require('./embed');

module.exports.validateDomain = (input, response) => {
    // Clean the input
    const cleaned = input
        .trim()
        .toLowerCase()
        .replace(/^[a-z][a-z0-9+.-]+:\/\/(.+)$/i, '$1'); // Remove scheme from a URI

    // Validate
    const valid = isValidDomain(cleaned, { subdomain: true });

    // Return the input with an optional error
    return {
        domain: cleaned,
        error: valid ? null : response({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'A domain name could not be parsed from the given input.',
                flags: 1 << 6,
            },
        }),
    };
};

module.exports.handleDig = async ({ interaction, response, wait, domain, types, short, sentry }) => {
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
            const rowsStr = short ? rows.join('\n') : presentTable([
                ['NAME', 'TTL', 'DATA'],
                ...rows.map(rowData => [rowData.name, `${rowData.TTL.toLocaleString()}s`, rowData.data]),
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
        // Give Discord time to process the ACK response
        await new Promise(resolve => setTimeout(resolve, 250));

        // Edit our deferred message with the first 10 embeds
        await editDeferred(interaction, {
            embeds: embeds.splice(0, 10),
        });

        // Send the remaining embeds as follow-ups
        while (embeds.length) {
            await sendFollowup(interaction, {
                embeds: embeds.splice(0, 10),
            });
        }
    })().catch(err => {
        // Log & re-throw any errors
        console.error(err);
        sentry.captureException(err);
        throw err;
    }));
    return response({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
};
