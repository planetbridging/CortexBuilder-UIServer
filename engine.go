package main

import (
	"fmt"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
	
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Error loading .env file")
		return
	}

	envPort := os.Getenv("PORT")

	if envPort == "" {
		envPort = "4124"
	}

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST",
		AllowHeaders: "Origin, Content-Type, Accept",
	}))

	go setupDMClients()

	setupRoutes(app)

	app.Use("/ws", websocket.New(handleWebsocketConnection))

	go func() {
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			sendClientsInfo()
		}
	}()

	err = app.Listen(":" + envPort)
	if err != nil {
		fmt.Println(err)
	}
}
