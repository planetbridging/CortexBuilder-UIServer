package main

import (
    "log"
    "sync"
    "net"
    "github.com/valyala/fasthttp"
    "github.com/gofiber/fiber/v2"
)

var clientsHTTP map[string]*fasthttp.HostClient
var lockHTTP sync.Mutex

func setupHTTPClients() {
    clientsHTTP = make(map[string]*fasthttp.HostClient)
    // Populate this map with UUIDs and corresponding server HostClients
    // Example: clientsHTTP["uuid1"] = &fasthttp.HostClient{Addr: "192.168.1.100:8080"}
}

func reverseProxyHandler(c *fiber.Ctx) error {

    // Manually set CORS headers
    /*c.Set("Access-Control-Allow-Origin", "*")
    c.Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
   */

    // Extract the UUID and the file path from the URL
    uuid := c.Params("uuid")
    filePath := c.Params("*")
    //log.Printf("UUID: %s, File Path: %s\n", uuid, filePath)

    // Get the remote address (IP:port) for the given UUID
    serverAddress := getClientRemoteAddr(uuid)
    //log.Println("Original server address:", serverAddress)
    if serverAddress == "" {
        return c.Status(fiber.StatusNotFound).SendString("Server not found for UUID")
    }

    // Check if the address is IPv6 localhost ([::1]), and convert it to IPv4 localhost (127.0.0.1)
    host, port, err := net.SplitHostPort(serverAddress)
    if err != nil {
        log.Println("Error splitting host and port:", err)
        return c.Status(fiber.StatusInternalServerError).SendString("Invalid server address")
    }
    if host == "::1" {
        serverAddress = "127.0.0.1:" + port
    }
    log.Println(host);

    //log.Println("Adjusted server address:", serverAddress)

    // Update request URL for proxying
    c.Request().SetRequestURI("/files/" + filePath)

    // Use fasthttp.HostClient to proxy the request
    client := &fasthttp.HostClient{Addr: serverAddress}
    err = client.Do(c.Request(), c.Response())
    if err != nil {
        log.Printf("Proxy error: %v\n", err)
        return c.Status(fiber.StatusInternalServerError).SendString("Proxy error")
    }

    return nil
}