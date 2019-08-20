package main

import (
	"github.com/bwmarrin/discordgo"
	"os"
	"os/exec"
)

func Pull(s *discordgo.Session, m *discordgo.MessageCreate) {
	cmd := exec.Command("git", "pull")
	stdout, err := cmd.Output()

	if err != nil {
		paginator.Paginate(s, m, []string{WrapDataTitle("Error", err.Error())}, "```\n", "\n```")
		return
	}

	paginator.Paginate(s, m, []string{WrapDataTitle("Git Pull", string(stdout))}, "```\n", "\n```")
}

func Exit(s *discordgo.Session, m *discordgo.MessageCreate) {
	_, _ = s.ChannelMessageSend(m.ChannelID, "Exiting...")
	_ = s.Close()
	os.Exit(0)
}
