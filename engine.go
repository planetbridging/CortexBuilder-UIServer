package main

import (
	"fmt"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
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

	err = app.Listen(":" + envPort)
	if err != nil {
		fmt.Println(err)
	}
}
