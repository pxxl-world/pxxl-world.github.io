export const codeeditor = document.createElement('div')
codeeditor.id = 'codeeditor'
codeeditor.classList.add('hidden')

const explorer = document.createElement('div')
explorer.id = 'explorer'
explorer.innerHTML = "<h3>Characters:</h3>"

codeeditor.appendChild(explorer)
const contentarea = document.createElement('div')
contentarea.id = 'contentarea'
codeeditor.appendChild(contentarea)

import { Writable } from './store'

let custom_script = new Writable('custom_script', '')
let last_character = new Writable('last_character', 'peter')
export let userscript = ''

async function load_script(key:string){
  let text = '' 
  if (key === 'custom'){
    text = custom_script.value
  }else{
    text = await fetch(`/userscripts/${key}.js`).then(res => res.text())
  }
  contentarea.innerText = text
  userscript = text
  last_character.set(key)
  console.log(userscript);
  
}

load_script(last_character.value)

;(async ()=>{
  let default_character_list = await fetch('/userscripts/list.json').then(res => res.json());
  default_character_list.concat(custom_script.value? ['custom']:[]) .forEach((character:string)=>{
    const charbutton = document.createElement('p')
    charbutton.innerText = character
    charbutton.addEventListener('click', _ => {
      load_script(character)
    })
    explorer.appendChild(charbutton)
  })

  // @ts-ignore
  let custom_character_list = JSON.parse(localStorage.getItem('custom_character_list') || '[]')
  console.log(codeeditor);

})()


contentarea.contentEditable = 'true'
contentarea.innerHTML = userscript

contentarea.addEventListener('input', _ => {
  userscript = contentarea.innerText
  custom_script.set(userscript)
  console.log(userscript);

})
