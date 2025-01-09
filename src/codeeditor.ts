const codeeditor = document.createElement('div')
codeeditor.id = 'codeeditor'
document.body.appendChild(codeeditor)

const explorer = document.createElement('div')
explorer.id = 'explorer'
explorer.innerHTML += "<h3>Characters:</h3>"

codeeditor.appendChild(explorer)
const contentarea = document.createElement('div')
contentarea.id = 'contentarea'
codeeditor.appendChild(contentarea)


const exitbutton = document.createElement('button')
exitbutton.innerText = 'play'
document.body.appendChild(exitbutton)
exitbutton.onclick = () => {
  window.location.href = '/'
}
document.addEventListener('keyup', e => {if(e.key === 'Escape') exitbutton.click()})
  
import {custom_script, last_character, active_script} from './store'

async function load_script(key:string){
  let text = '' 
  if (key === 'custom'){
    text = custom_script.value
  }else{
    text = await fetch(`/userscripts/${key}.js`).then(res => res.text())
  }
  contentarea.innerText = text
  active_script.set(text)
  last_character.set(key)
  console.log(active_script.value);
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

})()

contentarea.contentEditable = 'true'
contentarea.innerHTML = active_script.value

contentarea.addEventListener('input', _ => {
  active_script.set(contentarea.innerText)
  custom_script.set(contentarea.innerText)
  console.log(active_script.value);
})
