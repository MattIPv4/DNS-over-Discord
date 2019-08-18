package main

import (
	"flag"
	"fmt"
	"os"
	"os/signal"
	"regexp"
	"strings"
	"syscall"

	"github.com/bwmarrin/discordgo"
)

// Variables used for command line parameters
var (
	Token string
)

func init() {
	flag.StringVar(&Token, "t", "", "Bot Token")
	flag.Parse()
}

func main() {
	// Create a new Discord session using the provided bot token.
	dg, err := discordgo.New("Bot " + Token)
	if err != nil {
		fmt.Println("error creating Discord session,", err)
		return
	}

	// Register the MessageCreate func as a callback for MessageCreate events.
	dg.AddHandler(MessageCreate)

	// Open a websocket connection to Discord and begin listening.
	err = dg.Open()
	if err != nil {
		fmt.Println("error opening connection,", err)
		return
	}

	// Wait here until CTRL-C or other term signal is received.
	fmt.Println("Bot is now running.  Press CTRL-C to exit.")
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt, os.Kill)
	<-sc

	// Cleanly close down the Discord session.
	_ = dg.Close()
}

func IsValidDomain(d string) bool {
	domainReg := regexp.MustCompile(`([\w-]+\.)+\w+`)
	return domainReg.Match([]byte(d))
}

func MessageCreate(s *discordgo.Session, m *discordgo.MessageCreate) {
	// Ignore all messages created by the bot itself
	if m.Author.ID == s.State.User.ID {
		return
	}

	// Treat mention as prefix
	if !strings.HasPrefix(m.Content, s.State.User.Mention()) {
		return
	}

	// Get the content and then args
	content := strings.Trim(strings.Replace(m.Content, s.State.User.Mention(), "", 1), " ")
	args := strings.Split(content, " ")

	// Validate domain
	if !IsValidDomain(args[0]) {
		_, _ = s.ChannelMessageSend(m.ChannelID, "Could not validate `"+args[0]+"` as a domain")
		return
	}

	// Do all types if none given
	if len(args) < 2 {
		for _, value := range TypeMap {
			_, _ = DoDNS(args[0], value, s, m)
		}
		return
	}

	// Run with given type
	_, _ = DoDNS(args[0], args[1], s, m)
}
