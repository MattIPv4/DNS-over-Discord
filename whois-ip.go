package main

import (
	"github.com/jakemakesstuff/structuredhttp"
	"github.com/olekukonko/tablewriter"
	"strings"
)

// WHOISIPResponseResultInfo is the information about the response.
type WHOISIPResponseResultInfo struct {
	Count   int    `json:"count"`
	Cached  int    `json:"cached"`
	Bypass  int    `json:"bypass"`
	Version string `json:"version"`
}

// WHOISIPResponseServices is the services which the IP have assigned to them.
type WHOISIPResponseServices struct {
	Abusix  []string `json:"abusix"`
	BGPView []string `json:"bgpview"`
	RDAP    []string `json:"rdap"`
}

// WHOISIPResponseContacts is the abuse contacts for a IP.
type WHOISIPResponseContacts struct {
	Abuse []string `json:"abuse"`
}

// WHOISIPResponseResult is a result which is in an array within the response.
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

// WHOISIPResponse is the response from the WHOIS API relating to the IP address.
type WHOISIPResponse struct {
	Success     bool                      `json:"success"`
	Results     []WHOISIPResponseResult   `json:"results"`
	ResultsInfo WHOISIPResponseResultInfo `json:"results_info"`
}

// FetchWHOISIPJSON is used to fetch the IP address WHOIS JSON.
func FetchWHOISIPJSON(ip string) (*WHOISIPResponse, error) {
	// Run the request
	var f WHOISIPResponse
	r, err := structuredhttp.GET("https://www.cfwho.com/api/v1/"+ip).Header("Accept", "application/json").Run()
	if err != nil {
		return nil, err
	}
	err = r.JSONToPointer(&f)
	if err != nil {
		return nil, err
	}

	// Done
	return &f, nil
}

// FormatWHOISIPData is used to format IP address data.
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
