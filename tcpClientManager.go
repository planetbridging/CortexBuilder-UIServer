package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"os"
	"strings"
	"time"
)

type ServerInfo struct {
	OS             string      `json:"os"`
	RAM            string      `json:"ram"`
	CPU            string      `json:"cpu"`
	ComputerType   string      `json:"computerType"`
	IP             string      `json:"ip"`
	Config         interface{} `json:"config"`
	MountedData    string      `json:"mountedData"`
	MountedDetails interface{} `json:"mountedDetails"`
}

type Client struct {
	Conn     net.Conn
	Addr     string
	LastSeen time.Time
	Info     ServerInfo
}

type ClientManager struct {
	Clients          map[string]*Client
	addClientChan    chan *Client
	removeClientChan chan string
}

var clientManager *ClientManager

func NewClientManager() *ClientManager {
	return &ClientManager{
		Clients:          make(map[string]*Client),
		addClientChan:    make(chan *Client),
		removeClientChan: make(chan string),
	}
}

func (cm *ClientManager) Run() {
	for {
		select {
		case client := <-cm.addClientChan:
			cm.Clients[client.Addr] = client
			fmt.Printf("Added client: %s\n", client.Addr)
		case addr := <-cm.removeClientChan:
			delete(cm.Clients, addr)
			fmt.Printf("Removed client: %s\n", addr)
		}
	}
}

func (cm *ClientManager) AddClient(client *Client) {
	//fmt.Println("-----------------",client.Addr)
	//get, _ := sendGetRequest("http://" + ip + ":" + port + "/path")

	cm.addClientChan <- client
}

func (cm *ClientManager) RemoveClient(addr string) {
	cm.removeClientChan <- addr
}

func (cm *ClientManager) ReconnectClient(client *Client) {
	for {
		conn, err := tls.Dial("tcp", client.Addr, &tls.Config{InsecureSkipVerify: true})
		if err == nil {
			client.Conn = conn
			client.LastSeen = time.Now()
			cm.AddClient(client)
			go cm.handleConnection(client)
			fmt.Printf("Reconnected to client: %s\n", client.Addr)
			return
		}
		time.Sleep(1 * time.Second)
	}
}

func (cm *ClientManager) handleConnection(client *Client) {
	defer client.Conn.Close()
	// Send password for authentication
	client.Conn.Write([]byte(envPWD))

	buf := make([]byte, 1024)
	n, err := client.Conn.Read(buf)
	if err != nil {
		cm.RemoveClient(client.Addr)
		go cm.ReconnectClient(client)
		return
	}

	if string(buf[:n]) != "Authenticated" {
		fmt.Printf("Failed to authenticate with server %s\n", client.Addr)
		cm.RemoveClient(client.Addr)
		return
	}

	// Send ping message once authenticated
	client.Conn.Write([]byte("ping"))

	for {
		n, err := client.Conn.Read(buf)
		if err != nil {
			cm.RemoveClient(client.Addr)
			go cm.ReconnectClient(client)
			return
		}

		client.LastSeen = time.Now()
		message := string(buf[:n])
		fmt.Printf("Received data from %s: %s\n", client.Addr, message)

		var js map[string]interface{}
		errCheckJson := json.Unmarshal([]byte(message), &js)
		//fmt.Println(js)
		if errCheckJson != nil {
			fmt.Println("--------------?")
		} else {
			if jsType, ok := js["type"].(string); ok {
				fmt.Println("----------------------", jsType)
				switch jsType {
				case "serverInfo":
					var info ServerInfo
					err = json.Unmarshal(buf[:n], &info)
					if err != nil {
						fmt.Printf("Error unmarshaling JSON: %v\n", err)
						continue
					} else {
						fmt.Println("Setting up info")
						// Update client's IP and Port
						info.IP = client.Addr

						client.Info = info
						//fmt.Printf("Updated client info: %s -> %+v\n", client.Addr, client.Info)
						/*fmt.Println(client.Info)
						jData, _ := json.Marshal(client)
						fmt.Println(string(jData))

						jsonData, err := clientManager.GetConnectedServersInfo()
						if err != nil {
							fmt.Printf("Error getting connected servers info: %v\n", err)
						} else {
							fmt.Printf("Connected servers info: %s\n", jsonData)
						}*/
						//fmt.Println("-----------------",info.ComputerType)
						switch info.ComputerType {
						case "data":
							getConfigLocation := strings.ReplaceAll(client.Addr, "12345", "4123")
							getConfig, err := sendGetRequest("http://" + getConfigLocation + "/files/config.json")
							if err != nil {
								fmt.Printf("Error fetching config: %v\n", err)
							} else {
								var configData interface{}
								err := json.Unmarshal([]byte(getConfig), &configData)
								if err != nil {
									configData = getConfig // If unmarshaling fails, store as string
								}
								info.Config = configData // Save the fetched config
								//fmt.Println("Config:", configData)
								client.Info = info
							}
						}
					}
				case "mountStatus":
					keys := []string{"clientID", "path", "status"}
					if keysExist(js, keys) {
						fmt.Println("All keys exist")
						/*dataMountRes := map[string]interface{}{
							"type": "testing",
						}*/
						client.Info.MountedData = js["path"].(string)

						getMountedInfo := strings.ReplaceAll(client.Addr, "12345", "4123")
						getMountInfoStr, err := sendGetRequest("http://" + getMountedInfo + "/mounted")
						if err != nil {
							log.Println("Failed to send GET request:", err)
						} else {
							var getMountInfoJson []interface{}
							err = json.Unmarshal([]byte(getMountInfoStr), &getMountInfoJson)
							if err != nil {
								log.Println("Failed to convert response to JSON:", err)
							} else {
								client.Info.MountedDetails = getMountInfoJson
							}
						}

						jsonData, err := json.Marshal(client.Info)
						if err != nil {
							fmt.Printf("Error marshaling JSON: %v\n", err)
							return
						}
						postData := map[string]interface{}{
							"msgType":      "singleClientUpdate",
							"singleClient": json.RawMessage(jsonData),
						}
						message := sendJSONDataToClient(js["clientID"].(string), postData)

						fmt.Println(message)
					} else {
						fmt.Println("Not all keys exist")
					}
				case "evalStatusUpdate":
					//fmt.Println("evalStatusUpdate:", js)
					js["pod"] = client.Addr
					jsBytes, err := json.Marshal(js)
					if err != nil {
						fmt.Println("Error marshalling JSON:", err)

					} else {
						jsString := string(jsBytes)
						sendAllRelay(jsString)
					}

					break
				default:
					fmt.Println("Unknown type: ", js)
				}
			} else {
				fmt.Println("-------no type?")
			}

		}

	}
}

