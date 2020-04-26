package main

import (
	"github.com/jakemakesstuff/structuredhttp"
	"strings"
)

// WHOISDomainResponse is the domain response from the WHOIS API.
type WHOISDomainResponse struct {
	Success bool   `json:"success"`
	Raw     string `json:"raw"`
}

// FetchWHOISDomainJSON is used to get the domain JSON.
func FetchWHOISDomainJSON(domain string) (*WHOISDomainResponse, error) {
	// Run the request
	var f WHOISDomainResponse
	r, err := structuredhttp.GET("https://whoisjs.com/api/v1/"+domain).Header(
		"Accept", "application/json").Run()
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

// FormatWHOISDomainData is used to format the domain data.
func FormatWHOISDomainData(d WHOISDomainResponse) string {
	c := d.Raw
	c = strings.Replace(c, "\r\n", "\n", -1)
	c = strings.Trim(c, "\n")
	return c
}
