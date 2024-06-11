package main

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"

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
	UUID string `json:"uuid"`
	Path string `json:"path"`
	Type string `json:"type"`
}

type DataPodConfig struct {
	UUID           string `json:"uuid"`
	SetProjectPath string `json:"setProjectPath"`
}

type InitializationPopulation struct {
	Path   string `json:"path"`
	Ip     string `json:"ip"`
	Amount int    `json:"amount"`
	AiPod  string `json:aiPod`
}

var (
	clients   = make(map[*websocket.Conn]string) // stores all active clients
	clientsMu sync.Mutex                         // ensures that updates to the clients map are thread-safe
)

func handleWebsocketConnection(c *websocket.Conn) {
	// Add this connection to the clients map when a new client connects
	clientID := c.RemoteAddr().String()
	clientsMu.Lock()
	clients[c] = clientID
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
			jsonData, err := clientManager.GetConnectedServersInfo()
			if err != nil {
				fmt.Printf("Error getting connected servers info: %v\n", err)
				return
			}

			fmt.Printf("Connected servers info: %s\n", jsonData)

			// Use json.RawMessage to avoid double encoding
			postData := map[string]interface{}{
				"msgType": "fulllist",
				"lstPods": json.RawMessage(jsonData),
			}

			// Marshal the postData map to JSON byte slice
			byteSlice, err := json.Marshal(postData)
			if err != nil {
				log.Fatalf("Error marshaling postData: %v", err)
			}

			errSend := c.WriteMessage(messageType, byteSlice)
			if errSend != nil {
				log.Println("write:", errSend)
			}

			break
		case "reqPathFromCache":
			/*var data PathData
			err := json.Unmarshal([]byte(msg.Data), &data)
			if err != nil {
				log.Println("json unmarshal data:", err)
				break
			}
			fmt.Println("loading reqPathFromCache")
			fmt.Println("Path:", data.Path)
			fmt.Println("UUID:", data.UUID)
			newPath := strings.ReplaceAll(data.UUID, "12345", "4123")

			sendGetReq, _ := sendGetRequest("http://" + newPath + data.Path)

			// Unmarshal the file list
			var fileList []File
			err = json.Unmarshal([]byte(sendGetReq), &fileList)
			if err != nil {
				log.Println("json unmarshal fileList:", err)
				break
			}

			// Create a ResponseData object
			responseData := ResponseData{
				UUID:     newPath,
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
			}*/
			processPathRequestMessage(msg, c, "reqPathFromCache", messageType)

			break
		case "reqPathFromCacheForBeforeMounting":
			processPathRequestMessage(msg, c, "reqPathFromCacheForBeforeMounting", messageType)
			break
		case "reqPathFromCacheForBeforeMountingShowingSelectedGeneration":
			processPathRequestMessage(msg, c, "reqPathFromCacheForBeforeMountingShowingSelectedGeneration", messageType)
			break
		case "setCurrentProjectPath":

			var responseData DataPodConfig
			err := json.Unmarshal([]byte(msg.Data), &responseData)
			if err != nil {
				log.Println("json unmarshal data:", err)
				break
			}

			//fmt.Println(responseData.SetProjectPath, responseData.UUID)

			newPath := strings.ReplaceAll(responseData.UUID, "12345", "4123")

			// URL of the create file endpoint
			url := "http://" + newPath + "/createfile"

			// Data to be sent in the POST request
			postData := map[string]interface{}{
				"Path": "/config.json",
				"Data": fmt.Sprintf("{\"setProjectPath\": \"%s\"}", responseData.SetProjectPath),
			}

			// Send POST request
			response, err := sendPostRequest(url, postData)
			if err != nil {
				fmt.Println("Error sending POST request:", err)
			} else {
				fmt.Println("Response from server:", response)
			}
			clientManager.RenewAllConfigs()
		case "createFolderForCache":
			var data ResponseDataSimple
			err := json.Unmarshal([]byte(msg.Data), &data)
			if err != nil {
				log.Println("json unmarshal data:", err)
				break
			}

			newPath := strings.ReplaceAll(data.UUID, "12345", "4123")

			cleanPath := data.Path
			if strings.HasPrefix(cleanPath, "/path/") {
				cleanPath = strings.TrimPrefix(cleanPath, "/path/")
			}

			url := "http://" + newPath + "/createfolder"
			postData := map[string]interface{}{
				"Path": "./" + cleanPath, // replace with your actual directory path
			}
			response, err := sendPostRequest(url, postData)
			if err != nil {
				fmt.Println(err)
			}
			fmt.Println(response)
			break

		case "initializationPopulation":
			/*type InitializationPopulation struct {
				Path string `json:"path"`
				Ip string `json:"ip"`
				Amount int `json:"amount"`
			}*/
			var data InitializationPopulation
			err := json.Unmarshal([]byte(msg.Data), &data)
			if err != nil {
				log.Println("json unmarshal data:", err)
				break
			}
			fmt.Println(data)

			dataAi := map[string]interface{}{
				"clientID":  clientID,
				"path":      data.Path,
				"amount":    data.Amount,
				"dataCache": data.Ip,
				"type":      "initializationPopulation",
			}
			clientManager.SendJSONData(data.AiPod, dataAi)
			/*message := sendJSONDataToClient(clientID, dataAi)
			fmt.Println(message)*/

			break

		case "mountData":
			/*type InitializationPopulation struct {
				Path string `json:"path"`
				Ip string `json:"ip"`
				Amount int `json:"amount"`
			}*/
			var data InitializationPopulation
			err := json.Unmarshal([]byte(msg.Data), &data)
			if err != nil {
				log.Println("json unmarshal data:", err)
				break
			}
			fmt.Println(data)

			dataToMount := map[string]interface{}{
				"clientID": clientID,
				"path":     data.Path,
				"type":     "mountData",
			}
			clientManager.SendJSONData(data.Ip, dataToMount)
			/*message := sendJSONDataToClient(clientID, dataAi)
			fmt.Println(message)*/

			break
		case "startEval":
			/*type InitializationPopulation struct {
				Path string `json:"path"`
				Ip string `json:"ip"`
				Amount int `json:"amount"`
			}*/

			var data map[string]interface{}
			err := json.Unmarshal([]byte(msg.Data), &data)
			if err != nil {
				log.Println("json unmarshal data:", err)
				return
			}
			fmt.Println(data)
			fmt.Println(data["aiPod"])
			AiPod, ok := data["aiPod"].(string)
			if !ok {
				log.Println("aiPod is not a string")
			} else {
				data["type"] = "startEval"
				data["clientID"] = clientID

				clientManager.SendJSONData(AiPod, data)
			}

			/*dataToMount := map[string]interface{}{
				"clientID": clientID,
				"path":     data.Path,
				"type":     "mountData",
			}*/
			//clientManager.SendJSONData(data.Ip, dataToMount)
			/*message := sendJSONDataToClient(clientID, dataAi)
			fmt.Println(message)*/

			break
		default:
			log.Println("unknown message type:", msg.Type)
			log.Println(msg)
		}
	}
}

func sendClientsInfo() {
	clientsInfo := getClientsInfo()
	clientsInfoAI := getClientsInfoAI()
	//fmt.Println(clientsInfo)

	response := struct {
		LstAiPods    string `json:"lstAiPods"`
		LstDataCache string `json:"lstDataCache"`
		Type         string `json:type"`
	}{
		LstAiPods:    clientsInfoAI,
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

func sendJSONDataToClient(clientID string, data interface{}) string {
	clientsMu.Lock()
	var c *websocket.Conn
	for conn, id := range clients {
		if id == clientID {
			c = conn
			break
		}
	}
	clientsMu.Unlock()
	if c == nil {
		return fmt.Sprintf("Client %s not found", clientID)
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Sprintf("Error marshaling JSON: %v", err)
	}

	err = c.WriteMessage(websocket.TextMessage, jsonData)
	if err != nil {
		return fmt.Sprintf("Error sending data: %v", err)
	}

	return "Data sent successfully"
}
