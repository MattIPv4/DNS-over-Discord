package main

import (
	"encoding/json"
	"github.com/bwmarrin/discordgo"
	"net/http"
	"net/url"
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

type DNS struct {
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

func FetchDNSJSON(u string, t string) (*DNS, error) {
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
	var f DNS
	err = json.NewDecoder(resp.Body).Decode(&f)
	if err != nil {
		return nil, err
	}

	// Done
	return &f, nil
}

func FormatDNSJSON(d DNS) string {
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

func DoDNS(n string, t []string, s *discordgo.Session, m *discordgo.MessageCreate) {
	allData := make(map[string]string)
	listener := make(chan []string, len(t))

	// Run all the lookups in parallel
	for _, e := range t {
		go func(n string, t string) {
			DNSData, err := FetchDNSJSON(n, t)
			if err != nil {
				listener <- []string{t, WrapDataTitle(t, "Could not fetch due to error `"+err.Error()+"`")}
				return
			}
			FormatData := FormatDNSJSON(*DNSData)
			listener <- []string{t, WrapDataTitle(t, FormatData)}
		}(n, e)
	}

	// Wait for all goroutines to finish
	for range t {
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
	pages := Paginate(data, "```\n", "\n```")
	for _, page := range pages {
		_, _ = s.ChannelMessageSend(m.ChannelID, page)
	}
}