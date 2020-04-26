package main

import (
	"github.com/bwmarrin/discordgo"
	"net"
)

func WHOISIP(args []string, s *discordgo.Session, m *discordgo.MessageCreate) {
	ip := args[1]

	// Get the response
	WHOISData, err := FetchWHOISIPJSON(ip)
	if err != nil {
		_, _ = s.ChannelMessageSend(m.ChannelID, "Could not fetch whois information for `"+ip+"` due to an error")
		return
	}
	if WHOISData.ResultsInfo.Count < 1 {
		_, _ = s.ChannelMessageSend(m.ChannelID, "No whois results found for `"+ip+"`")
		return
	}

	// Paginate data and send to channel
	paginator.Paginate(s, m, []string{WrapDataTitle(ip, FormatWHOISIPData(*WHOISData))}, "```\n", "\n```")
}

func WHOISDomain(args []string, s *discordgo.Session, m *discordgo.MessageCreate) {
	domain := args[1]

	// Get the response
	WHOISData, err := FetchWHOISDomainJSON(domain)
	if err != nil {
		_, _ = s.ChannelMessageSend(m.ChannelID, "Could not fetch whois information for `"+domain+"` due to an error")
		return
	}
	if !WHOISData.Success {
		_, _ = s.ChannelMessageSend(m.ChannelID, "Could not fetch whois information for `"+domain+"` due to an error")
		return
	}

	// Paginate data and send to channel
	paginator.Paginate(s, m, []string{WrapDataTitle(domain, FormatWHOISDomainData(*WHOISData))}, "```\n", "\n```")
}

func WHOIS(args []string, s *discordgo.Session, m *discordgo.MessageCreate) {
	// Validate ip
	ip := args[1]
	if net.ParseIP(ip) == nil {
		WHOISDomain(args, s, m)
		return
	}

	WHOISIP(args, s, m)
}
