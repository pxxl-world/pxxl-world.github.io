package game

import (
	"errors"
	"fmt"
	"log"
	"math/rand"
	"time"
)

const world_size = 200

type Position struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type color = string

type block struct {
	Position Position `json:"position"`
	Color    color    `json:"color"`
}

var world = [world_size][world_size]*block{}

type WorldInfo struct {
	Blocks [world_size][world_size]*color `json:"blocks"`
}

func GetWorld() WorldInfo {
	var world_colors WorldInfo
	for x := 0; x < world_size; x++ {
		for y := 0; y < world_size; y++ {
			if world[x][y] != nil {
				world_colors.Blocks[x][y] = &world[x][y].Color
			}
		}
	}
	return world_colors
}

func PutBlock(x int, y int, c color) error {
	if world[x][y] != nil {
		return errors.New("block already exists")
	}
	world[x][y] = &block{Position: Position{x, y}, Color: c}
	return nil
}

func DeleteBlock(x int, y int) error {
	if world[x][y] == nil {
		return errors.New("block does not exist")
	}
	world[x][y] = nil
	return nil
}

func MoveBlock(x int, y int, new_x int, new_y int) error {
	if world[x][y] == nil {
		return errors.New("block does not exist")
	}
	if world[new_x][new_y] != nil {
		return errors.New("block already exists")
	}
	world[new_x][new_y] = world[x][y]
	world[x][y] = nil
	world[new_x][new_y].Position = Position{new_x, new_y}
	return nil
}

type Action struct {
	PlayerId string `json:"player_id"`
	ActionId uint64 `json:"action_id"`
	Type     string `json:"action"`
	X        int    `json:"x"`
	Y        int    `json:"y"`
	NewX     int    `json:"endx"`
	NewY     int    `json:"endy"`
	Color    color  `json:"color"`
	Energy   int    `json:"energy"`
}

type ActionRequest struct {
	Action
	Callback func(PlayerInfo, error)
}

func EnqueueAction(req ActionRequest) {
	if req.PlayerId == "44" {
		spawn_queue <- req

	} else if player, ok := players[req.PlayerId]; ok {
		ptype := "player"
		if player.npc {
			ptype = "npc"
		}
		select {
		case player.actionQueue <- req:
		default:
			req.Callback(PlayerInfo{}, errors.New("action queue full "+ptype))
		}
	} else {
		req.Callback(PlayerInfo{}, errors.New("player not found"))
	}
}

type PlayerId = string

type Player struct {
	body        *block
	Energy      int
	Id          PlayerId
	actionQueue chan ActionRequest
	npc         bool
}

var players = make(map[string]*Player)

type PlayerInfo struct {
	Position Position `json:"position"`
	Energy   int      `json:"energy"`
	Id       PlayerId `json:"id"`
}

func (p *Player) Info() PlayerInfo {
	return PlayerInfo{Position: p.body.Position, Energy: p.Energy, Id: p.Id}
}

func AddPlayer() PlayerInfo {

	var body *block
	for {
		x := rand.Int() % world_size
		y := rand.Int() % world_size
		if PutBlock(x, y, "#ff0000") == nil {
			body = world[x][y]
			break
		}
	}
	player := &Player{
		body:        body,
		Energy:      100,
		Id:          fmt.Sprint(rand.Uint64()),
		actionQueue: make(chan ActionRequest, 10)}
	players[player.Id] = player
	return player.Info()
}

var spawn_queue = make(chan ActionRequest, 10)

const fps = 20
const energy_per_second = 100
const max_energy = 100

func checksize(x int) bool {
	return !(x < 0 || x >= world_size)
}

func sqdistfn(x1 int, y1 int, x2 int, y2 int) int {
	return (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2)
}

func (player *Player) act(action Action) (PlayerInfo, error) {

	if !checksize(action.X) || !checksize(action.Y) || !checksize(action.NewX) || !checksize(action.NewY) {
		return player.Info(), errors.New("out of bounds")
	}

	if world[player.body.Position.X][player.body.Position.Y] != player.body {
		return player.Info(), errors.New("player DEAD")
	}

	cost := sqdistfn(player.body.Position.X, player.body.Position.Y, action.X, action.Y) / 4

	switch action.Type {
	case "info":
		return player.Info(), nil
	case "put":
		cost += 15 + action.Energy
		if cost > player.Energy {
			return player.Info(), errors.New("not enough energy")
		}
		player.Energy -= cost
		err := PutBlock(action.X, action.Y, action.Color)
		if err == nil && action.Energy > 0 {
			npc := &Player{
				body:        world[action.X][action.Y],
				Energy:      action.Energy,
				Id:          fmt.Sprint(rand.Uint64()),
				actionQueue: make(chan ActionRequest, 10),
				npc:         true,
			}
			players[npc.Id] = npc
			return npc.Info(), err
		}
		return player.Info(), err
	case "delete":
		cost -= 15
		if cost > player.Energy {
			return player.Info(), errors.New("not enough energy")
		}
		if world[action.X][action.Y] == player.body {
			return player.Info(), errors.New("cannot delete self")
		}
		player.Energy -= cost

		return player.Info(), DeleteBlock(action.X, action.Y)
	case "move":
		cost += sqdistfn(action.X, action.Y, action.NewX, action.NewY)/4 + 1
		if cost > player.Energy {
			return player.Info(), errors.New("not enough energy")
		}
		player.Energy -= cost
		err := MoveBlock(action.X, action.Y, action.NewX, action.NewY)
		return player.Info(), err
	default:
		return PlayerInfo{}, errors.New("unknown action")
	}
}

func GameLoop(broadcast func(*WorldInfo)) {

	for {

		ctr := 0
		select {
		case spawn := <-spawn_queue:
			newplayer := AddPlayer()

			ctr++
			spawn.Callback(newplayer, nil)
		default:
		}
		for _, player := range players {
			if !player.npc {
				player.Energy = player.Energy + energy_per_second/fps
				if player.Energy > max_energy {
					player.Energy = max_energy
				}
			}
			select {
			case action := <-player.actionQueue:

				ctr++
				info, err := player.act(action.Action)
				action.Callback(info, err)
			default:
			}
		}
		if ctr > 0 {
			log.Println("Processed ", ctr, " actions")
			worldInfo := GetWorld()
			broadcast(&worldInfo)
		}
		time.Sleep(time.Second / fps)
	}
}
