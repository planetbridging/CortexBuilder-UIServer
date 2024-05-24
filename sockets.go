package main

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"strings"
	"github.com/gofiber/websocket/v2"
)

type Message struct {
	Type string `json:"Type"`
	Data string `json:"data"`
}

type PathData struct {
	Path string `json:"path"`
	UUID string `json:"uuid"`
}

type File struct {
	Name string `json:"name"`
	Size string `json:"size"`
	Type string `json:"type"`
}

type ResponseData struct {
	UUID     string `json:"uuid"`
	Path     string `json:"path"`
	Contents []File `json:"contents"`
	Type     string `json:"type"`
}

type ResponseDataSimple struct {
	UUID     string `json:"uuid"`
	Path     string `json:"path"`
	Type     string `json:"type"`
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
		case "setCurrentProjectPath":
			/*type ResponseDataSimple struct {
	UUID     string `json:"uuid"`
	Path     string `json:"path"`
	Type     string `json:"type"`
}*/
			var responseData ResponseDataSimple
			err := json.Unmarshal([]byte(msg.Data), &responseData)
			if err != nil {
				log.Println("json unmarshal data:", err)
				break
			}

			fmt.Println(responseData.Path, responseData.UUID)

			foundDataCache := getClientRemoteAddr(responseData.UUID)

			// URL of the create file endpoint
			url := "http://" + foundDataCache + "/createfile"

			// Data to be sent in the POST request
			postData := map[string]interface{}{
				"Path": "/config.json", // Ensure this path is allowed by your server logic
				"Data": "{hello: 'bob'}",
			}

			// Send POST request
			response, err := sendPostRequest(url, postData)
			if err != nil {
				fmt.Println("Error sending POST request:", err)
			} else {
				fmt.Println("Response from server:", response)
			}


			

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
			broadcastMessage("sysinfo", "")
		case "reqPathFromCache":
			var data PathData
			err := json.Unmarshal([]byte(msg.Data), &data)
			if err != nil {
				log.Println("json unmarshal data:", err)
				break
			}
			fmt.Println("loading reqPathFromCache")
			fmt.Println("Path:", data.Path)
			fmt.Println("UUID:", data.UUID)
			reqPathData := sendGetRequestToOneRelay(data.UUID, data.Path)
			fmt.Println(reqPathData)

			// Unmarshal the file list
			var fileList []File
			err = json.Unmarshal([]byte(reqPathData), &fileList)
			if err != nil {
				log.Println("json unmarshal fileList:", err)
				break
			}

			// Create a ResponseData object
			responseData := ResponseData{
				UUID:     data.UUID,
				Path:     data.Path,
				Contents: fileList,
				Type:     "reqPathFromCache",
			}

			// Marshal the ResponseData object into JSON
			jsonData, err := json.Marshal(responseData)
			if err != nil {
				log.Println("json marshal:", err)
				break
			}

			// Send the JSON data back to the client
			err = c.WriteMessage(messageType, jsonData)
			if err != nil {
				log.Println("write:", err)
				break
			}
			break
		case "createFolderForCache":
			var data ResponseDataSimple
			err := json.Unmarshal([]byte(msg.Data), &data)
			if err != nil {
				log.Println("json unmarshal data:", err)
				break
			}
			
			foundDataCache := getClientRemoteAddr(data.UUID)

			
			cleanPath := data.Path
			if strings.HasPrefix(cleanPath, "/path/") {
				cleanPath = strings.TrimPrefix(cleanPath, "/path/")
			}

			url := "http://" + foundDataCache + "/createfolder"
			postData := map[string]interface{}{
				"Path": "./"+cleanPath, // replace with your actual directory path
			}
			response, err := sendPostRequest(url, postData)
			if err != nil {
				fmt.Println(err)
			}
			fmt.Println(response)
			break
		default:
			log.Println("unknown message type:", msg.Type)
		}
	}
}

func sendClientsInfo() {
	clientsInfo := getClientsInfo()
	//fmt.Println(clientsInfo)

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

func sendAllRelay(jsonString string) {
	var response map[string]interface{}
	err := json.Unmarshal([]byte(jsonString), &response)
	if err != nil {
		log.Println("json unmarshal:", err)
		return
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
