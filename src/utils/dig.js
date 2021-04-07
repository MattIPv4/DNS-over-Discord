const { InteractionResponseType, InteractionResponseFlags } = require('discord-interactions');
const isValidDomain = require('is-valid-domain');
const { performLookup } = require('./dns');
const { presentTable } = require('./table');
const { sendFollowup, editDeferred } = require('./follow-up');
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
                flags: InteractionResponseFlags.EPHEMERAL,
            },
        }),
    };
};

module.exports.handleDig = async ({ interaction, response, wait, domain, types, short, sentry }) => {
    // Do the processing after acknowledging the Discord command
    wait((async () => {
        // Make the DNS queries
        const results = await Promise.all(types.map(type => performLookup(domain, type).then(data => ({ type, data }))));

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

        // Edit the original deferred response with the first 10 embeds
        await editDeferred(interaction, {
            embeds: embeds.splice(0, 10),
        });

        // If we have more than 10 embeds, the extras need to be sent as followups
        while (embeds.length)
            await sendFollowup(interaction, {
                embeds: embeds.splice(0, 10),
            });
    })().catch(err => {
        // Log & re-throw any errors
        console.error(err);
        sentry.captureException(err);
        throw err;
    }));
    return response({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
};
