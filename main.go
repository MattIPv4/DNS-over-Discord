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

var Usage string

func init() {
	flag.StringVar(&Token, "t", "", "Bot Token")
	flag.StringVar(&Admin, "a", "", "Admin User ID")
	flag.Parse()
}

func getStrings() {
	// Usage
	data, err := ioutil.ReadFile("./strings/usage.txt")
	if err != nil {
		panic(err)
	}
	Usage = string(data)
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

func MessageCreate(s *discordgo.Session, m *discordgo.MessageCreate) {
	// Ignore all messages created by the bot itself
	if m.Author.ID == s.State.User.ID {
		return
	}

	// Treat mention as prefix
	if !strings.HasPrefix(m.Content, "<@"+s.State.User.ID+">") && !strings.HasPrefix(m.Content, "<@!"+s.State.User.ID+">") {
		return
	}

	// Get the content
	content := strings.Split(strings.Trim(m.Content, " "), " ")

	// If blank message, send usage
	if len(content) == 1 {
		_, _ = s.ChannelMessageSend(m.ChannelID, "```\n"+Usage+"\n```")
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

	// Assume DNS command
	DNS(args, s, m)
}
