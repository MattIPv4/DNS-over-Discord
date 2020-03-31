package main

import (
	"encoding/json"
	"fmt"
	"github.com/bwmarrin/discordgo"
	"github.com/olekukonko/tablewriter"
	"io/ioutil"
	"net"
	"net/http"
	"strings"
)

type WHOISResponseResultInfo struct {
	count   int
	cached  int
	bypass  int
	version string
}

type WHOISResponseServices struct {
	abusix  []string
	bgpview []string
	rdap    []string
}

type WHOISResponseContacts struct {
	abuse []string
}

type WHOISResponseResult struct {
	asn      []string
	cidr     string
	netname  string
	location string
	ip       string
	ip_class string
	contacts WHOISResponseContacts
	services WHOISResponseServices
}

type WHOISResponse struct {
	success      bool
	results      []WHOISResponseResult
	results_info WHOISResponseResultInfo
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

	body, err := ioutil.ReadAll(resp.Body)
	fmt.Println(string(body))

	// Parse the JSON
	var f WHOISResponse
	err = json.NewDecoder(strings.NewReader(string(body))).Decode(&f)
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
	table.Append([]string{"NetName", d.results[0].netname})
	table.Append([]string{"CIDR", d.results[0].cidr})
	table.Append([]string{"Location", d.results[0].location})
	table.Append([]string{"ASN", strings.Join(d.results[0].asn, ", ")})
	table.Append([]string{"Abuse", strings.Join(d.results[0].contacts.abuse, ", ")})
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
	output := make([]string, 1)
	if err != nil {
		output[0] = WrapDataTitle(ip, "Could not fetch due to error `"+err.Error()+"`")
	} else {
		output[0] = WrapDataTitle(ip, FormatWHOISData(*WHOISData))
	}

	// Paginate data and send to channel
	paginator.Paginate(s, m, output, "```\n", "\n```")
}
