package main

import (
	"context"
	"flag"
	"fmt"
	"github.com/andersfylling/disgord"
	"github.com/jakemakesstuff/structuredhttp"
	"io/ioutil"
	"strconv"
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
	Usage      string
	AdminUsage string
	Invite     string
	Stats      string
)

// Counts for the bot.
var (
	GuildCount   int
	ChannelCount int
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
	getString(&Stats, "stats")
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
	})

	// Register the events to set the user ID and manage counts.
	UnavailableGuilds := make([]disgord.Snowflake, 0)
	var UnloadedGuilds []disgord.Snowflake
	countCache := map[disgord.Snowflake]int{}
	dg.On(disgord.EvtReady, func(s disgord.Session, evt *disgord.Ready) {
		// Set the initial cache info
		UserID = evt.User.ID
		UnloadedGuilds = make([]disgord.Snowflake, len(evt.Guilds))
		for i, v := range evt.Guilds {
			UnloadedGuilds[i] = v.ID
		}
		GuildCount += len(UnloadedGuilds)

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
	dg.On(disgord.EvtGuildCreate, func(s disgord.Session, evt *disgord.GuildCreate) {
		// Check if the guild was unavailable. If so, don't duplicate the channel count.
		for i, v := range UnavailableGuilds {
			if v == evt.Guild.ID {
				// Yes it is. Remove this and return here.
				UnavailableGuilds[len(UnavailableGuilds)-1], UnavailableGuilds[i] = UnavailableGuilds[i], UnavailableGuilds[len(UnavailableGuilds)-1]
				UnavailableGuilds = UnavailableGuilds[:len(UnavailableGuilds)-1]
				return
			}
		}

		// Was this a guild from initialisation?
		InitialisationGuild := false
		for i, v := range UnloadedGuilds {
			if v == evt.Guild.ID {
				// Yes it is. Remove this and break here.
				UnloadedGuilds[len(UnloadedGuilds)-1], UnloadedGuilds[i] = UnloadedGuilds[i], UnloadedGuilds[len(UnloadedGuilds)-1]
				UnloadedGuilds = UnloadedGuilds[:len(UnloadedGuilds)-1]
				InitialisationGuild = true
				break
			}
		}

		// If this was not from initialisation, +1.
		if !InitialisationGuild {
			GuildCount++
		}

		// Add the channels to the channel count.
		l := len(evt.Guild.Channels)
		countCache[evt.Guild.ID] = l
		ChannelCount += l
	})
	dg.On(disgord.EvtGuildDelete, func(s disgord.Session, evt *disgord.GuildDelete) {
		if evt.UserWasRemoved() {
			// This was an actual removal from the guild.
			count := countCache[evt.UnavailableGuild.ID]
			delete(countCache, evt.UnavailableGuild.ID)
			GuildCount--
			ChannelCount -= count
			return
		}

		// Mark as unavailable.
		UnavailableGuilds = append(UnavailableGuilds, evt.UnavailableGuild.ID)
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
	return []string{"<@" + s + ">", "<@!" + s + ">", "1dot"}
}

// HasPrefix checks if the message has a prefix.
func HasPrefix(m *disgord.Message) (bool, string) {
	prefixes := append(NamePrefixes(), "1.", "dig", "whois")
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

		// Stats command
		if args[0] == "stats" {
			// Format the message
			content := Stats
			content = strings.Replace(content, "{{guilds}}", strconv.Itoa(GuildCount), 1)
			content = strings.Replace(content, "{{channels}}", strconv.Itoa(ChannelCount), 1)

			// Send it
			_, _ = s.SendMsg(context.TODO(), m.ChannelID, "```\n"+content+"\n```")
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
