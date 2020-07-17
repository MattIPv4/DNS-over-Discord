package main

import (
	"context"
	"flag"
	"fmt"
	"github.com/andersfylling/disgord"
	"github.com/jakemakesstuff/structuredhttp"
	"io/ioutil"
	"strings"
	"time"
)

// Variables used for command line parameters
var (
	Token string
	Admin disgord.Snowflake
)

// Variables to fetch from strings
var (
	Usage         string
	AdminUsage    string
	Invite        string
	PrivacyPolicy string
)

// The user ID.
var UserID disgord.Snowflake

func init() {
	flag.StringVar(&Token, "t", "", "Bot Token")
	var AdminString string
	flag.StringVar(&AdminString, "a", "", "Admin User ID")
	flag.Parse()
	Admin = disgord.ParseSnowflakeString(AdminString)
}

func getString(variable *string, file string) {
	data, err := ioutil.ReadFile("./strings/" + file + ".txt")
	if err != nil {
		panic(err)
	}
	*variable = string(data)
}

func getStrings() {
	getString(&Usage, "usage")
	getString(&AdminUsage, "admin")
	getString(&Invite, "invite")
	getString(&PrivacyPolicy, "privacy-policy")
}

func main() {
	// Set the structuredhttp timeout to 5 seconds.
	structuredhttp.SetDefaultTimeout(5 * time.Second)

	// Fetch strings
	getStrings()

	// Create a new Discord session using the provided bot token.
	dg := disgord.New(disgord.Config{
		BotToken: Token,
		CacheConfig: &disgord.CacheConfig{
			DisableChannelCaching:    true,
			DisableUserCaching:       true,
			DisableVoiceStateCaching: true,
			DisableGuildCaching:      true,
		},
		Intents: disgord.IntentGuildMessages,
	})

	// Register the event for when we initially connect to Discord.
	dg.On(disgord.EvtReady, func(s disgord.Session, evt *disgord.Ready) {
		// Set the initial cache info
		UserID = evt.User.ID

		// Log that we're ready
		fmt.Println("Connected to Discord as", evt.User.ID, evt.User.Username, "with", len(evt.Guilds), "guilds")

		// Set status
		go func(s disgord.Session) {
			for {
				_ = s.UpdateStatus(&disgord.UpdateStatusPayload{
					Status: "online",
					Game: &disgord.Activity{
						Name: "DNS over Discord",
						Type: disgord.ActivityTypeStreaming,
					},
				})
				time.Sleep(5 * time.Minute)
			}
		}(dg)
	})

	// Register the MessageCreate func as a callback for MessageCreate events.
	dg.On(disgord.EvtMessageCreate, MessageCreate)

	// Open a websocket connection to Discord and begin listening.
	err := dg.StayConnectedUntilInterrupted(context.TODO())
	if err != nil {
		fmt.Println("error opening connection,", err)
		return
	}
}

// NamePrefixes gets all possible ways to prefix the user.
func NamePrefixes() []string {
	s := UserID.String()
	return []string{"<@" + s + ">", "<@!" + s + ">", "1.1.1.1", "1dot"}
}

// HasPrefix checks if the message has a prefix.
func HasPrefix(m *disgord.Message) (bool, string) {
	prefixes := append(NamePrefixes(), "dig", "whois")
	for _, prefix := range prefixes {
		if strings.HasPrefix(m.Content, prefix) {
			return true, prefix
		}
	}
	return false, ""
}

// MessageCreate is fired when a message is created.
func MessageCreate(s disgord.Session, e *disgord.MessageCreate) {
	go func() {
		// Get the message.
		m := e.Message

		// Ignore all messages created by the bot itself
		if m.Author.ID == UserID {
			return
		}

		// Prefix check
		hasPrefix, prefix := HasPrefix(m)
		if !hasPrefix {
			return
		}

		// Get the content
		content := strings.Split(strings.Trim(m.Content, " "), " ")

		// Get the args
		args := content[1:]

		// If blank message, send usage
		if len(content) == 1 || args[0] == "help" || args[0] == "usage" || args[0] == "commands" {
			// Only send if command, or if bot name
			if len(content) > 1 || InStrings(NamePrefixes(), prefix) {
				_, _ = s.SendMsg(context.TODO(), m.ChannelID, "```\n"+Usage+"\n```")
				// If admin, send additional admin commands
				if m.Author.ID == Admin {
					_, _ = s.SendMsg(context.TODO(), m.ChannelID, "```\n"+AdminUsage+"\n```")
				}
			}
			return
		}

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

		// Invite command
		if args[0] == "invite" {
			_, _ = s.SendMsg(context.TODO(), m.ChannelID, "```\n"+Invite+"\n```")
			return
		}

		// Privacy command
		if args[0] == "privacy" || args[0] == "privacy-policy" || args[0] == "policy" || args[0] == "terms" || args[0] == "tos" {
			_, _ = s.SendMsg(context.TODO(), m.ChannelID, "```\n"+PrivacyPolicy+"\n```")
			return
		}

		// WHOIS command
		if prefix == "whois" || args[0] == "whois" {
			// Prepend whois if done via prefix
			if args[0] != "whois" {
				args = append([]string{"whois"}, args...)
			}

			// Run!
			WHOIS(args, s, m)
			return
		}

		// Assume DNS command
		DNS(args, s, m)
	}()
}
