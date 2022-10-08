import { InteractionResponseType, MessageFlags } from 'discord-api-types/payloads/v9';
import isValidDomain from 'is-valid-domain';
import { performLookupWithCache, VALID_TYPES } from './dns.js';
import providers from './providers.js';
import { presentTable } from './table.js';
import { createEmbed } from './embed.js';

const DNSSEC_DISABLED_WARNING_MESSAGE = ':warning: cd bit set for request, DNSSEC validation disabled';

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

/**
 * Handle a dig command.
 *
 * @param {string} domain
 * @param {string[]} types
 * @param {Object} flags
 * @param {boolean} [flags.short]
 * @param {boolean} [flags.cdflag]
 * @param {import('./providers.js').Provider} provider
 * @return {Promise<import('./embed.js').Embed[]>}
 */
export const handleDig = async ({ domain, types, flags, provider }) => {
    // Make the DNS queries
    const results = await Promise.all(types.map(type =>
        performLookupWithCache(domain, type, provider.doh, flags).then(data => ({ type, data }))));

    // Define the presenter
    const present = (type, data) => {
        // Generate the dig command equivalent
        const digCmd = `\`${data.name} ${type} @${provider.dig} +noall +answer${flags.short ? ' +short' : ''}${flags.cdflag ? ' +cdflag' : ''}\`\n`;

        // Error message
        if (typeof data === 'object' && data.message)
            return `${digCmd}\n${data.message}`;

        // No results
        if (typeof data !== 'object' || !Array.isArray(data.answer) || data.answer.length === 0)
            return `${digCmd}\nNo records found${flags.cdflag
                ? `\n\n${DNSSEC_DISABLED_WARNING_MESSAGE}`
                : ''}`;

        // Map the data if short requested
        const sourceRows = flags.short ? data.answer.map(x => x.data) : data.answer;
        const finalRows = [];

        // Render the rows and truncated count
        const output = rows => {
            const trunc = sourceRows.length - rows.length;
            const truncStr = trunc ? `\n...(${trunc.toLocaleString()} row${trunc === 1 ? '' : 's'} truncated)` : '';
            const rowsStr = flags.short ? rows.join('\n') : presentTable([
                ['NAME', 'TTL', 'DATA'],
                ...rows.map(rowData => [rowData.name, `${rowData.ttl.toLocaleString()}s`, rowData.data]),
            ]);
            return `${digCmd}\`\`\`\n${rowsStr}${truncStr}\n\`\`\``;
        };

        const maxLength = 4096 - (flags.cdflag ? DNSSEC_DISABLED_WARNING_MESSAGE.length : 0);

        // Keep adding rows until we reach Discord 4096 char limit
        for (const row of sourceRows) {
            if (output([...finalRows, row]).length > maxLength) break;
            finalRows.push(row);
        }

        // Render and return final rows
        return `${output(finalRows)}${flags.cdflag
            ? `\n${DNSSEC_DISABLED_WARNING_MESSAGE}`
            : ''}`;
    };

    // Convert results to an embed
    return results.map(({ type, data }) => createEmbed(`${type} records`, present(type, data), 'diggy diggy hole'));
};

export const parseEmbed = embed => {
    // Match the domain name, type and if the short format was requested
    const descMatch = embed.description.match(/^`(\S+) (\S+) @(\S+) \+noall \+answer( \+short)?( \+cdflag)?`\n/);
    if (!descMatch) return null;

    // Check the type
    if (!VALID_TYPES.includes(descMatch[2])) return null;

    // Find the full provider
    const provider = providers.find(provider => provider.dig === descMatch[3]);
    if (!provider) return null;

    // Return the matched data
    return {
        name: descMatch[1],
        type: descMatch[2],
        short: !!descMatch[4],
        cdflag: !!descMatch[5],
        provider,
    };
};
