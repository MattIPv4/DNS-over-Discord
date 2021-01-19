/* eslint-disable max-len */
module.exports = `
By using DNS over Discord, whether you have read these notices or not, you agree to the following data being used as needed for DNS over Discord to operate and provide its functionality.

DNS over Discord stores no data in a database and has a very limited in-memory cache that is wiped whenever the bot restarts.
DNS over Discord responds solely to messages and requires no stored user data for this.

For DNS lookup commands, the domain name and record types provided will be sent to Cloudflare's 1.1.1.1 DNS over HTTPS JSON API to provide the functionality for the bot.
You can read Cloudflare's Privacy Policies on their website: https://www.cloudflare.com/privacypolicy/ & https://developers.cloudflare.com/1.1.1.1/privacy/public-dns-resolver/

For WHOIS lookup commands, the query will be sent to RDAP.CLOUD, with fallback to WHOISJS, to provide the functionality for the bot.
You can find out more about the services on their websites: https://rdap.cloud/ & https://whoisjs.com/
The source for both of these services is available on a GitLab instance: https://codedin.wales/matthew/rdap.cloud & https://codedin.wales/matthew/whoisjs.com

For more information on what data we store and use, or why we need it, please contact IPv4 by joining our support server at https://dns-over-discord.v4.wtf/server, or by creating an issue on the GitHub repository: https://dns-over-discord.v4.wtf/github
`.trim();
