package main

import (
	"math"
	"strings"
)

func TitleFormat(l int, p string, t string) string {
	space := l - len(t) - 2
	left := math.Ceil(float64(space) / float64(2))
	right := math.Floor(float64(space) / float64(2))
	return strings.Repeat(p, int(left)) + " " + t + " " + strings.Repeat(p, int(right))
}

func WrapDataTitle(t string, d string) string {
	l := len(strings.Split(d, "\n")[0])
	return TitleFormat(l, "=", t) + "\n" + d + strings.Repeat("=", l)
}

func Intersection(s1 []string, s2 []string) []string {
	var intersects []string
	hash := make(map[string]bool)
	for _, e := range s1 {
		hash[e] = true
	}
	for _, e := range s2 {
		if hash[e] {
			intersects = append(intersects, e)
		}
	}
	return intersects
}

func PaginateBasic(c []string, e []string, m int) []string {
	for _, section := range c {
		// If the single section is too long, paginate per line
		if len(section) > m {
			e = PaginateBasic(strings.Split(section, "\n"), e, m)
			continue
		}

		// If will be too long w/ new section, create new page
		if len(e[len(e)-1]+section+"\n\n") > m {
			e = append(e, "")
		}

		// Add to last page
		e[len(e)-1] += section + "\n\n"
	}
	return e
}

func Paginate(c []string, p string, s string) []string {
	maxLength := 2000 - len(p) - len(s)
	pages := PaginateBasic(c, make([]string, 1), maxLength)
	for i, page := range pages {
		pages[i] = p + strings.Trim(page, "\n") + s
	}
	return pages
}
