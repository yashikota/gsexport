package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// Response represents the API response structure
type Response struct {
	Title  string   `json:"title"`
	Total  int      `json:"total"`
	Slides []string `json:"slides"`
}

func main() {
	// Check required environment variables
	accountID := os.Getenv("ACCOUNT_ID")
	if accountID == "" {
		fmt.Println("Error: ACCOUNT_ID environment variable is not set")
		os.Exit(1)
	}

	apiToken := os.Getenv("API_TOKEN")
	if apiToken == "" {
		fmt.Println("Error: API_TOKEN environment variable is not set")
		os.Exit(1)
	}

	if len(os.Args) != 2 {
		fmt.Println("Usage: gsexport <presentation-url>")
		os.Exit(1)
	}

	url := os.Args[1]
	baseURL := "https://gsexport.yashikota.workers.dev/api"

	// Create HTTP client with custom headers
	client := &http.Client{}
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/slide-info?url=%s", baseURL, url), nil)
	if err != nil {
		fmt.Printf("Error creating request: %v\n", err)
		os.Exit(1)
	}

	// Add headers
	req.Header.Add("X-Account-ID", accountID)
	req.Header.Add("X-API-Token", apiToken)

	// Fetch slides information
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Error fetching slides: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	var data Response
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		fmt.Printf("Error decoding response: %v\n", err)
		os.Exit(1)
	}

	// Create directory with title
	dirName := strings.ReplaceAll(data.Title, " ", "_")
	if err := os.MkdirAll(dirName, 0755); err != nil {
		fmt.Printf("Error creating directory: %v\n", err)
		os.Exit(1)
	}

	// Download each slide
	for i, slideURL := range data.Slides {
		fmt.Printf("Downloading slide %d/%d...\n", i+1, data.Total)

		// Generate filename with zero-padded index
		filename := fmt.Sprintf("%s/%03d.png", dirName, i+1)

		// Create request for screenshot
		req, err := http.NewRequest("GET", fmt.Sprintf("%s/screenshot?url=%s&name=%03d", baseURL, slideURL, i+1), nil)
		if err != nil {
			fmt.Printf("Error creating request for slide %d: %v\n", i+1, err)
			continue
		}

		// Add headers
		req.Header.Add("X-Account-ID", accountID)
		req.Header.Add("X-API-Token", apiToken)

		// Download screenshot
		resp, err := client.Do(req)
		if err != nil {
			fmt.Printf("Error downloading slide %d: %v\n", i+1, err)
			continue
		}
		defer resp.Body.Close()

		// Create file
		out, err := os.Create(filename)
		if err != nil {
			fmt.Printf("Error creating file %s: %v\n", filename, err)
			continue
		}
		defer out.Close()

		// Copy response body to file
		if _, err := io.Copy(out, resp.Body); err != nil {
			fmt.Printf("Error saving slide %d: %v\n", i+1, err)
			continue
		}

		// Add delay between API calls
		if i < len(data.Slides)-1 {
			time.Sleep(8 * time.Second)
		}
	}

	fmt.Printf("Successfully exported %d slides to directory: %s\n", data.Total, dirName)
}
