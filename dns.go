package main

import (
	"encoding/json"
	"github.com/bwmarrin/discordgo"
	"math"
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

func FormatDNSJSON(d DNS) map[string]string {
	// Generate data array
	sections := make(map[int][][]string)
	for _, element := range d.Answer {
		data := []string{
			element.Name,
			strconv.Itoa(element.TTL) + "ms",
			element.Data,
		}
		if sections[element.Type] == nil {
			sections[element.Type] = [][]string{}
		}
		sections[element.Type] = append(sections[element.Type], data)
	}

	// Generate tables
	tables := make(map[string]string)
	for key, value := range sections {
		tableString := &strings.Builder{}
		table := tablewriter.NewWriter(tableString)
		table.SetHeader([]string{"Name", "TTL", "Data"})
		table.SetBorder(false)
		table.AppendBulk(value)
		table.Render()
		tables[TypeMap[key]] = tableString.String()
	}

	// Done
	return tables
}

func TitleFormat(l int, p string, t string) string {
	space := l - len(t) - 2
	left := math.Ceil(float64(space) / float64(2))
	right := math.Floor(float64(space) / float64(2))
	return strings.Repeat(p, int(left)) + " " + t + " " + strings.Repeat(p, int(right))
}

func SendDNSJSON(d map[string]string, s *discordgo.Session, m *discordgo.MessageCreate) (*discordgo.Message, error) {
	var sections []string
	for key, value := range d {
		l := len(strings.Split(value, "\n")[1])
		sections = append(sections, TitleFormat(l, "=", key)+"\n"+value+strings.Repeat("=", l))
	}
	message, err := s.ChannelMessageSend(m.ChannelID, "```\n"+strings.Join(sections, "\n")+"\n```")
	return message, err
}

func DoDNS(n string, t string, s *discordgo.Session, m *discordgo.MessageCreate) (*discordgo.Message, error) {
	DNSData, err := FetchDNSJSON(n, t)
	if err != nil {
		message, err := s.ChannelMessageSend(m.ChannelID, "Could not fetch due to error `"+err.Error()+"`")
		return message, err
	}
	FormatData := FormatDNSJSON(*DNSData)
	message, err := SendDNSJSON(FormatData, s, m)
	return message, err
}
