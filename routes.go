package main

import (
	"io/ioutil"
	"net/http"

	"github.com/gofiber/fiber/v2"
)

func setupRoutes(app *fiber.App) {
	app.Get("/", func(c *fiber.Ctx) error {
		//broadcastMessage(action string, path string)  testing
		broadcastMessage("mount", "./host/data.csv")
		return c.SendString("Hello, World!")
	})

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
