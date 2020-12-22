const { ApplicationCommandOptionType, InteractionResponseType } = require('slash-commands');
const { performLookup, ValidTypes, presentTable } = require('../utils/dns');
const { sendFollowup } = require('../utils/followup');

module.exports = {
    name: 'dig',
    description: 'Perform a DNS over Discord lookup',
    options: [
        {
            name: 'domain',
            description: 'The domain to lookup',
            type: ApplicationCommandOptionType.STRING,
            required: true,
        },
        {
            name: 'types',
            description: 'Space-separated DNS record types to lookup',
            type: ApplicationCommandOptionType.STRING,
            required: false,
            // TODO: https://github.com/discord/discord-api-docs/issues/2331
        },
        {
            name: 'short',
            description: 'Display the results in short form',
            type: ApplicationCommandOptionType.BOOLEAN,
            required: false,
        },
    ],
    execute: async (interaction, respond) => {
        const rawDomain = ((interaction.data.options.find(opt => opt.name === 'domain') || {}).value || '').trim();
        const rawTypes = ((interaction.data.options.find(opt => opt.name === 'types') || {}).value || '').trim();
        const rawShort = (interaction.data.options.find(opt => opt.name === 'short') || {}).value || false;

        // Parse domain input
        // TODO: Validate domain
        const domain = rawDomain;

        // Parse types input, mapping '*' to all records and defaulting to 'A' if none given
        const types = rawTypes === '*'
            ? ValidTypes
            : rawTypes.split(' ').map(x => x.trim().toUpperCase()).filter(x => ValidTypes.includes(x));
        if (!types.length) types.push('A');

        // Make the DNS queries
        const results = [];
        for (const type of types)
            results.push({
                type,
                data: await performLookup(domain, type),
            });

        // Define the presenter
        const present = data => {
            const sourceRows = rawShort ? data.map(x => x.data) : data;
            const finalRows = [];

            // Render the rows and truncated count
            const output = rows => {
                const trunc = sourceRows.length - rows.length;
                const truncStr = trunc ? `\n...(${trunc.toLocaleString()} row${trunc === 1 ? '' : 's'} truncated)` : '';
                const rowsStr = rawShort ? rows.join('\n') : presentTable(rows);
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
        const embeds = results.map(({ type, data }) => ({
            title: `DNS over Discord: ${type} records`,
            description: present(data),
            color: 0xf48120,
            timestamp: (new Date).toISOString(),
            footer: {
                text: 'diggy diggy hole',
            },
        }));

        // If we have 10 or fewer embeds, we can respond with them directly
        if (embeds.length <= 10)
            return respond({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: embeds.splice(0, 10),
                },
            });

        // Otherwise, ack and then send followups for chunks of 10 embeds
        //  This ensures the embeds arrive in the correct order
        respond({ type: InteractionResponseType.ACK_WITH_SOURCE });
        while (embeds.length) {
            await sendFollowup(interaction, {
                embeds: embeds.splice(0, 10),
            }).catch(console.error);
        }
    },
};
