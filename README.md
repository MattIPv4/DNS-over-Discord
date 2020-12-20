<!-- Source: https://github.com/MattIPv4/template/blob/master/README.md -->

<!-- Title -->
<h1 align="center" id="dns-over-discord">
    DNS over Discord
</h1>

<!-- Tag line -->
<h3 align="center">A 1.1.1.1 DNS resolver built in Go for Discord</h3>

<!-- Badges -->
<p align="center">
    <a href="https://1.1.1.1/" target="_blank">
        <img src="https://img.shields.io/badge/Cloudflare%20DNS-1.1.1.1-F38020?logo=cloudflare&style=flat-square" alt="Cloudflare DNS - 1.1.1.1"/>
    </a>
    <a href="https://github.com/users/MattIPv4/sponsorship" target="_blank">
        <img src="https://img.shields.io/badge/GitHub%20Sponsors-MattIPv4-blue.svg?style=flat-square" alt="GitHub Sponsors"/>
    </a>
    <a href="http://patreon.mattcowley.co.uk/" target="_blank">
        <img src="https://img.shields.io/badge/Patreon-IPv4-blue.svg?style=flat-square" alt="Patreon"/>
    </a>
    <a href="http://slack.mattcowley.co.uk/" target="_blank">
        <img src="https://img.shields.io/badge/Slack-MattIPv4-blue.svg?style=flat-square" alt="Slack"/>
    </a>
</p>

----

<!-- Content -->
Ever wanted to make DNS requests from the comfort of your Discord server? Well now you can, thanks to the [@1.1.1.1 bot](https://bit.ly/DNS-over-Discord).

To start using the DNS over Discord bot, invite it to your Discord server using this link: [https://bit.ly/DNS-over-Discord](https://bit.ly/DNS-over-Discord)

The bot only requires basic permissions to read messages in your server and send messages to reply to the DNS queries.

Once the bot is in your server, you can mention it (@1.1.1.1) followed by a domain name to begin making DNS requests. Provide DNS record types after the domain name to get back results for each record type. You can also use an asterisk ("*") in place of a record type to get back DNS results for all supported types.

If you ever need help with the usage of the DNS over Discord bot, simply mention it (@1.1.1.1) with no other keywords and it will return a help message with example usage for all supported features of the bot.


## Examples

![@1.1.1.1 cloudflare.com](https://i.cdnjs.dev/z2f0E12RN3.png)\
_@1.1.1.1 cloudflare.com_

![@1.1.1.1 cloudflare.com A AAAA](https://i.cdnjs.dev/LHeNYQnec0.png)\
_@1.1.1.1 cloudflare.com A AAAA_


## Supported record types

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

_Use "*" (asterisk) in place of a record type to get DNS results for all supported types._


## WHOIS support

The DNS over Discord also provides additional commands for performing whois lookups for both domain names and IP addresses. To use this functionality, mention the bot (@1.1.1.1) followed by the keyword “whois” and then the domain name or IP address.

For IP addresses, if the bot can get back a valid whois response and correctly parse it, it will return formatted information including the NetName and ASN for the IP address, as well as the CIDR block it is part of, the approximate location of the IP and the abuse contact for the IP range if available.


![@1.1.1.1 whois 104.17.175.85](https://i.cdnjs.dev/3dfknlDgE9.png)\
_@1.1.1.1 whois 104.17.175.85_

For domain names, assuming the bot can fetch a valid whois response, it will return the full, raw whois response for the requested domain name.

## Usage

### Discord

The bot can be used in Discord by mentioning the bot and then providing a domain name to look up using 1.1.1.1.
By default, if only a domain name is provided, the bot will lookup all supported record types and report them all.
However, you can also provide a list of record types (space separated) after the domain name to select which to lookup.

Mentioning the bot in Discord with no additional arguments will generate the usage message as follows:

```
DNS over Discord lookup:
  Usage: @1.1.1.1 <domain> [...types]

  Alternative prefixes:
    1.1.1.1 <domain> [...types]
    1dot <domain> [...types]
    dig <domain> [...types]

  Examples:
    @1.1.1.1 cloudflare.com
    @1.1.1.1 cloudflare.com A AAAA

  Types:
    If not provided, the default type of "A" will be used.
    You can provide a type of "*" to lookup all supported types.

  Supported types:
    A
    NS
    CNAME
    MX
    TXT
    AAAA
    SRV
    CAA


Domain whois:
  Usage: @1.1.1.1 whois <domain>

  Alternative prefixes:
    whois <domain>

  Description:
    Returns the raw response from the WHOIS server responsible for the requests domain name.

  Examples:
    @1.1.1.1 whois cloudflare.com
    @1.1.1.1 whois cloudflare.com


IP whois:
  Usage: @1.1.1.1 whois <ip>

  Alternative prefixes:
    whois <ip>

  Description:
    Returns formatted information about who owns the IP address, including their ASN and abuse contact if available.

  Examples:
    @1.1.1.1 whois 1.1.1.1
    @1.1.1.1 whois 1.0.0.1


Invite the bot:
  Usage: @1.1.1.1 invite


Privacy Policy:
  Usage: @1.1.1.1 privacy

  Alternative usage:
    @1.1.1.1 privacy-policy
    @1.1.1.1 policy
    @1.1.1.1 terms
    @1.1.1.1 tos


Bot commands (this):
  Usage: @1.1.1.1

  Alternative usage:
    @1.1.1.1 help
    @1.1.1.1 usage
    @1.1.1.1 commands


Invite: https://bit.ly/DNS-over-Discord
Open-source: https://github.com/MattIPv4/1.1.1.1-Discord
```

As the bot admin (see the `-a` argument above), this also enables two extra commands I find useful for production
 deployment. These are the `pull` command than runs `git pull` in the bot directory to fetch updates from Github, as
  well as `exit` which cleanly terminates the bot process.

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
