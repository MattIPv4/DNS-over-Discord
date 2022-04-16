import { InteractionResponseType, MessageFlags } from 'discord-api-types/payloads/v9';
import isValidDomain from 'is-valid-domain';
import { performLookupWithCache } from './dns';
import { presentTable } from './table';
import { createEmbed } from './embed';

export const validateDomain = (input, response) => {
    // Clean the input
    const cleaned = input
        .trim()
        .toLowerCase()
        .replace(/^[a-z][a-z0-9+.-]+:\/\/(.+)$/i, '$1'); // Remove scheme from a URI

    // Validate
    const valid = isValidDomain(cleaned, { subdomain: true, topLevel: true });

    // Return the input with an optional error
    return {
        domain: cleaned,
        error: valid ? null : response({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: 'A domain name could not be parsed from the given input.',
                flags: MessageFlags.Ephemeral,
            },
        }),
    };
};

export const handleDig = async ({ domain, types, short }) => {
    // Make the DNS queries
    const results = await Promise.all(types.map(type => performLookupWithCache(domain, type).then(data => ({ type, data }))));

    // Define the presenter
    const present = (type, data) => {
        // Generate the dig command equivalent
        const digCmd = `\`${data.name} ${type} @1.1.1.1 +noall +answer${short ? ' +short' : ''}\`\n`;

        // Error message
        if (typeof data === 'object' && data.message)
            return `${digCmd}\n${data.message}`;

        // No results
        if (typeof data !== 'object' || !Array.isArray(data.answer) || data.answer.length === 0)
            return `${digCmd}\nNo records found`;

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
            return `${digCmd}\`\`\`\n${rowsStr}${truncStr}\n\`\`\``;
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
    return results.map(({ type, data }) => createEmbed(`${type} records`, present(type, data), 'diggy diggy hole'));
};

export const parseEmbed = embed => {
    // Match the domain name, type and if the short format was requested
    const descMatch = embed.description.match(/^`(\S+) (\S+) @1\.1\.1\.1 \+noall \+answer( \+short)?`\n/);
    if (!descMatch) return null;

    // Return the matched data
    return {
        name: descMatch[1],
        type: descMatch[2],
        short: !!descMatch[3],
    };
};
