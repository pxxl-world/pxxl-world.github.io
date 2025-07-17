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


  set(value: T){
    this.value = value
    localStorage.setItem(this.key, JSON.stringify(value))
    this.subscribers.forEach(subscriber => subscriber(value))
  }
  subscribe(subscriber: (value: T) => void){
    subscriber(this.value)
    this.subscribers.add(subscriber)
  }
}
