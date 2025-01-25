package main

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"server/game"
	"sync"
	"time"

	"math/rand"

	"github.com/gorilla/websocket"
)

type Connections struct {
	connections map[string]*Connection
	mu          sync.Mutex
}

var websockets = Connections{connections: make(map[string]*Connection), mu: sync.Mutex{}}

func (c *Connections) set(id string, conn *Connection) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.connections[id] = conn
}

func (c *Connections) get(id string) (*Connection, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	conn, ok := c.connections[id]
	return conn, ok
}

func (c *Connections) delete(id string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.connections, id)
}

type Connection struct {
	ws *websocket.Conn
	mu sync.Mutex
}

func (c *Connection) send(msg []byte) {
	c.mu.Lock()
	defer c.mu.Unlock()
	err := c.ws.WriteMessage(websocket.TextMessage, msg)
	if err != nil {
		log.Println("Error writing message: ", err)
	}
}

func (c *Connection) close() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.ws.Close()
}

func safe_send(id string, msg []byte) {
	c, ok := websockets.get(id)
	if !ok {
		log.Println("Client not found")
		return
	}
	c.send(msg)
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func randString(n int) string {
	var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
	b := make([]rune, n)
	for i := range b {
		b[i] = letterRunes[rand.Intn(len(letterRunes))]
	}
	return string(b)
}

func sendMessage(id string, msg ServerMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Println("Error marshalling message: ", err)
	}
	go safe_send(id, data)
}

func broadcastMessage(msg ServerMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Println("Error marshalling message: ", err)
	}
	websockets.mu.Lock()
	log.Println("Broadcasting message to ", len(websockets.connections), " clients")
	defer websockets.mu.Unlock()
	for _, c := range websockets.connections {
		go c.send(data)
	}
}

type ServerMessage struct {
	MessageType string      `json:"message_type"`
	Message     interface{} `json:"content"`
	Error       string      `json:"error"`
	ActionId    uint64      `json:"action_id"`
}

func handleConnections(w http.ResponseWriter, r *http.Request) {

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error: ", err)
		return
	}
	var c = &Connection{ws: ws, mu: sync.Mutex{}}
	var uuid = randString(10)

	websockets.set(uuid, c)

	defer func() {
		websockets.delete(uuid)
		c.close()
	}()

	for {
		var msg game.Action
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Println("Error reading message: ", err)
			var jsonerror = errors.New(err.Error())
			log.Println("Error unmarshalling message: ", jsonerror)
			sendMessage(uuid, ServerMessage{
				MessageType: "action_response",
				Error:       jsonerror.Error(),
			})

			websockets.delete(uuid)
			c.close()
		}
		go sendMessage(uuid, ServerMessage{
			MessageType: "ack",
			Message:     "Received message",
			ActionId:    msg.ActionId,
		})

		game.EnqueueAction(game.ActionRequest{
			Action: msg,
			Callback: func(player game.PlayerInfo, err error) {
				errormsg := ""
				if err != nil {
					errormsg = err.Error()
				}
				go sendMessage(uuid, ServerMessage{
					MessageType: "action_response",
					Error:       errormsg,
					Message:     player,
					ActionId:    msg.ActionId,
				})
			},
		})
	}

}

func restartServer(w http.ResponseWriter, r *http.Request) {
	time.Sleep(2 * time.Second)
	os.Exit(42)
}

func main() {

	logFile, errLog := os.OpenFile("server.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if errLog != nil {
		log.Fatal("Failed to open log file: ", errLog)
	}
	defer logFile.Close()

	multiWriter := io.MultiWriter(os.Stdout, logFile)
	log.SetOutput(multiWriter)

	path, _ := os.Executable()
	log.Println(path)
	log.Println("Starting server...")
	http.HandleFunc("/ws", handleConnections)

	http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello!"))
	})

	go game.GameLoop(func(world *game.WorldInfo) {
		broadcastMessage(ServerMessage{
			MessageType: "world_update",
			Message:     world,
		})
	})

	http.HandleFunc("/redeploy", restartServer)

	fs := http.FileServer(http.Dir("../dist"))
	http.Handle("/", fs)

	http.HandleFunc("/code", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "../dist/code.html")
	})

	var err error
	if os.Getenv("DEV") != "" {
		log.Println("Server started localhost:5000")
		err = http.ListenAndServe(":5000", nil)
	} else {
		log.Println("HTTPS server started zmanifold.com")
		err = http.ListenAndServeTLS(":443", "/etc/letsencrypt/live/zmanifold.com/fullchain.pem", "/etc/letsencrypt/live/zmanifold.com/privkey.pem", nil)
	}
	if err != nil {
		log.Fatal("ListenAndServeTLS: ", err)
	}
}
