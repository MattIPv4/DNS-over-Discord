package main

import (
	"encoding/json"
	"github.com/bwmarrin/discordgo"
	"github.com/olekukonko/tablewriter"
	"net"
	"net/http"
	"strings"
)

type WHOISResponseResultInfo struct {
	Count   int    `json:"count"`
	Cached  int    `json:"cached"`
	Bypass  int    `json:"bypass"`
	Version string `json:"version"`
}

type WHOISResponseServices struct {
	Abusix  []string `json:"abusix"`
	BGPView []string `json:"bgpview"`
	RDAP    []string `json:"rdap"`
}

type WHOISResponseContacts struct {
	Abuse []string `json:"abuse"`
}

type WHOISResponseResult struct {
	ASN      []string              `json:"asn"`
	CIDR     string                `json:"cidr"`
	NetName  string                `json:"netname"`
	Location string                `json:"location"`
	IP       string                `json:"ip"`
	IPClass  string                `json:"ip_class"`
	Contacts WHOISResponseContacts `json:"contacts"`
	Services WHOISResponseServices `json:"services"`
}

type WHOISResponse struct {
	Success     bool                    `json:"success"`
	Results     []WHOISResponseResult   `json:"results"`
	ResultsInfo WHOISResponseResultInfo `json:"results_info"`
}

func FetchWHOISJSON(ip string) (*WHOISResponse, error) {
	// Create the http client & error
	var err error
	client := &http.Client{}

	// Run the request
	req, err := http.NewRequest("GET", "https://www.cfwho.com/api/v1/"+ip, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Accept", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Parse the JSON
	var f WHOISResponse
	err = json.NewDecoder(resp.Body).Decode(&f)
	if err != nil {
		return nil, err
	}

	// Done
	return &f, nil
}

func FormatWHOISData(d WHOISResponse) string {
	// Generate table
	tableString := &strings.Builder{}
	table := tablewriter.NewWriter(tableString)
	table.SetBorder(false)
	table.SetAlignment(tablewriter.ALIGN_LEFT)
	table.Append([]string{"NetName", d.Results[0].NetName})
	table.Append([]string{"CIDR", d.Results[0].CIDR})
	table.Append([]string{"Location", d.Results[0].Location})
	table.Append([]string{"ASN", strings.Join(d.Results[0].ASN, ", ")})
	table.Append([]string{"Abuse", strings.Join(d.Results[0].Contacts.Abuse, ", ")})
	table.Render()

	// Done
	return tableString.String()
}

func WHOIS(args []string, s *discordgo.Session, m *discordgo.MessageCreate) {
	// Validate ip
	ip := args[1]
	if net.ParseIP(ip) == nil {
		_, _ = s.ChannelMessageSend(m.ChannelID, "Could not validate `"+ip+"` as an IP address")
		return
	}

	// Get the response
	WHOISData, err := FetchWHOISJSON(ip)
	if err != nil {
		paginator.Paginate(s, m, []string{WrapDataTitle(ip, "Could not fetch due to error `"+err.Error()+"`")}, "```\n", "\n```")
		return
	}
	if WHOISData.ResultsInfo.Count < 1 {
		paginator.Paginate(s, m, []string{WrapDataTitle(ip, "No whois results found for this IP.")}, "```\n", "\n```")
		return
	}

	// Paginate data and send to channel
	paginator.Paginate(s, m, []string{WrapDataTitle(ip, FormatWHOISData(*WHOISData))}, "```\n", "\n```")
}