func attemptConnection(addr string, clientManager *ClientManager) {
	for {
		conn, err := tls.Dial("tcp", addr, &tls.Config{InsecureSkipVerify: true})
		if err == nil {
			client := &Client{
				Conn:     conn,
				Addr:     addr,
				LastSeen: time.Now(),
			}
			clientManager.AddClient(client)
			go clientManager.handleConnection(client)
			return
		}
		time.Sleep(1 * time.Second)
	}
}

func tcpClientSetup() {
	clientManager = NewClientManager()
	go clientManager.Run()

	// Example connections
	addresses := strings.Split(os.Getenv("LST_TCP"), ",")

	for _, addr := range addresses {
		go attemptConnection(addr, clientManager)
	}

	// Keep the main function running
	select {}
}

// GetConnectedServersInfo returns a JSON string with information about all connected servers
func (cm *ClientManager) GetConnectedServersInfo() (string, error) {
	serversInfo := make([]ServerInfo, 0, len(cm.Clients))

	for _, client := range cm.Clients {
		serversInfo = append(serversInfo, client.Info)
	}

	jsonData, err := json.Marshal(serversInfo)
	if err != nil {
		return "", fmt.Errorf("error marshaling JSON: %v", err)
	}

	return string(jsonData), nil
}

func (cm *ClientManager) IsClientConnected(addr string) bool {
	_, exists := cm.Clients[addr]
	return exists
}

func (cm *ClientManager) RenewAllConfigs() {
	for _, client := range cm.Clients {
		switch client.Info.ComputerType {
		case "data":
			getConfigLocation := strings.ReplaceAll(client.Addr, "12345", "4123")
			getConfig, err := sendGetRequest("http://" + getConfigLocation + "/files/config.json")
			if err != nil {
				fmt.Printf("Error fetching config for client %s: %v\n", client.Addr, err)
			} else {
				var configData interface{}
				err := json.Unmarshal([]byte(getConfig), &configData)
				if err != nil {
					configData = getConfig
				}
				client.Info.Config = configData
				fmt.Printf("Updated config for client %s: %v\n", client.Addr, client.Info.Config)
			}
		}
	}
}

func (cm *ClientManager) SendJSONData(addr string, data interface{}) string {
	client, ok := cm.Clients[addr]
	if !ok {
		return "Client not found"
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Sprintf("Error marshaling JSON: %v", err)
	}

	_, err = client.Conn.Write(jsonData)
	if err != nil {
		return fmt.Sprintf("Error sending data: %v", err)
	}

	return "Data sent successfully"
}
