package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/fasthttp/websocket"
	"github.com/google/uuid"
)


// Define a global variable to hold the WebSocket clients.
var clientsAI map[string]*websocket.Conn
var lockAI sync.Mutex
var serversAI []string

func setupAIClients() {
	serversAI = strings.Split(os.Getenv("AI_WEBSOCKET_SERVERS"), ",")
	clientsAI = make(map[string]*websocket.Conn)

	for _, server := range serversAI {
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
					//broadcastMessage("mount", "./host/data.csv")
				}

				// Generate a unique UUID for the client
				clientUUID := uuid.New().String()

				// Add the client to the global clients map.
				lockAI.Lock()
				clientsAI[clientUUID] = c
				lockAI.Unlock()

				//run stuff here if you want on connection from server to server once
				//broadcastMessage("sysinfo", "")

				// Your code to interact with the WebSocket server goes here.
				// For example, to read messages from the server:
				for {
					_, message, err := c.ReadMessage()
					if err != nil {
						log.Println("read:", err)
						break
					}
					log.Printf("received: %s", message)
					//sendAllRelay(string(message))

					// Convert the message to a JSON object
					var jsonObject map[string]interface{}
					err = json.Unmarshal(message, &jsonObject)
					if err != nil {
						log.Println("json unmarshal:", err)
						break
					}

					ip := u.Hostname()
					port := u.Port()

					// Add a new key-value pair
					jsonObject["pcType"] = "aiPod"
					jsonObject["ip"] = ip
					jsonObject["port"] = port
					jsonObject["id"] = clientUUID

					// Convert the JSON object back to a string
					jsonString, err := json.Marshal(jsonObject)
					if err != nil {
						log.Println("json marshal:", err)
						break
					}
					fmt.Println("-------------------ai testing-----------")
					fmt.Println(string(jsonString))
					sendAllRelay(string(jsonString))
					/*fmt.Println(ip, port)
					geDataCacheRoot, _ := sendGetRequest("http://" + ip + ":" + port + "/path")
					fmt.Println(geDataCacheRoot)*/
				}

				c.Close()
				log.Println("disconnected from", u.String())
				
				// Remove the client from the global clients map.
				lockAI.Lock()
				delete(clientsAI, clientUUID)
				lockAI.Unlock()

				time.Sleep(1 * time.Second) // Wait for 1 second before trying to reconnect
			}
		}(server)
	}

	// Prevent the main function from exiting immediately.
	select {}
}


func broadcastMessageAI(action string, path string) {
	m := WSMessage{
		Action: action,
		Path:   path,
	}

	jsonData, err := json.Marshal(m)
	if err != nil {
		log.Println("json marshal:", err)
		return
	}

	lockAI.Lock()
	defer lockAI.Unlock()

	for _, c := range clientsAI {
		if err := c.WriteMessage(websocket.TextMessage, jsonData); err != nil {
			log.Println("write:", err)
		}
	}
}


func getClientsInfoAI() string {
	lockAI.Lock()
	defer lockAI.Unlock()

	type ClientInfo struct {
		UUID       string `json:"uuid"`
		RemoteAddr string `json:"remote_addr"`
	}

	clientsInfo := make([]ClientInfo, 0, len(clientsAI))
	for uuid, client := range clientsAI {
		clientsInfo = append(clientsInfo, ClientInfo{
			UUID:       uuid,
			RemoteAddr: client.RemoteAddr().String(),
		})
	}

	jsonData, err := json.Marshal(clientsInfo)
	if err != nil {
		log.Println("json marshal:", err)
		return ""
	}

	return string(jsonData)
}