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
	if d == "" {
		d = "No data found."
	}
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
