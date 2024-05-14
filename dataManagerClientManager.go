package main

import (
	"encoding/json"
	"log"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

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
			var c *websocket.Conn

			for {
				u, err := url.Parse(server)
				if err != nil {
					log.Println("parse:", err)
					continue
				}

				c, _, err = websocket.DefaultDialer.Dial(u.String(), nil)
				if err != nil {
					log.Println("dial:", err)
					time.Sleep(1 * time.Second) // Wait for 1 second before trying again
					continue
				} else {
					log.Println("connected to", u.String())
				}

				// Add the client to the global clients slice.
				lockDM.Lock()
				clientsDM = append(clientsDM, c)
				lockDM.Unlock()

				// Your code to interact with the WebSocket server goes here.
				// For example, to read messages from the server:
				for {
					_, message, err := c.ReadMessage()
					if err != nil {
						log.Println("read:", err)
						break
					}
					log.Printf("received: %s", message)
				}

				c.Close()
				log.Println("disconnected from", u.String())

				// Remove the client from the global clients slice.
				lockDM.Lock()
				for i, client := range clientsDM {
					if client == c {
						clientsDM = append(clientsDM[:i], clientsDM[i+1:]...)
						break
					}
				}
				lockDM.Unlock()

				time.Sleep(1 * time.Second) // Wait for 1 second before trying to reconnect
			}
		}(server)
	}

	// Prevent the main function from exiting immediately.
	select {}
}

func getClientsInfo() string {
	lockDM.Lock()
	defer lockDM.Unlock()

	type ClientInfo struct {
		RemoteAddr string `json:"remote_addr"`
	}

	clientsInfo := make([]ClientInfo, len(clientsDM))
	for i, client := range clientsDM {
		clientsInfo[i] = ClientInfo{
			RemoteAddr: client.RemoteAddr().String(),
		}
	}

	jsonData, err := json.Marshal(clientsInfo)
	if err != nil {
		log.Println("json marshal:", err)
		return ""
	}

	return string(jsonData)
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
