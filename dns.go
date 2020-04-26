package main

import (
	"github.com/bwmarrin/discordgo"
	"github.com/jakemakesstuff/structuredhttp"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/olekukonko/tablewriter"
)

// Types defines all of the supported types.
var Types = []string{"A", "NS", "CNAME", "MX", "TXT", "AAAA", "SRV", "CAA"}

// Question defines the question which was posed to the DNS.
type Question struct {
	Type int    `json:"type"`
	Name string `json:"name"`
}

// Answer is the response from the DNS.
type Answer struct {
	Type int    `json:"type"`
	Name string `json:"name"`
	TTL  int    `json:"TTL"`
	Data string `json:"data"`
}

// DNSResponse defines the DNS response.
type DNSResponse struct {
	Status    int
	TC        bool
	RD        bool
	RA        bool
	AD        bool
	CD        bool
	Question  []Question
	Answer    []Answer
	Authority []Answer
}

// FetchDNSJSON is used to fetch the DNS JSON.
func FetchDNSJSON(u string, t string) (*DNSResponse, error) {
	// Run the request
	var f DNSResponse
	r, err := structuredhttp.GET("https://cloudflare-dns.com/dns-query").Query(
		"name", u).Query("type", t).Header("Accept", "application/dns-json").Run()
	if err != nil {
		return nil, err
	}
	err = r.JSONToPointer(&f)

	// Done
	return &f, nil
}

// FormatDNSJSON is used to format the DNS JSON.
func FormatDNSJSON(d DNSResponse) string {
	// Generate data array
	var RecordData [][]string
	for _, element := range d.Answer {
		data := []string{
			element.Name,
			strconv.Itoa(element.TTL) + "ms",
			element.Data,
		}
		RecordData = append(RecordData, data)
	}

	if len(RecordData) == 0 {
		return "  No data found  \n"
	}

	// Generate table
	tableString := &strings.Builder{}
	table := tablewriter.NewWriter(tableString)
	table.SetHeader([]string{"Name", "TTL", "Data"})
	table.SetBorder(false)
	table.AppendBulk(RecordData)
	table.Render()

	// Done
	return tableString.String()
}

// IsValidDomain checks if the domain is valid.
func IsValidDomain(d string) bool {
	domainReg := regexp.MustCompile(`([\w-]+\.)+\w+`)
	return domainReg.Match([]byte(d))
}

// DNS is the main message handler.
func DNS(args []string, s *discordgo.Session, m *discordgo.MessageCreate) {
	// Validate domain
	name := args[0]
	if !IsValidDomain(name) {
		_, _ = s.ChannelMessageSend(m.ChannelID, "Could not validate `"+name+"` as a domain")
		return
	}

	// Allow user types if valid
	var types []string
	if len(args) >= 2 {
		// If *, all types
		if args[1] == "*" {
			types = Types
		} else {
			// Or, use valid types from provided
			inter := Intersection(Types, args)
			if len(inter) > 0 {
				types = inter
			}
		}
	}

	// Default to A if no other types
	if len(types) == 0 {
		types = []string{
			"A",
		}
	}

	allData := make(map[string]string)
	listener := make(chan []string, len(types))

	// Run all the lookups in parallel
	for _, e := range types {
		go func(n string, t string) {
			DNSData, err := FetchDNSJSON(n, t)
			if err != nil {
				listener <- []string{t, WrapDataTitle(t, "Could not fetch due to an error")}
				return
			}
			FormatData := FormatDNSJSON(*DNSData)
			listener <- []string{t, WrapDataTitle(t, FormatData)}
		}(name, e)
	}

	// Wait for all goroutines to finish
	for range types {
		resp := <-listener
		allData[resp[0]] = resp[1]
	}

	// Sort
	keys := make([]string, 0, len(allData))
	for key := range allData {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	data := make([]string, 0)
	for _, key := range keys {
		data = append(data, allData[key]+"\n")
	}

	// Paginate data and send to channel
	paginator.Paginate(s, m, data, "```\n", "\n```")
}
