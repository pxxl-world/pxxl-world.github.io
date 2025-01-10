from flask import Flask, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import threading
import json


from game import Player, players, world, gameloop
import hmac



env = json.load(open('../.env.json'))

app = Flask(__name__, static_folder='../dist', static_url_path='/')
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

counter = 0
lock = threading.Lock()


@app.route('/redeploy', methods=['POST'])
def redeploy():

  hash = hmac.new(env['secret'].encode(), request.data, 'sha256').hexdigest()
  if not hmac.compare_digest(hash, request.headers.get('X-Hub-Signature-256').split('=')[1]): return "wrong secret", 401

  print('redeploying')
  import os
  os.system('git pull --rebase && cd .. && npm run build')
  return "ok"

@app.route('/hello', methods=['GET'])
def hello(): return {"status": "ok"}, 200

@app.route('/')
def index(): return app.send_static_file('index.html')

@app.route('/code')
def code():
  print('code')
  return app.send_static_file('code.html')

@socketio.on('connect')
def handle_connect():
  print(f'new client {request.sid}')
  # socketio.emit('game_update', world_state())

@socketio.on('disconnect')
def handle_disconnect():
  print('Client disconnected')

@socketio.on('new_player')
def handle_new_player():
  with lock:
    print("new player request")
    return Player().info()
  
@socketio.on('action')
def handle_action(payload):
  sid = request.sid
  action_id = payload['action_id']
  params = payload['params']
  pid = payload['id']
  with lock:
    print(f'action {payload}')
    try: player = players[payload['id']]
    except: return 'Player not found', 400
    try:
      def callback(res):
        socketio.emit('action_response', {
          'action_id': action_id,
          'res': res
        }, to = sid)
      player.enqueue(params, callback)
    except Exception as e:
      print(e)
      return str(e), 400
    return 'ok', 200

import os, sys

if __name__ == '__main__':

  threading.Thread(target=gameloop, args=(socketio, lock)).start()

  if ('--dev' in sys.argv):
    socketio.run(app, debug=True, port=5000, host= '0.0.0.0')
  else:
    socketio.run(app, debug=True, host="0.0.0.0", port=443, ssl_context=(
      "/etc/letsencrypt/live/zmanifold.com/fullchain.pem",
      "/etc/letsencrypt/live/zmanifold.com/privkey.pem"
    ))
