package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"server/game"

	"github.com/gorilla/websocket"
)

type ServerMessage struct {
	MessageType string      `json:"message_type"`
	Message     interface{} `json:"content"`
	Error       string      `json:"error"`
	ActionId    uint64      `json:"action_id"`
}

var clients = make(map[chan<- []byte]bool)

func broadcast(msg ServerMessage) {
	log.Println("broadcasting message to", len(clients), "clients")
	data, err := json.Marshal(msg)
	if err != nil {
		log.Println("Error marshalling broadcast: ", err)
	}

	for client := range clients {
		go func() { client <- data }()
	}
}

func sendMessage(client chan<- []byte, msg ServerMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Println("Error marshalling message: ", err)
	}
	client <- data
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	log.Println("Handling connection")
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		// log.Fatal("Upgrade: ", err)
		log.Println("Upgrade error: ", err)
		return
	} else {
		log.Println("Upgrade successful")
	}
	defer ws.Close()
	msgChan := make(chan []byte)
	clients[msgChan] = true

	go func() {
		for {
			log.Println("Waiting for msgChan")
			msg := <-msgChan
			err := ws.WriteMessage(websocket.TextMessage, msg)
			if err != nil {
				log.Println("Error writing message: ", err)
				break
			}
		}
	}()

	for {
		log.Println("Waiting client message")
		var msg game.Action
		err = ws.ReadJSON(&msg)
		if err != nil {
			var jsonerror = errors.New(err.Error())
			log.Println("Error unmarshalling message: ", jsonerror)
			sendMessage(msgChan, ServerMessage{
				MessageType: "action_response",
				Error:       jsonerror.Error(),
			})
			delete(clients, msgChan)
			break
		}
		var respond = func(info interface{}, err error) {
			errormsg := ""
			if err != nil {
				errormsg = err.Error()
			}
			go sendMessage(msgChan, ServerMessage{
				MessageType: "action_response",
				Error:       errormsg,
				Message:     info,
				ActionId:    msg.ActionId,
			})
		}
		game.EnqueueAction(game.ActionRequest{
			Action: msg,
			Callback: func(player game.PlayerInfo, err error) {
				log.Println("Action callback", player, err)
				respond(player, err)
			},
		})
	}
}

func main() {
	log.Println("Starting server...")
	http.HandleFunc("/ws", handleConnections)

	http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello!"))
	})

	go game.GameLoop(func(world *game.WorldInfo) {
		broadcast(ServerMessage{
			MessageType: "world_update",
			Message:     world,
		})
	})

	fs := http.FileServer(http.Dir("../dist"))
	http.Handle("/", fs)

	log.Println("Server started on localhost:5000")
	err := http.ListenAndServe(":5000", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
