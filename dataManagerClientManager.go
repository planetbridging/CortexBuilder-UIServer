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

type WSMessage struct {
	Action string `json:"action"`
	Path   string `json:"path"`
}

// Define a global variable to hold the WebSocket clients.
var clientsDM map[string]*websocket.Conn
var lockDM sync.Mutex
var serversDM []string

func setupDMClients() {
	serversDM = strings.Split(os.Getenv("DM_WEBSOCKET_SERVERS"), ",")
	clientsDM = make(map[string]*websocket.Conn)

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
					//broadcastMessage("mount", "./host/data.csv")
				}

				// Generate a unique UUID for the client
				clientUUID := uuid.New().String()

				// Add the client to the global clients map.
				lockDM.Lock()
				clientsDM[clientUUID] = c
				lockDM.Unlock()

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
					jsonObject["pcType"] = "dataCache"
					jsonObject["ip"] = ip
					jsonObject["port"] = port
					jsonObject["id"] = clientUUID

					// Convert the JSON object back to a string
					jsonString, err := json.Marshal(jsonObject)
					if err != nil {
						log.Println("json marshal:", err)
						break
					}
					//fmt.Println(string(jsonString))
					sendAllRelay(string(jsonString))
					/*fmt.Println(ip, port)
					geDataCacheRoot, _ := sendGetRequest("http://" + ip + ":" + port + "/path")
					fmt.Println(geDataCacheRoot)*/
				}

				c.Close()
				log.Println("disconnected from", u.String())

				// Remove the client from the global clients map.
				lockDM.Lock()
				delete(clientsDM, clientUUID)
				lockDM.Unlock()

				time.Sleep(1 * time.Second) // Wait for 1 second before trying to reconnect
			}
		}(server)
	}

	// Prevent the main function from exiting immediately.
	select {}
}

func sendGetRequestToOneRelay(clientUUID string, message string) string {
	lockDM.Lock()
	defer lockDM.Unlock()

	client, ok := clientsDM[clientUUID]
	if !ok {
		log.Println("Client with UUID", clientUUID, "not found")
		return ""
	}

	fmt.Println("Client address:", client.RemoteAddr())
	sendGetReq, _ := sendGetRequest("http://" + client.RemoteAddr().String() + message)
	return sendGetReq
	/*if err := client.WriteMessage(websocket.TextMessage, []byte(message)); err != nil {
		log.Println("write:", err)
	}*/
}

func sendMessageToClient(clientUUID string, message string) {
	lockDM.Lock()
	defer lockDM.Unlock()

	client, ok := clientsDM[clientUUID]
	if !ok {
		log.Println("Client with UUID", clientUUID, "not found")
		return
	}

	if err := client.WriteMessage(websocket.TextMessage, []byte(message)); err != nil {
		log.Println("write:", err)
	}
}

func getClientRemoteAddr(clientUUID string) string {
	lockDM.Lock()
	defer lockDM.Unlock()

	client, ok := clientsDM[clientUUID]
	if !ok {
		log.Println("Client with UUID", clientUUID, "not found")
		return ""
	}
	return client.RemoteAddr().String()
}

func getClientsInfo() string {
	lockDM.Lock()
	defer lockDM.Unlock()

	type ClientInfo struct {
		UUID       string `json:"uuid"`
		RemoteAddr string `json:"remote_addr"`
	}

	clientsInfo := make([]ClientInfo, 0, len(clientsDM))
	for uuid, client := range clientsDM {
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
	defer lockDM.Unlock()

	for _, c := range clientsDM {
		if err := c.WriteMessage(websocket.TextMessage, jsonData); err != nil {
			log.Println("write:", err)
		}
	}
}
