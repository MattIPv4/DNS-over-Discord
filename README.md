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
    <a href="http://patreon.mattcowley.co.uk/" target="_blank">
        <img src="https://img.shields.io/badge/patreon-IPv4-blue.svg?style=flat-square" alt="Patreon"/>
    </a>
    <a href="http://slack.mattcowley.co.uk/" target="_blank">
        <img src="https://img.shields.io/badge/slack-MattIPv4-blue.svg?style=flat-square" alt="Slack"/>
    </a>
</p>

----

<!-- Content -->
## Invite

I'm hosting a copy of this bot myself and you can invite it to your Discord server using this link:

> https://bit.ly/1111-Discord

## Build

This assumes you already have a working Go environment setup and that DiscordGo is correctly installed on your system.

From within the 1.1.1.1-Discord project folder, run the below command to compile the example.

```
go build
```

## Usage

### Go

You can start the Discord bot by running the following, where `<token>` is your Discord Bot token.

```
./1.1.1.1-Discord -t <token> 
```

### Discord

The bot can be used in Discord by mentioning the bot and then providing a domain name to look up using 1.1.1.1.
By default, if only a domain name is provided, the bot will lookup all supported record types and report them all.
However, you can also provide a list of record types (space separated) after the domain name to select which to lookup.

Mentioning the bot in Discord with no additional arguments will generate the usage message as follows:

```
Usage: @1.1.1.1 <domain> [...types]
Examples:
@1.1.1.1 mattcowley.co.uk
@1.1.1.1 mattcowley.co.uk A AAAA
```

## Supported Record Types

 - A
 - NS
 - CNAME
 - MX
 - TXT
 - AAAA
 - SRV
 - CAA
 
_The latest supported record types can be found at the top of dns.go in the types map._

<!-- Contributing -->
## Contributing

Contributions are always welcome to this project!\
Take a look at any existing issues on this repository for starting places to help contribute towards, or simply create your own new contribution to the project.

Please make sure to follow the existing standards within the project such as code styles, naming conventions and commenting/documentation.

When you are ready, simply create a pull request for your contribution and I will review it whenever I can!

### Donating

You can also help me and the project out by contributing through a donation on PayPal or by supporting me monthly on my Patreon page.
<p>
    <a href="http://patreon.mattcowley.co.uk/" target="_blank">
        <img src="https://img.shields.io/badge/patreon-IPv4-blue.svg?logo=patreon&logoWidth=30&logoColor=F96854&style=popout-square" alt="Patreon"/>
    </a>
    <a href="http://paypal.mattcowley.co.uk/" target="_blank">
        <img src="https://img.shields.io/badge/paypal-Matt%20(IPv4)%20Cowley-blue.svg?logo=paypal&logoWidth=30&logoColor=00457C&style=popout-square" alt="PayPal"/>
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
    <img src="https://img.shields.io/badge/slack-MattIPv4-blue.svg?logo=slack&logoWidth=30&logoColor=blue&style=popout-square" alt="Slack" height="60">
</a>
