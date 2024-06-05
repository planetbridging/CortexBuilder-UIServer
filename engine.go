package main

import (
	"fmt"
	"os"

	//"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"

	"github.com/joho/godotenv"
)

var envPWD string

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

	envPWD = os.Getenv("SERVERPWD")
	fmt.Println(envPWD)
	if envPWD == "" {
		envPWD = "securepassword"
		//os.Setenv("FILE_PATH", envPath)
	}

	app := fiber.New()

	/*app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST",
		AllowHeaders: "Origin, Content-Type, Accept",
	}))*/

	app.Use(cors.New(cors.Config{
		AllowOrigins:     "*", // Allows all domains
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		ExposeHeaders:    "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Cache-Control, Content-Language, Content-Type",
		AllowCredentials: false,
	}))

	app.Use(customCORSHandler) // Use custom CORS before your routes or global middleware

	//go setupDMClients()
	//go setupAIClients()
	go tcpClientSetup()

	setupRoutes(app)

	app.Use("/ws", websocket.New(handleWebsocketConnection))
	/*
		go func() {
			ticker := time.NewTicker(1 * time.Second)
			defer ticker.Stop()

			for range ticker.C {
				sendClientsInfo()
			}
		}()*/

	err = app.Listen(":" + envPort)
	if err != nil {
		fmt.Println(err)
	}
}

func customCORSHandler(c *fiber.Ctx) error {
	c.Set("Access-Control-Allow-Origin", c.Get("Origin")) // Echo back the Origin header, or specify dynamically
	c.Set("Access-Control-Allow-Credentials", "true")
	c.Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")

	if c.Method() == "OPTIONS" {
		return c.SendStatus(fiber.StatusOK) // Handle preflight requests
	}

	return c.Next()
}

func keysExist(js map[string]interface{}, keys []string) bool {
	for _, key := range keys {
		if _, ok := js[key]; !ok {
			return false
		}
	}
	return true
}
