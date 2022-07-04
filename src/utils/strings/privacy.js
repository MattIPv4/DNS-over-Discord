export default `
This Privacy Policy ("Policy") define the end-user ("you", "your") data being used as needed for the DNS over Discord bot ("bot") to operate and provide its functionality.
By using the bot, whether you have read these notices or not, you agree to be bound by the Policy and Terms of Service (https://dns-over-discord.v4.wtf/terms).
If you do not agree to this policy, please do not use the bot.

The bot stores no data in a database and has no persistent in-memory cache as it runs as a stateless Cloudflare Worker.
The bot responds solely to messages and requires no stored user data for this.

The use of the bot, and its commands, will result in data being sent to Discord to be rendered in chat channels for you.
You can read Discord's Privacy Policy on their website: https://discord.com/privacy

For DNS lookup commands, the domain name and record types provided will be sent to Cloudflare's 1.1.1.1 DNS over HTTPS JSON API to provide the functionality for the bot.
You can read Cloudflare's Privacy Policies on their website: https://www.cloudflare.com/privacypolicy/ & https://developers.cloudflare.com/1.1.1.1/privacy/public-dns-resolver/

At your request, the domain name and record types for the DNS lookup command can also be sent to Google's 8.8.8.8 DNS over HTTPS JSON API, or to Quad9's DNS over HTTPS service.
You can read both Google's and Quad9's Privacy Policies on their websites: https://developers.google.com/speed/public-dns/privacy & https://www.quad9.net/service/privacy/

For WHOIS lookup commands, the query will be sent to RDAP.CLOUD, with fallback to WHOISJS, to provide the functionality for the bot.
You can find out more about the services on their websites: https://rdap.cloud/ & https://whoisjs.com/
The source for both of these services is available on a GitLab instance: https://codedin.wales/matthew/rdap.cloud & https://codedin.wales/matthew/whoisjs.com

For more information on what data we store and use, or why we need it, please contact the developer by joining our support server at https://dns-over-discord.v4.wtf/server, or by creating an issue on the GitHub repository: https://dns-over-discord.v4.wtf/github
`.trim();
