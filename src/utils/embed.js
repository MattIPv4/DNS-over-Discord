export const createEmbed = (title, description, footer = '') => ({
    title: `DNS over Discord: ${title}`,
    description: description,
    color: 0xf48120,
    timestamp: (new Date).toISOString(),
    footer: footer ? {
        text: footer,
    } : null,
});
