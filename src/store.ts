

export class Writable<T>{
  value: T
  subscribers = new Set<(value: T) => void>()
  constructor(public key: string, public defaultvalue: T){
    if(localStorage.getItem(key) === null){
      this.value = defaultvalue!
    }else{
      try{
        this.value = JSON.parse(localStorage.getItem(key)!) as T
      }catch{
        this.value = defaultvalue!
      }
    }
  }
  set(value: any){
    this.value = value
    localStorage.setItem(this.key, JSON.stringify(value))
    this.subscribers.forEach(subscriber => subscriber(value))
  }
  subscribe(subscriber: (value: T) => void){
    this.subscribers.add(subscriber)
  }
}

export let custom_script = new Writable('custom_script', '')
export let last_character = new Writable('last_character', 'snake')
export let active_script = new Writable('active_script', custom_script.value)
export let player = new Writable('player', {position:{x:0, y:0}, energy:0, id:0})
