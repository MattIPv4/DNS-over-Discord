package main

import (
	"github.com/jakemakesstuff/structuredhttp"
	"github.com/openrdap/rdap"
)

type RDAPResponse struct {
	Success bool                       `json:"success"`
	Results map[string]RDAPSubResponse `json:"results"`
}

type RDAPSubResponse struct {
	Success bool   `json:"success"`
	Type    string `json:"type"`
	Data    []byte `json:"data"`
}

func FetchRawRDAP(query string) (*RDAPResponse, error) {
	// Run the request
	var f RDAPResponse
	r, err := structuredhttp.GET("https://rdap.cloud/api/v1/"+query).Header(
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

func FetchRDAP(query string) (interface{}, error) {
	// Fetch raw response
	raw, err := FetchRawRDAP(query)
	if err != nil {
		return nil, err
	}

	// Validate response
	if !raw.Success {
		return nil, err
	}

	// Return the parsed first result
	for k := range raw.Results {
		// Validate response
		if !raw.Results[k].Success {
			continue
		}

		d := rdap.NewDecoder(raw.Results[k].Data)
		return d.Decode()
	}

	// There were no results
	return nil, err
}
