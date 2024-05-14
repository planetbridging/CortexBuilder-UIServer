package main

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/gofiber/websocket/v2"
)

type Message struct {
	Type string `json:"Type"`
	Data string `json:"data"`
}

type ClientInfo struct {
	URL string `json:"url"`
}

var urlsDM = make(map[*websocket.Conn]string)

func handleWebsocketConnection(c *websocket.Conn) {
	for {
		messageType, message, err := c.ReadMessage()
		if err != nil {
			log.Println("read:", err)
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
		case "getClients":
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
				break
			}

			err = c.WriteMessage(websocket.TextMessage, jsonData)
			if err != nil {
				log.Println("write:", err)
				break
			}

		default:
			log.Println("unknown message type:", msg.Type)
		}
	}
}
