package main

import (
	"context"
	"fmt"
	"github.com/andersfylling/disgord"
)

// WHOIS runs the WHOIS request on either a domain or IP.
func WHOIS(args []string, s disgord.Session, m *disgord.Message) {
	// Get the data
	query := args[1]
	data, err := FetchRDAP(query)

	// Handle errors
	if err != nil {
		fmt.Println(err)
		_, _ = s.SendMsg(context.TODO(), m.ChannelID, "Could not fetch whois information for `"+query+"`")
		return
	}

	// TODO: Format & send message with data
	fmt.Println(data)
}
