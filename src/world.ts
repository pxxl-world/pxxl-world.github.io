

import { DbConnection, GameAction, Tile, ActionType } from "./module_bindings";



export type Color = [number,number,number]

type Block = {
  move:(pos:Pos)=>Promise<void>
  del:(pos:Pos)=>Promise<void>
  put:(pos:Pos, color:Color, energy?:number) => Promise<Block>

  energy: number
  pos: Pos
  id: number
  color: Color
}


export const world_size = 1<<7

export type Pos = [number, number]

export type State = {
  world: {
    pixels: (null | Block)[][];
    subscribe: (fn: (focus: Pos | undefined) => void) => () => void;
    setPixel: (pos: Pos, color: Tile | null) => void;
    getPixel: (pos: Pos) => Block | null;
  };
  keyboard: {
    isPressed: (key: string) => boolean;
    subscribe: (fn: (key: string) => void) => () => void;
  };
};


export type UserAction = {
  type:"Move" | "Delete"
  pos: Pos
} | {
  type:"Put"
  pos: Pos
  color: string
  energy: number
}


export type Act = (u:UserAction) => void


export const pos2num = (p:Pos) => p[0]+p[1]*world_size


export const string2col = (c:[number,number,number]):number=> (c[0]<<16) + (c[1]<<8) + c[2]


export const int2color = (k:number):Color =>{
  k >>= 8
  let b = k & 255;
  k >>= 8
  let g = k & 255;
  k >>= 8
  let r = k & 255;
  return [r,g,b]
}


export const int2pos = (k:number): [number,number]=>{
  return [k%(world_size), Math.floor(k/(world_size))]
}

export function makestate (act:(action:GameAction)=>Promise<void>) : State {


  const getBlock = (t:Tile):Block => {
    let id = Math.round(Math.random()* (1<<30))

    return {
      move:(p:Pos)=>act({
        typ:{tag:"Move"},
        pos:pos2num(p),
        id:t.id,
        player:0,
      }),

      del:(p:Pos)=>act({
        typ:{tag:"Delete"},
        pos:pos2num(p),
        id:t.id,
        player:0,
      }),
      put:(p:Pos, color:[number,number,number], energy?:number)=>act({
        typ:{tag:"Put", value:{energy:energy??0, color:string2col(color), id}},
        pos:pos2num(p),
        id:t.id,
        player:0,
      }).then(()=>{
        let c = world.getPixel(p)!
        if (!c){
          throw new Error("new Block not found")
        }
        return c
      }),
      color:int2color(t.color),
      energy:t.energy,
      pos:int2pos(t.pos),
      id:t.id
    }
  }

    let world =(() => {
      const pixels = Array.from({ length: world_size }, () =>
        Array.from({ length: world_size }, () => null)
      ) as (Block | null)[][];
      const subscriptions = new Set<(focus: Pos | undefined) => void>();

      const notifySubscribers = (focus: Pos | undefined) => {
        subscriptions.forEach(fn => fn(focus));
      };

      return {
        pixels,
        subscribe: (fn: (focus: Pos | undefined) => void) => {
          subscriptions.add(fn);
          return () => subscriptions.delete(fn);
        },
        setPixel: (pos: Pos, tile: Tile | null) => {
          pixels[pos[0]][pos[1]] = tile? getBlock(tile): null;
          notifySubscribers(pos);
        },
        getPixel: (pos: Pos) => pixels[pos[0]][pos[1]],
      };
    })()
  
  return{

    world,



    keyboard: (() => {
      const keyStates = new Map<string, boolean>();
      const subscriptions = new Set<(key: string) => void>();

      const handleKey = (key: string, down:boolean) => {
        keyStates.set(key, down);
        if (down) notifySubscribers(key);
      };

      const notifySubscribers = (key: string) => {
        subscriptions.forEach(fn => fn(key));
      };

      window.addEventListener('keydown', (e)=>handleKey(e.key, true));
      window.addEventListener('keyup', (e) => handleKey(e.key, false));

      return {
        isPressed: (key: string) => keyStates.get(key) ?? false,
        subscribe: (fn: (key: string) => void) => {
          subscriptions.add(fn);
          return () => subscriptions.delete(fn);
        },
      };
    })(),
}}

