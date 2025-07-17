// import {custom_script, last_character, active_script} from './store'
import { button } from './main'
import { load_script, active_character, custom_script, active_script } from './scripting'

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


const docbutton = document.createElement('button')
docbutton.innerText = "documentation"
docbutton.onclick = () => {
    window.open('/docs/character_scripting.md', '_blank')
}
document.body.appendChild(docbutton)

console.log(document.body);



exitbutton.onclick = () => {
  window.location.href = '/'
}

document.addEventListener('keyup', e => {if(e.key === 'Escape') exitbutton.click()})



;(async ()=>{
  let default_character_list = await fetch('/userscripts/list.json').then(res => res.json());
  default_character_list.concat(custom_script.value? ['custom']:[]) .forEach((character:string)=>{
    const charbutton = document.createElement('p')
    charbutton.innerText = character
    charbutton.addEventListener('click', _ => {
      active_character.set(character)
      load_script(character).then(script => {
        contentarea.innerText = script
        active_script.set(script)
        active_character.set(character)
      })
    })
    active_character.subscribe(newchar => {
      if (newchar === character){
        charbutton.classList.add('active')
      }else{
        charbutton.classList.remove('active')
      }
    })
    explorer.appendChild(charbutton)
  })

})()

contentarea.contentEditable = 'true'
contentarea.innerHTML = active_script.value

contentarea.addEventListener('input', _ => {
  active_script.set(contentarea.innerText)
  custom_script.set(contentarea.innerText)
  active_character.set('custom')
  console.log(active_script.value);
})

