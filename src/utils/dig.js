const { InteractionResponseType, InteractionResponseFlags } = require('discord-interactions');
const isValidDomain = require('is-valid-domain');
const { performLookup } = require('./dns');
const { presentTable } = require('./table');
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

module.exports.handleDig = async ({ domain, types, short }) => {
    // Make the DNS queries
    const results = await Promise.all(types.map(type => performLookup(domain, type).then(data => ({ type, data }))));

    // Define the presenter
    const present = data => {
        // No results
        if (typeof data === 'undefined' || (Array.isArray(data) && data.length === 0)) return 'No records found';

        // Error message
        if (typeof data === 'object' && data.message) return data.message;

        // Map the data if short requested
        const sourceRows = short ? data.answer.map(x => x.data) : data.answer;
        const finalRows = [];

        // Render the rows and truncated count
        const output = rows => {
            const trunc = sourceRows.length - rows.length;
            const truncStr = trunc ? `\n...(${trunc.toLocaleString()} row${trunc === 1 ? '' : 's'} truncated)` : '';
            const rowsStr = short ? rows.join('\n') : presentTable([
                ['NAME', 'TTL', 'DATA'],
                ...rows.map(rowData => [rowData.name, `${rowData.TTL.toLocaleString()}s`, rowData.data]),
            ]);
            return `\`${data.name}\`\n\`\`\`\n${rowsStr}${truncStr}\n\`\`\``;
        };

        // Keep adding rows until we reach Discord 4096 char limit
        for (const row of sourceRows) {
            if (output([...finalRows, row]).length > 4096) break;
            finalRows.push(row);
        }

        // Render and return final rows
        return output(finalRows);
    };

    // Convert results to an embed
    return results.map(({ type, data }) => createEmbed(`${type} records`, present(data), 'diggy diggy hole'));
};

module.exports.parseEmbed = embed => {
    // Match the record type from the title
    const typeMatch = embed.title.match(/^DNS over Discord: (\S+) records$/);
    if (!typeMatch) return null;

    // Match the domain name requested from the description
    const nameMatch = embed.description.match(/^`(.+?)`\n```\n.+\n```$/s);
    if (!nameMatch) return null;

    // Look for a table to determine if short form
    const tableMatch = embed.description.match(/^`.+?`\n```\nNAME\s+\|\s+TTL\s+\|\s+DATA\s*\n.+\n```$/s);

    // Return the matched data
    return {
        type: typeMatch[1],
        name: nameMatch[1],
        short: !tableMatch,
    };
};
