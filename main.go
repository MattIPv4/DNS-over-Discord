package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"

	"github.com/bwmarrin/discordgo"
)

// Variables used for command line parameters
var (
	Token string
	Admin string
)

// Variables to fetch from strings
var (
	Usage      string
	AdminUsage string
	Stats      string
)

func init() {
	flag.StringVar(&Token, "t", "", "Bot Token")
	flag.StringVar(&Admin, "a", "", "Admin User ID")
	flag.Parse()
}

func getString(variable *string, file string) {
	data, err := ioutil.ReadFile("./strings/" + file + ".txt")
	if err != nil {
		panic(err)
	}
	*variable = string(data)
}

func getStrings() {
	// Usage
	getString(&Usage, "usage")

	// Admin Usage
	getString(&AdminUsage, "admin")

	// Stats
	getString(&Stats, "stats")
}

func main() {
	// Fetch strings
	getStrings()

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
	fmt.Println("Bot is now running in " + strconv.Itoa(len(dg.State.Guilds)) + " guilds.  Press CTRL-C to exit.")
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt, os.Kill)
	<-sc

	// Cleanly close down the Discord session.
	_ = dg.Close()
}

func HasPrefix(s *discordgo.Session, m *discordgo.MessageCreate) (bool, string) {
	prefixes := [5]string{"<@" + s.State.User.ID + ">", "<@!" + s.State.User.ID + ">", "1.", "1dot", "dig"}
	for _, prefix := range prefixes {
		if strings.HasPrefix(m.Content, prefix) {
			return true, prefix
		}
	}
	return false, ""
}

func MessageCreate(s *discordgo.Session, m *discordgo.MessageCreate) {
	// Ignore all messages created by the bot itself
	if m.Author.ID == s.State.User.ID {
		return
	}

	// Prefix check
	hasPrefix, _ := HasPrefix(s, m)
	if !hasPrefix {
		return
	}

	// Get the content
	content := strings.Split(strings.Trim(m.Content, " "), " ")

	// If blank message, send usage
	if len(content) == 1 {
		_, _ = s.ChannelMessageSend(m.ChannelID, "```\n"+Usage+"\n```")
		// If admin, send additional admin commands
		if m.Author.ID == Admin {
			_, _ = s.ChannelMessageSend(m.ChannelID, "```\n"+AdminUsage+"\n```")
		}
		return
	}

	// Get the args
	args := content[1:]

	// Admin commands
	if m.Author.ID == Admin {
		// Git pull
		if args[0] == "pull" {
			Pull(s, m)
			return
		}

		// Exit
		if args[0] == "exit" {
			Exit(s, m)
			return
		}
	}

	// Stats command
	if args[0] == "stats" {
		// Fetch the raw data
		guilds := len(s.State.Guilds)
		var (
			channels int
			members  int
		)
		for _, guild := range s.State.Guilds {
			channels += len(guild.Channels)
			members += guild.MemberCount
		}

		// Format the message
		content := Stats
		content = strings.Replace(content, "{{guilds}}", strconv.Itoa(guilds), 1)
		content = strings.Replace(content, "{{channels}}", strconv.Itoa(channels), 1)
		content = strings.Replace(content, "{{members}}", strconv.Itoa(members), 1)

		// Send it
		_, _ = s.ChannelMessageSend(m.ChannelID, "```\n"+content+"\n```")
		return
	}

	// Assume DNS command
	DNS(args, s, m)
}
