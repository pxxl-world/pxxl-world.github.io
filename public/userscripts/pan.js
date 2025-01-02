
// pan script

document.addEventListener('keydown', e => {
  if(e.key === 'ArrowUp') walk(0, -1)
  if(e.key === 'ArrowDown') walk(0, 1)
  if(e.key === 'ArrowLeft') walk(-1, 0)
  if(e.key === 'ArrowRight') walk(1, 0)
})
