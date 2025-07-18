

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
  world:{
    state:(null|string) [][],
    subscribe: (fn: (focus: Pos|undefined)=>void)=>void,
  }
  input:{
    ispressed:(s:string)=>boolean,
    subscribe: (fn :(s:string) => void) => void
  }
}


export function main(state:State, act:(action:Action)=>void){

}


