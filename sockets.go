package main

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"github.com/gofiber/websocket/v2"
)

type Message struct {
	Type string `json:"Type"`
	Data string `json:"data"`
}

var (
	clients   = make(map[*websocket.Conn]bool) // stores all active clients
	clientsMu sync.Mutex                       // ensures that updates to the clients map are thread-safe
)

func handleWebsocketConnection(c *websocket.Conn) {
	// Add this connection to the clients map when a new client connects
	clientsMu.Lock()
	clients[c] = true
	clientsMu.Unlock()

	for {
		messageType, message, err := c.ReadMessage()
		if err != nil {
			log.Println("read:", err)

			// Remove this connection from the clients map when a client disconnects
			clientsMu.Lock()
			delete(clients, c)
			clientsMu.Unlock()

			break
		}

		var msg Message
		err = json.Unmarshal(message, &msg)
		if err != nil {
			log.Println("json unmarshal:", err)
			break
		}

		switch msg.Type {
		case "ping":
			response := Message{
				Type: "pong",
				Data: "",
			}
			jsonData, err := json.Marshal(response)
			if err != nil {
				log.Println("json marshal:", err)
				break
			}
			err = c.WriteMessage(messageType, jsonData)
			if err != nil {
				log.Println("write:", err)
				break
			}
		default:
			log.Println("unknown message type:", msg.Type)
		}
	}
}

func sendClientsInfo() {
	clientsInfo := getClientsInfo()
	fmt.Println(clientsInfo)

	response := struct {
		LstDataCache string `json:"lstDataCache"`
		Type         string `json:type"`
	}{
		LstDataCache: clientsInfo,
		Type:         "getClients",
	}

	jsonData, err := json.Marshal(response)
	if err != nil {
		log.Println("json marshal:", err)
		return
	}

	clientsMu.Lock()
	for client := range clients {
		err = client.WriteMessage(websocket.TextMessage, jsonData)
		if err != nil {
			log.Println("write:", err)
		}
	}
	clientsMu.Unlock()
}

func sendClientsInfoManually(c *websocket.Conn) {
	clientsInfo := getClientsInfo()
	fmt.Println(clientsInfo)

	response := struct {
		LstDataCache string `json:"lstDataCache"`
		Type         string `json:type"`
	}{
		LstDataCache: clientsInfo,
		Type:         "getClients",
	}

	jsonData, err := json.Marshal(response)
	if err != nil {
		log.Println("json marshal:", err)
		return
	}

	err = c.WriteMessage(websocket.TextMessage, jsonData)
	if err != nil {
		log.Println("write:", err)
	}
}
