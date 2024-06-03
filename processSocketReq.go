package main

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/gofiber/websocket/v2"
)

func processPathRequestMessage(msg Message, c *websocket.Conn, responseType string, messageType int) {
	var data PathData
	err := json.Unmarshal([]byte(msg.Data), &data)
	if err != nil {
		log.Println("json unmarshal data:", err)
		return
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
		return
	}

	// Create a ResponseData object
	responseData := ResponseData{
		UUID:     newPath,
		Path:     data.Path,
		Contents: fileList,
		Type:     responseType, // Use the responseType parameter
	}

	// Marshal the ResponseData object into JSON
	jsonData, err := json.Marshal(responseData)
	if err != nil {
		log.Println("json marshal:", err)
		return
	}

	// Send the JSON data back to the client
	err = c.WriteMessage(messageType, jsonData)
	if err != nil {
		log.Println("write:", err)
		return
	}
}
