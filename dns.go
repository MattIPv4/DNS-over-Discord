package main

import (
	"encoding/json"
	"github.com/bwmarrin/discordgo"
	"net/http"
	"net/url"
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

func DoDNS(n string, t []string, s *discordgo.Session, m *discordgo.MessageCreate) (*discordgo.Message, error) {
	var AllData []string
	listener := make(chan string, len(t))

	// Run all the lookups in parallel
	for _, e := range t {
		go func(n string, t string) {
			DNSData, err := FetchDNSJSON(n, t)
			if err != nil {
				listener <- WrapDataTitle(t, "Could not fetch due to error `"+err.Error()+"`")
				return
			}
			FormatData := FormatDNSJSON(*DNSData)
			listener <- WrapDataTitle(t, FormatData)
		}(n, e)
	}

	// Wait for all goroutines to finish
	for range t {
		AllData = append(AllData, <-listener)
	}

	// TODO: Paginate to keep under 2048
	message, err := s.ChannelMessageSend(m.ChannelID, "```\n"+strings.Join(AllData, "\n\n")+"\n```")
	return message, err
}
