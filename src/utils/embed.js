export const createEmbed = (title, description, footer = '') => ({
    title: `DNS over Discord${process.env.NODE_ENV === 'production' ? '' : ` [${process.env.NODE_ENV}]`}: ${title}`,
    description: description,
    color: 0xf48120,
    timestamp: (new Date).toISOString(),
    footer: footer ? {
        text: footer,
    } : null,
});
