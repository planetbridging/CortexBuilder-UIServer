package main

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func setupRoutes(app *fiber.App) {
	app.Get("/", func(c *fiber.Ctx) error {
		//broadcastMessage(action string, path string)  testing
		//broadcastMessage("mount", "./host/data.csv")
		return c.SendString("Hello, World!")
	})

	setupHTTPClients()

	// Get the LST_TCP environment variable
	lstTcp := os.Getenv("LST_TCP")

	// Split the LST_TCP string into addresses
	addresses := strings.Split(lstTcp, ",")

	// Loop over the addresses
	for _, address := range addresses {
		// If the address is a localhost address with port 12345
		if strings.Contains(address, ":12345") {
			// Add a route for the reverse proxy
			app.Get("/row/"+address+"/*", func(c *fiber.Ctx) error {
				// Set the new host for the request
				newHost := strings.Replace(address, ":12345", ":4123", 1)

				// Forward the request
				url := "http://" + newHost + "/row" + c.Params("*") + "?" + string(c.Request().URI().QueryString())
				data, err := sendGetRequest(url)
				if err != nil {
					return c.Status(500).SendString(err.Error())
				}

				return c.SendString(data)
			})
		}
	}

	app.Get("/files/:uuid/*", reverseProxyHandler)

}

func sendGetRequest(url string) (string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}

func sendPostRequest(url string, data map[string]interface{}) (string, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}
