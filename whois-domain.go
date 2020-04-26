package main

import (
	"encoding/json"
	"net/http"
	"strings"
)

type WHOISDomainResponse struct {
	Success bool   `json:"success"`
	Raw     string `json:"raw"`
}

func FetchWHOISDomainJSON(domain string) (*WHOISDomainResponse, error) {
	// Create the http client & error
	var err error
	client := &http.Client{}

	// Run the request
	req, err := http.NewRequest("GET", "https://whoisjs.com/api/v1/"+domain, nil)
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
	var f WHOISDomainResponse
	err = json.NewDecoder(resp.Body).Decode(&f)
	if err != nil {
		return nil, err
	}

	// Done
	return &f, nil
}

func FormatWHOISDomainData(d WHOISDomainResponse) string {
	c := d.Raw
	c = strings.Replace(c, "\r\n", "\n", -1)
	c = strings.Trim(c, "\n")
	return c
}
