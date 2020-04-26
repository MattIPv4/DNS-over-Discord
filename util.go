package main

import (
	"math"
	"strings"
)

// TitleFormat is used to format the title.
func TitleFormat(l int, p string, t string) string {
	space := l - len(t) - 2
	left := math.Ceil(float64(space) / float64(2))
	right := math.Floor(float64(space) / float64(2))
	return strings.Repeat(p, int(left)) + " " + t + " " + strings.Repeat(p, int(right))
}

// WrapDataTitle is used to wrap the data title.
func WrapDataTitle(t string, d string) string {
	l := 0
	lines := strings.Split(d, "\n")
	for _, line := range lines {
		length := len(line)
		if length > l {
			l = length
		}
	}
	return TitleFormat(l, "=", t) + "\n" + d + strings.Repeat("=", l)
}

// InStrings is used to check if a string is within an array of other strings.
func InStrings(slice []string, val string) bool {
	for _, item := range slice {
		if item == val {
			return true
		}
	}
	return false
}

// Intersection defines the intersection of 2 arrays.
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
