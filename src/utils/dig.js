import { InteractionResponseType, MessageFlags } from 'discord-api-types/payloads/v9';
import isValidDomain from 'is-valid-domain';
import { performLookupWithCache, VALID_TYPES } from './dns.js';
import { captureException, contextualThrow } from './error.js';
import providers from './providers.js';
import { presentTable } from './table.js';
import { createEmbed } from './embed.js';

const DNSSEC_DISABLED_WARNING_MESSAGE = ':warning: cd bit set, DNSSEC validation disabled';

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
 * @typedef {Object} DigOptions
 * @property {boolean} [short]
 * @property {boolean} [cdflag]
 */

/**
 * Handle a dig command.
 *
 * @param {string} domain
 * @param {string[]} types
 * @param {DigOptions} options
 * @param {import('./providers.js').Provider} provider
 * @param {import('workers-sentry/worker')} sentry
 * @return {Promise<import('./embed.js').Embed[]>}
 */
export const handleDig = async ({ domain, types, options, provider }, sentry) => {
    // Make the DNS queries
    const results = await Promise.all(types.map(type => {
        const opts = { domain, type, endpoint: provider.doh, flags: { cd: options.cdflag } };
        return performLookupWithCache(opts.domain, opts.type, opts.endpoint, opts.flags)
            .then(data => ({ type, data }))
            .catch(err => contextualThrow(err, { lookup: opts }))
            .catch(err => {
                captureException(err, sentry);
                return { type, data: { name: domain, message: 'An unexpected error occurred' } };
            });
    }));

    // Define the presenter
    const present = (type, data) => {
        // Generate the dig command equivalent
        const digCmdParts = [
            data.name,
            type,
            `@${provider.dig}`,
            '+noall',
            '+answer',
            options.short ? '+short' : null,
            options.cdflag ? '+cdflag' : null,
        ].filter(x => x !== null);
        const digCmd = `\`${digCmdParts.join(' ')}\`\n`;

        // Error message
        if (data.message)
            return `${digCmd}\n${data.message}`;

        // No results
        if (!data.answer.length)
            return `${digCmd}\nNo records found${data.flags.cd
                ? `\n\n${DNSSEC_DISABLED_WARNING_MESSAGE}`
                : ''}`;

        // Map the data if short requested
        const sourceRows = options.short ? data.answer.map(x => x.data) : data.answer;
        const finalRows = [];

        // Render the rows and truncated count
        const output = rows => {
            const trunc = sourceRows.length - rows.length;
            const truncStr = trunc ? `\n...(${trunc.toLocaleString()} row${trunc === 1 ? '' : 's'} truncated)` : '';
            const rowsStr = options.short ? rows.join('\n') : presentTable([
                ['NAME', 'TTL', 'DATA'],
                ...rows.map(rowData => [rowData.name, `${rowData.ttl.toLocaleString()}s`, rowData.data]),
            ]);
            return `${digCmd}\`\`\`\n${rowsStr}${truncStr}\n\`\`\``;
        };

        const maxLength = 4096 - (data.flags.cd ? DNSSEC_DISABLED_WARNING_MESSAGE.length : 0);

        // Keep adding rows until we reach Discord 4096 char limit
        for (const row of sourceRows) {
            if (output([...finalRows, row]).length > maxLength) break;
            finalRows.push(row);
        }

        // Render and return final rows
        return `${output(finalRows)}${data.flags.cd
            ? `\n${DNSSEC_DISABLED_WARNING_MESSAGE}`
            : ''}`;
    };

    // Convert results to an embed
    return results.map(({ type, data }) => createEmbed(`${type} records`, present(type, data), 'diggy diggy hole'));
};

/**
 * Parse an existing DNS over Discord embed and extract the dig command.
 *
 * @param {{ description: string }} embed
 * @return {?{ name: string, type: string, options: DigOptions, provider: import('./providers.js').Provider }}
 */
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
        options: { short: !!descMatch[4], cdflag: !!descMatch[5] },
        provider,
    };
};
