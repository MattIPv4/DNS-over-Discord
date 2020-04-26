package main

import (
	"encoding/json"
	"github.com/olekukonko/tablewriter"
	"net/http"
	"strings"
)

type WHOISIPResponseResultInfo struct {
	Count   int    `json:"count"`
	Cached  int    `json:"cached"`
	Bypass  int    `json:"bypass"`
	Version string `json:"version"`
}

type WHOISIPResponseServices struct {
	Abusix  []string `json:"abusix"`
	BGPView []string `json:"bgpview"`
	RDAP    []string `json:"rdap"`
}

type WHOISIPResponseContacts struct {
	Abuse []string `json:"abuse"`
}

type WHOISIPResponseResult struct {
	ASN      []string                `json:"asn"`
	CIDR     string                  `json:"cidr"`
	NetName  string                  `json:"netname"`
	Location string                  `json:"location"`
	IP       string                  `json:"ip"`
	IPClass  string                  `json:"ip_class"`
	Contacts WHOISIPResponseContacts `json:"contacts"`
	Services WHOISIPResponseServices `json:"services"`
}

type WHOISIPResponse struct {
	Success     bool                      `json:"success"`
	Results     []WHOISIPResponseResult   `json:"results"`
	ResultsInfo WHOISIPResponseResultInfo `json:"results_info"`
}

func FetchWHOISIPJSON(ip string) (*WHOISIPResponse, error) {
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
	var f WHOISIPResponse
	err = json.NewDecoder(resp.Body).Decode(&f)
	if err != nil {
		return nil, err
	}

	// Done
	return &f, nil
}

func FormatWHOISIPData(d WHOISIPResponse) string {
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
