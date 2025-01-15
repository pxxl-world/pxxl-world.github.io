import{W as z,a as g}from"./scripting-DaceTLTX.js";let v=window.location.hostname==="localhost"?"http://localhost:5000":"https://zmanifold.com";const _=document.querySelector("#app");function m(e){const t=document.createElement("button");return t.innerText=e,_.appendChild(t),t}const w=m("Show Code"),W=m("Reset Player"),r=document.createElement("canvas"),b=Math.min(window.innerWidth,window.innerHeight)-w.clientHeight-10;r.width=b;r.height=b;_.appendChild(r);const p=r.getContext("2d"),o=new z("player",{position:{x:0,y:0},energy:0,id:"0"}),k=document.addEventListener.bind(document),f=[];let s=0;document.addEventListener=function(e,t){console.log("adding event listener",e,s),f.push({type:e,listener:t}),k(e,t)};function C(){f.forEach(e=>{const{type:t,listener:n}=e;console.log("removing event listener",t,s),document.removeEventListener(t,n)}),f.length=0}function E(e){C(),s++,console.log("loading script",s),console.log("script",e),new Function("action","state",e)(u,d)}w.onclick=()=>{window.location.href="/code"};k("keyup",e=>{e.key==="Escape"&&w.click()});const h=100,l=r.width/h;function M(e,t,n){p.fillStyle=n,p.fillRect(e*l,t*l,l,l)}let P=Array.from({length:h},()=>Array.from({length:h},()=>"red"));const d={player:o.value,world:P};o.subscribe(e=>{d.player=e});function R(){p.clearRect(0,0,r.width,r.height),d.world.forEach((e,t)=>e.forEach((n,i)=>{n!==null&&(M(t,i,n),o.value.position.x===t&&o.value.position.y)}))}let c=new WebSocket(v.replace("http","ws").replace("https","wss")+"/ws");console.log("connecting to",c.url);const y=new Map;let x=17;function a(){console.log("reloading player"),u({action:"put",x:0,y:0,player_id:"44"}).then(e=>{o.set(e),E(g.value)}).catch(e=>{console.error("error",e)})}W.onclick=a;o.value.id==="0"&&a();function q(e){if(typeof e.player_id!="string")throw new Error("player_id must be a string");return e.action_id===void 0&&(e.action_id=x++),e}function u(e,t=o.value){e.player_id===void 0&&(e.player_id=t.id);const n=x++;return e.action_id=n,e=q(e),new Promise((i,S)=>{y.set(n,{resolve:i,reject:S});try{c.send(JSON.stringify(e))}catch(L){c.close(),console.error("error",L),c=new WebSocket(v.replace("http","ws").replace("https","wss")+"/ws"),y.clear()}e.action==="put"&&e.energy&&u({action:"info",x:0,y:0},t)})}setInterval(()=>{o.value.energy<100&&o.set({...o.value,energy:Math.min(o.value.energy+100/20,100)})},1e3/20);c.onmessage=e=>{let t;try{t=JSON.parse(e.data)}catch{console.error("error parsing",e.data);return}if(t.message_type==="world_update")d.world=t.content.blocks,R();else if(t.message_type==="action_response"){let n=y.get(t.action_id);if(!n){console.error(t.error),console.error("action not found",t.action_id);return}t.content.id===o.value.id&&o.set(t.content),t.error?(n.reject(t.error),console.log("action error",t.content)):n.resolve(t.content)}else console.error("unknown message type",t)};c.onopen=()=>{try{const e=o.value.position;u({action:"move",x:e.x,y:e.y,endx:e.x,endy:e.y}).catch(t=>{t==="player not found"&&a(),t!=="block already exists"&&console.error("error",t)})}catch(e){console.error("error",e),a()}E(g.value)};
