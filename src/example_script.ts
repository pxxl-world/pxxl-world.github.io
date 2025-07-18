

type ActionType = "Move" | "Put" | "Delete"

type Pos = [number, number]
type Color = [number,number,number]

type Action = {
  type:"Move" | "Delete"
  pos: Pos
} | {
  type:"Put"
  pos: Pos
  color:Color
  energy: number
}


type State = {
  world: {
    pixels: (null | string)[][];
    subscribe: (fn: (focus: Pos | undefined) => void) => () => void;
    setPixel: (pos: Pos, color: string | null) => void;
    getPixel: (pos: Pos) => string | null;
  };
  keyboard: {
    isPressed: (key: string) => boolean;
    subscribe: (fn: (key: string) => void) => () => void;
  };
};

export function main(state:State, act:(action:Action)=>void){

  state.keyboard.subscribe(console.log)

}


