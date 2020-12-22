# DNS over Discord

**A 1.1.1.1 DNS resolver built for Discord**

*For the latest docs, please see [developers.cloudflare.com/1.1.1.1/fun-stuff/dns-over-discord](https://developers.cloudflare.com/1.1.1.1/fun-stuff/dns-over-discord)*

---

Ever wanted to make DNS requests from the comfort of your Discord server? Well now you can, thanks to the [@1.1.1.1 bot](https://dns-over-discord.v4.wtf/invite).

To start using the DNS over Discord bot, invite it to your Discord server using this link: [https://dns-over-discord.v4.wtf/invite](https://dns-over-discord.v4.wtf/invite)

## dig command

Once the bot is in your server, type `/dig` to being using the bot's main command -- performing DNS lookups.
This will provide a native interface within Discord that allows you to specify the domain to lookup, an optional DNS record type and an optional flag for a short result.

Due to limitations in Discord, the `/dig` command can only offer 10 different DNS record types, and will default to 'A' records if none is specified.

![dig command](assets/dig-command.png)

![dig command types](assets/dig-command-types.png)

### Supported record types

*   A
*   AAAA
*   CAA
*   CERT
*   CNAME
*   MX
*   NS
*   SPF
*   SRV
*   TXT

*For all DNS record types, use the `/multi-dig` command.*

### Examples

![dig domain: cloudflare.com](assets/dig-command-example-1.png)\
_`/dig domain: cloudflare.com`_

![dig domain: cloudflare.com type: AAAA short: True](assets/dig-command-example-2.png)\
_`/dig domain: cloudflare.com type: AAAA short: True`_

## multi-dig command

Want to lookup multiple DNS record types at once, or record types not available in `/dig`?
The `/multi-dig` command allows you to specify any supported DNS record type, and multiple types separated by a space.

When providing DNS record types for the `/multi-dig` command, Discord will not prompt you with options.
Please provide a space-separated list of valid DNS record types to lookup, any invalid options will be silently dropped.
'A' records will be used as the default if no valid types are given.

![multi-dig command](assets/multi-dig-command.png)

![multi-dig command types](assets/multi-dig-command-types.png)

### Supported record types

*   A
*   AAAA
*   CAA
*   CERT
*   CNAME
*   DNSKEY
*   DS
*   LOC
*   MX
*   NAPTR
*   NS
*   PTR
*   SMIMEA
*   SPF
*   SRV
*   SSHFP
*   TLSA
*   TXT
*   URI

*Use '\*' (asterisk) in place of a record type to get DNS results for all supported types.*

### Examples

![multi-dig domain: cloudflare.com types: A AAAA](assets/multi-dig-command-example-1.png)\
_`/multi-dig domain: cloudflare.com types: A AAAA`_

![multi-dig domain: cloudflare.com types: DNSKEY short: True](assets/multi-dig-command-example-2.png)\
_`/multi-dig domain: cloudflare.com types: DNSKEY short: True`_

## Other commands

The bot also has a set of helper commands available to get more information about the bot and quick links.

### help command

The `/help` command provides in-Discord documentation about all the commands available in the 1.1.1.1 DNS over Discord bot.

![help command](assets/help-command.png)\
_`/help`_

### privacy command

The `/privacy` command displays the privacy policy notice for using the 1.1.1.1 DNS over Discord bot.
This notice can also be viewed at [https://dns-over-discord.v4.wtf/privacy](https://dns-over-discord.v4.wtf/privacy).

![privacy command](assets/privacy-command.png)\
_`/privacy`_

### github command

The DNS over Discord bot is open-source (here), and the `/github` command provides a quick link to access this GitHub repository.

![github command](assets/github-command.png)\
_`/github`_

### invite command

The `/invite` command provides the user with a quick link to invite the 1.1.1.1 DNS over Discord bot to another Discord server.
The bot can be invited at any time with [https://dns-over-discord.v4.wtf/invite](https://dns-over-discord.v4.wtf/invite).

![invite command](assets/invite-command.png)\
_`/invite`_

---

## Development

TODO

<!-- Contributing -->
## Contributing

Contributions are always welcome to this project!\
Take a look at any existing issues on this repository for starting places to help contribute towards, or simply create your own new contribution to the project.

Please make sure to follow the existing standards within the project such as code styles, naming conventions and commenting/documentation.

When you are ready, simply create a pull request for your contribution and I will review it whenever I can!

### Donating

You can also help me and the project out by sponsoring me through [GitHub Sponsors](https://github.com/users/MattIPv4/sponsorship) (preferred), contributing through a [donation on PayPal](http://paypal.mattcowley.co.uk/) or by supporting me monthly on my [Patreon page](http://patreon.mattcowley.co.uk/).
<p>
    <a href="https://github.com/users/MattIPv4/sponsorship" target="_blank">
        <img src="https://img.shields.io/badge/GitHub%20Sponsors-MattIPv4-blue.svg?logo=github&logoColor=FFF&style=flat-square" alt="GitHub Sponsors"/>
    </a>
    <a href="http://patreon.mattcowley.co.uk/" target="_blank">
        <img src="https://img.shields.io/badge/Patreon-IPv4-blue.svg?logo=patreon&logoColor=F96854&style=flat-square" alt="Patreon"/>
    </a>
    <a href="http://paypal.mattcowley.co.uk/" target="_blank">
        <img src="https://img.shields.io/badge/PayPal-Matt%20(IPv4)%20Cowley-blue.svg?logo=paypal&logoColor=00457C&style=flat-square" alt="PayPal"/>
    </a>
</p>

<!-- Discussion & Support -->
## Discussion, Support and Issues

Need support with this project, have found an issue or want to chat with others about contributing to the project?
> Please check the project's issues page first for support & bugs!

Not found what you need here?

* If you have an issue, please create a GitHub issue here to report the situation, include as much detail as you can!
* _or,_ You can join our Slack workspace to discuss any issue, to get support for the project or to chat with contributors and myself:

<a href="http://slack.mattcowley.co.uk/" target="_blank">
    <img src="https://img.shields.io/badge/Slack-MattIPv4-blue.svg?logo=slack&logoColor=blue&style=flat-square" alt="Slack" height="30">
</a>
