package main

import (
	"encoding/json"
	"log"
	"net/url"
	"os"
	"strings"
	"sync"

	"github.com/fasthttp/websocket"
)

type WSMessage struct {
	Action string `json:"action"`
	Path   string `json:"path"`
}

// Define a global variable to hold the WebSocket clients.
var clientsDM []*websocket.Conn
var lockDM sync.Mutex
var serversDM []string

func setupDMClients() {
	serversDM = strings.Split(os.Getenv("DM_WEBSOCKET_SERVERS"), ",")

	for _, server := range serversDM {
		go func(server string) {
			u, err := url.Parse(server)
			if err != nil {
				log.Fatal("parse:", err)
			}
			log.Printf("connecting to %s", u.String())

			c, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
			if err != nil {
				log.Fatal("dial:", err)
			} else {
				log.Println("connected to", u.String())
			}

			// Add the client to the global clients slice.
			lockDM.Lock()
			clientsDM = append(clientsDM, c)
			lockDM.Unlock()

			defer c.Close()

			// Your code to interact with the WebSocket server goes here.
			// For example, to read messages from the server:
			for {
				_, message, err := c.ReadMessage()
				if err != nil {
					log.Println("read:", err)
					return
				}
				log.Printf("received: %s", message)
			}
		}(server)
	}

	// Prevent the main function from exiting immediately.
	select {}
}

func broadcastMessage(action string, path string) {
	m := WSMessage{
		Action: action,
		Path:   path,
	}

	jsonData, err := json.Marshal(m)
	if err != nil {
		log.Println("json marshal:", err)
		return
	}

	lockDM.Lock()
	for _, c := range clientsDM {
		if err := c.WriteMessage(websocket.TextMessage, jsonData); err != nil {
			log.Println("write:", err)
		}
	}
	lockDM.Unlock()
}
