

export class Writable<T>{
  value: T
  subscribers = new Set<(value: T) => void>()
  constructor(public key: string, public defaultvalue: T){
    if(localStorage.getItem(key) === null){
      this.value = defaultvalue!
    }else{
      this.value = JSON.parse(localStorage.getItem(key)!) as T
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