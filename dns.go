package main

import (
	"encoding/json"
	"github.com/bwmarrin/discordgo"
	"net/http"
	"net/url"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/olekukonko/tablewriter"
)

var TypeMap = map[int]string{
	1:   "A",
	2:   "NS",
	5:   "CNAME",
	15:  "MX",
	16:  "TXT",
	28:  "AAAA",
	33:  "SRV",
	257: "CAA",
}

type Question struct {
	Name string `json:"name"`
	Type int    `json:"type"`
}

func (item Question) TypeString() string {
	return TypeMap[item.Type]
}

type Answer struct {
	Name string `json:"name"`
	Type int    `json:"type"`
	TTL  int    `json:"TTL"`
	Data string `json:"data"`
}

func (item Answer) TypeString() string {
	return TypeMap[item.Type]
}

type Authority struct {
	Name string `json:"name"`
	Type int    `json:"type"`
	TTL  int    `json:"TTL"`
	Data string `json:"data"`
}

func (item Authority) TypeString() string {
	return TypeMap[item.Type]
}

type DNSResponse struct {
	Status    int
	TC        bool
	RD        bool
	RA        bool
	AD        bool
	CD        bool
	Question  []Question
	Answer    []Answer
	Authority []Authority
}

func FetchDNSJSON(u string, t string) (*DNSResponse, error) {
	// Create the query params
	params := url.Values{}
	params.Add("name", u)
	if t != "" {
		params.Add("type", t)
	}
	query := params.Encode()

	// Create the http client & error
	var err error
	client := &http.Client{}

	// Run the request
	req, err := http.NewRequest("GET", "https://cloudflare-dns.com/dns-query?"+query, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Accept", "application/dns-json")
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Parse the JSON
	var f DNSResponse
	err = json.NewDecoder(resp.Body).Decode(&f)
	if err != nil {
		return nil, err
	}

	// Done
	return &f, nil
}

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

func IsValidDomain(d string) bool {
	domainReg := regexp.MustCompile(`([\w-]+\.)+\w+`)
	return domainReg.Match([]byte(d))
}

func DNS(args []string, s *discordgo.Session, m *discordgo.MessageCreate) {
	// Validate domain
	name := args[0]
	if !IsValidDomain(name) {
		_, _ = s.ChannelMessageSend(m.ChannelID, "Could not validate `"+name+"` as a domain")
		return
	}

	// Default to all types
	var types []string
	for _, value := range TypeMap {
		types = append(types, value)
	}

	// Allow user types if valid
	if len(args) >= 2 {
		inter := Intersection(types, args)
		if len(inter) > 0 {
			types = inter
		}
	}

	allData := make(map[string]string)
	listener := make(chan []string, len(types))

	// Run all the lookups in parallel
	for _, e := range types {
		go func(n string, t string) {
			DNSData, err := FetchDNSJSON(n, t)
			if err != nil {
				listener <- []string{t, WrapDataTitle(t, "Could not fetch due to error `"+err.Error()+"`")}
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
		data = append(data, allData[key])
	}

	// Paginate data and send to channel
	paginator.Paginate(s, m, data, "```\n", "\n```")
}
