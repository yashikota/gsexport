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
	if len(os.Args) != 2 {
		fmt.Println("Usage: gslides-exporter <presentation-url>")
		os.Exit(1)
	}

	url := os.Args[1]
	baseURL := "https://gslides-exporter.yashikota.workers.dev/api"

	// Fetch slides information
	resp, err := http.Get(fmt.Sprintf("%s/fetch-gslides?url=%s", baseURL, url))
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

		// Download screenshot
		screenshotURL := fmt.Sprintf("%s/screenshot?url=%s&name=%03d", baseURL, slideURL, i+1)
		resp, err := http.Get(screenshotURL)
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
