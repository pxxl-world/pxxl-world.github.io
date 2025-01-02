from flask import Flask, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import threading

app = Flask(__name__, static_folder='../dist', static_url_path='/')
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

counter = 0

from game import Player, players, world

lock = threading.Lock()
def world_state(): return {'world': [[block.color.tohex() if block is not None else None for block in row] for row in world],}

@app.route('/game_state', methods=['GET'])
def game_state(): return world_state(), 200

@app.route('/new_player', methods=['GET'])
def new_player():
  with lock:
    player = Player()
    print('new player', player.info())
    socketio.emit('game_update', world_state())
    return player.info(), 200

@app.route('/player_info/<int:player_id>', methods=['GET'])
def player_info(player_id):
  if player_id not in players: return 'Player not found', 404
  return players[player_id].info(), 200

@app.route('/action', methods=['POST'])
def action():
  with lock:
    player_id = request.json['id']
    if player_id not in players: return 'Player not found', 404
    player = players[player_id]
    msg, code = player.action(request.json)
    if code == 200: socketio.emit('game_update', world_state())
    return msg, code

@socketio.on('connect')
def handle_connect():
  print('Client connected')
  socketio.emit('game_update', world_state())

@socketio.on('disconnect')
def handle_disconnect():
  print('Client disconnected')  

if __name__ == '__main__':
  socketio.run(app, debug=True, port=5000, host= '0.0.0.0')