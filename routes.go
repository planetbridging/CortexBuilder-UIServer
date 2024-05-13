package main

import (
	"github.com/gofiber/fiber/v2"
)

func setupRoutes(app *fiber.App) {
	app.Get("/", func(c *fiber.Ctx) error {
		//broadcastMessage(action string, path string)  testing
		broadcastMessage("mount", "./host/data.csv")
		return c.SendString("Hello, World!")
	})

}
