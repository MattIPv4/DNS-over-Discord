import { env } from 'cloudflare:workers';

/**
 * @typedef {Object} Embed
 * @property {string} title
 * @property {string} description
 * @property {number} color
 * @property {string} timestamp
 * @property {?{ text: string }} footer
 */

/**
 * Create a Discord embed object.
 *
 * @param {string} title
 * @param {string} description
 * @param {string} [footer='']
 * @return {Embed}
 */
export const createEmbed = (title, description, footer = '') => ({
    title: `DNS over Discord${env.ENVIRONMENT === 'production' ? '' : ` [${env.ENVIRONMENT}]`}: ${title}`,
    description: description,
    color: 0xf48120,
    timestamp: (new Date).toISOString(),
    footer: footer ? {
        text: footer,
    } : null,
});
