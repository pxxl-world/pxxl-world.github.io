import random, time
from dataclasses import dataclass
import flask_socketio
from typing import Callable

import threading


def world_state(): return {'world': [[block.color.tohex() if block is not None else None for block in row] for row in world],}


def gameloop(socketio:flask_socketio.SocketIO,lock: threading.Lock, ):
  while True:
    # print("loop")
    lock.acquire()
    cleanup()
    for player in list(players.values()):
      if len(player.action_queue) == 0: continue
      action, callback = player.action_queue.pop(0)
      res = player.action(action)
      if callback is not None: callback(res)
    lock.release()
    time.sleep(0.05)
    socketio.emit('game_update', world_state())
  

world_size = 100

# secret = random.randint(0, (1e10))
world = [[None for i in range(world_size)] for j in range(world_size)]

@dataclass
class Position:
  x: int
  y: int
  def get(self): return world[self.x][self.y]


@dataclass(frozen=True)
class Color:
  r: int
  g: int
  b: int

  def fromhex(hex_str:str):
    try:
      hex_str = hex_str.lstrip('#')
      return Color(*[int(hex_str[i:i+2], 16) for i in (0, 2, 4)])
    except:
      raise ValueError(f'Invalid hex color "{hex_str}", should be in the format #RRGGBB')
  
  @staticmethod
  def red(): return Color(255, 0, 0)

  def tohex(self): return f'#{self.r:02x}{self.g:02x}{self.b:02x}'

class Block:
  def __init__(self, pos:Position, color:Color):
    self.position = pos
    self.color = color
    world[pos.x][pos.y] = self
  
  def move(self, x, y):
    if world[x][y] is not None: return False
    world[self.position.x][self.position.y] = None
    self.position = Position(x, y)
    world[x][y] = self
    return True
  
  def delete(self): world[self.position.x][self.position.y] = None

from typing import Union

Error = Union[str, None]

def ok(msg=None): return msg, None
def error(msg): return None, msg

class Player:
  def __init__(self, NPC=False, energy = 100, position=None, color=Color.red()):
    cleanup()
    self.id = str(abs(hash(random.randint(0, int(1e10)))))
    if position is None:
      position = Position(random.randint(0, world_size), random.randint(0, world_size))
      while position.get() is not None: position = Position(random.randint(0, world_size), random.randint(0, world_size))
    self.body = Block(position, color)
    self.energy = energy
    self.last_update = time.time()
    players[self.id] = self
    self.NPC = NPC
    self.action_queue:(any, Callable[[any, Error]]) = []

  def get_energy(self):
    if not self.NPC:
      self.energy += (time.time() - self.last_update) * 100
      if self.energy > 100: self.energy = 100
    self.last_update = time.time()
    return self.energy
  
  def info(self):
    return {
      'id': self.id,
      'position': self.body.position.__dict__,
      'energy': self.energy
    }

  def enqueue(self, action, callback=None):
    self.action_queue.append((action, callback))
  

  def action(self, payload)-> tuple[any, Error]:
    print(f'action {payload}')
    if self.body.position.get() is not self.body: return error('Player is dead')
    actiontype = payload['action']
    pos = self.body.position
    x, y = payload['x'], payload['y']
    if not check_pos(x, y): return error('Invalid position')
    dist = abs(pos.x - x) + abs(pos.y - y)
    if actiontype == 'move': dist += abs(x - payload['endx']) + abs(y - payload['endy'])
    cost = {'put': 15, 'move': 0, 'delete': -15, 'spawn': 15,}[actiontype] + dist ** 2
    if self.get_energy() < cost: return error('Not enough energy')
    self.energy -= cost
    if actiontype == 'put':
      if world[x][y] is not None: return error('Block already at position')
      block = Block(Position(x, y), Color.fromhex(payload['color']))
    elif actiontype == 'delete':
      if world[x][y] is None: return error('No block at position')
      world[x][y].delete()
    elif actiontype == 'move':
      endx, endy = payload['endx'], payload['endy']
      if not check_pos(endx, endy): return error('Invalid position')
      if world[endx][endy] is not None: return error('Block already at position')
      if not self.body.move(endx, endy): return error('Invalid move')
    elif actiontype == 'spawn':
      if world[x][y] is not None: return error('Block already at position')
      spawn = Player(NPC=True, position=Position(x, y), color=Color.fromhex(payload['color']), energy= self.energy)
      self.energy = 0
      return ok(spawn.info())
    else: return error("Invalid action")
    return ok(self.info())


def check_pos(x,y): return 0 <= x < world_size and 0 <= y < world_size

def cleanup():
  for pid in list(players.keys()):
    player = players[pid]
    if player.get_energy() < 0 or player.body.position.get() is not player.body or player.last_update + 3600 < time.time():
      player.body.delete()
      del players[pid]

players:dict[str, Player] = {}