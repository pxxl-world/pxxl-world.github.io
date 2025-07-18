

import { ActionType as ServerActionType, ActionResultVariant } from "./module_bindings";



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

a

export function Agent()
