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
    try:
      msg, code = player.action(request.json)
      if code == 200: socketio.emit('game_update', world_state())
    except Exception as e:
      msg, code = str(e), 400
    return msg, code

@app.route('/redeploy', methods=['POST'])
def redeploy():
  with lock:
    print('redeploying')
    import os
    os.system('git pull --rebase')

    return "ok"

@socketio.on('connect')
def handle_connect():
  print('Client connected')
  socketio.emit('game_update', world_state())

@socketio.on('disconnect')
def handle_disconnect():
  print('Client disconnected')

import os, sys

if __name__ == '__main__':
    if ('--dev' in sys.argv):
      socketio.run(app, debug=True, port=5000, host= '0.0.0.0')
    else:
      socketio.run(app, debug=True, host="0.0.0.0", port=443, ssl_context=(
        "/etc/letsencrypt/live/zmanifold.com/fullchain.pem",
        "/etc/letsencrypt/live/zmanifold.com/privkey.pem"
      ))
