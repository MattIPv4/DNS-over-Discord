package main

import (
	"context"
	"github.com/andersfylling/disgord"
	"strings"
)

// Paginator is the structure for the paginator.
type Paginator struct{}

var paginator Paginator

// Split is used to split into multiple pages.
func (pg Paginator) Split(c []string, e []string, m int) []string {
	for _, section := range c {
		// If the single section is too long, paginate per line
		if len(section) > m {
			e = pg.Split(strings.Split(section, "\n"), e, m)
			continue
		}

		// If will be too long w/ new section, create new page
		if len(e[len(e)-1]+section+"\n") > m {
			e = append(e, "")
		}

		// Add to last page
		e[len(e)-1] += section + "\n"
	}
	return e
}

// Pages splits the text into pages.
func (pg Paginator) Pages(c []string, p string, s string) []string {
	maxLength := 2000 - len(p) - len(s)
	pages := pg.Split(c, make([]string, 1), maxLength)
	for i, page := range pages {
		pages[i] = p + strings.Trim(page, "\n") + s
	}
	return pages
}

// Paginate sends the paginated text.
func (pg Paginator) Paginate(s disgord.Session, m *disgord.Message, c []string, px string, sx string) {
	pages := pg.Pages(c, px, sx)
	for _, page := range pages {
		_, _ = s.SendMsg(context.TODO(), m.ChannelID, page)
	}
}
