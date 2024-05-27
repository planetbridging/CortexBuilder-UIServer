package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"strings"
	"time"
)

type ServerInfo struct {
	OS           string `json:"os"`
	RAM          string `json:"ram"`
	CPU          string `json:"cpu"`
	ComputerType string `json:"computerType"`
	IP           string `json:"ip"`
	Port         string `json:"port"`
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

		var info ServerInfo
		err = json.Unmarshal(buf[:n], &info)
		if err != nil {
			fmt.Printf("Error unmarshaling JSON: %v\n", err)
			continue
		}

		// Update client's IP and Port
		host, port, _ := net.SplitHostPort(client.Conn.RemoteAddr().String())
		info.IP = host
		info.Port = port

		client.Info = info
		fmt.Printf("Updated client info: %s -> %+v\n", client.Addr, client.Info)

		jsonData, err := clientManager.GetConnectedServersInfo()
		if err != nil {
			fmt.Printf("Error getting connected servers info: %v\n", err)
		} else {
			fmt.Printf("Connected servers info: %s\n", jsonData)
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
