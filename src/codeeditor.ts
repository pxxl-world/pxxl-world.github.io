export const codeeditor = document.createElement('div')
codeeditor.id = 'codeeditor'
codeeditor.classList.add('hidden')

const explorer = document.createElement('div')
explorer.id = 'explorer'


codeeditor.appendChild(explorer)

const contentarea = document.createElement('div')
contentarea.id = 'contentarea'
codeeditor.appendChild(contentarea)


;(async ()=>{
  let default_character_list = await fetch('/userscripts/list.json').then(res => res.json())
  default_character_list.forEach((character:string)=>{
    const charbutton = document.createElement('p')
    charbutton.innerText = character
    charbutton.addEventListener('click', e => {
      fetch(`/userscripts/${character}.js`).then(res => res.text()).then(script => {
        contentarea.innerText = script
      })
    })
    explorer.appendChild(charbutton)
  })

  // @ts-ignore
  let custom_character_list = JSON.parse(localStorage.getItem('custom_character_list') || '[]')
  console.log(codeeditor);

})()

export let userscript = `

document.addEventListener('keydown', e => {
  if(e.key === 'ArrowUp') walk(0, -1)
  if(e.key === 'ArrowDown') walk(0, 1)
  if(e.key === 'ArrowLeft') walk(-1, 0)
  if(e.key === 'ArrowRight') walk(1, 0)
})
`

contentarea.contentEditable = 'true'
contentarea.innerHTML = userscript

contentarea.addEventListener('input', e => {
  userscript = contentarea.innerText
  console.log(userscript);
})


