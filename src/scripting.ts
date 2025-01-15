import { Writable } from "./store"

const script_cache = new Map<string, string>()

export async function load_script(key:string):Promise<string>{
  let text = ''
  if (key === 'custom'){
    return custom_script.value
  }else{
    if (script_cache.has(key)) return script_cache.get(key)!
    text = await fetch(`/userscripts/${key}.js`).then(res => res.text())
  }
  script_cache.set(key, text)
  return text
}

export const active_character = new Writable('last_character', 'snake')
export const active_script = new Writable('active_script', '')
load_script(active_character.value).then(script => active_script.set(script))
export const custom_script = new Writable('custom_script', '')

