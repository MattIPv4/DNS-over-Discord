package main

import (
	"context"
	"github.com/andersfylling/disgord"
	"os"
	"os/exec"
)

// Pull is used to pull the bot from Git.
func Pull(s disgord.Session, m *disgord.Message) {
	cmd := exec.Command("git", "pull")
	stdout, err := cmd.Output()

	if err != nil {
		paginator.Paginate(s, m, []string{WrapDataTitle("Error", err.Error())}, "```\n", "\n```")
		return
	}

	paginator.Paginate(s, m, []string{WrapDataTitle("Git Pull", string(stdout))}, "```\n", "\n```")
}

// Exit is used to close the bot.
func Exit(s disgord.Session, m *disgord.Message) {
	_, _ = s.SendMsg(context.TODO(), m.ChannelID, "Exiting...")
	_ = s.Disconnect()
	os.Exit(0)
}
