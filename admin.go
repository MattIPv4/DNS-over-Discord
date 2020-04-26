package main

import (
	"github.com/bwmarrin/discordgo"
	"os"
	"os/exec"
)

// Pull is used to pull the bot from Git.
func Pull(s *discordgo.Session, m *discordgo.MessageCreate) {
	cmd := exec.Command("git", "pull")
	stdout, err := cmd.Output()

	if err != nil {
		paginator.Paginate(s, m, []string{WrapDataTitle("Error", err.Error())}, "```\n", "\n```")
		return
	}

	paginator.Paginate(s, m, []string{WrapDataTitle("Git Pull", string(stdout))}, "```\n", "\n```")
}

// Exit is used to close the bot.
func Exit(s *discordgo.Session, m *discordgo.MessageCreate) {
	_, _ = s.ChannelMessageSend(m.ChannelID, "Exiting...")
	_ = s.Close()
	os.Exit(0)
}
