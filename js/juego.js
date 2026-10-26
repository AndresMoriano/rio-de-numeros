/* Río de Números · Lógica del juego */
const $=id=>document.getElementById(id);
const norm=s=>s.toUpperCase().replace(/Ñ/g,'#').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/#/g,'Ñ');
const AREA_SLUG={mat:'matematicas',fis:'fisica'};
const st={ciclo:3,area:'mat',cat:'all',w:null,guessed:new Set(),wrong:new Set(),errors:0,retos:0,status:'play',
  score:0,streak:0,solved:0,best:0,used:new Set(),usedP:new Set()};

const bank=()=>BANCO[`${st.ciclo}-${st.area}`];
const ciclo=()=>CICLOS.find(c=>c.id===st.ciclo);
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const bestKey=()=>`rioNumerosBest-${st.ciclo}-${st.area}`;

/* ---------- selección inicial: enlace directo (#clei4-fisica) o la última usada ---------- */
(function initSel(){
  const m=/^#clei([1-6])(?:-(matematicas|fisica))?$/.exec(location.hash||'');
  if(m){st.ciclo=+m[1];if(m[2])st.area=m[2]==='fisica'?'fis':'mat';return}
  const c=+store.get('rioNumerosCiclo'), a=store.get('rioNumerosArea');
  if(c>=1&&c<=6)st.ciclo=c; if(a==='mat'||a==='fis')st.area=a;
})();

/* ---------- selectores ---------- */
$('ciclos').innerHTML=CICLOS.map(c=>`<button class="ciclo" data-c="${c.id}" aria-pressed="false"><b>${c.nombre}</b><small>${c.grados}</small></button>`).join('');
$('areas').innerHTML=Object.entries(AREAS).map(([k,v])=>`<button class="area" data-a="${k}" aria-pressed="false">${v}</button>`).join('');
$('ciclos').addEventListener('click',e=>{const b=e.target.closest('.ciclo');if(b&&+b.dataset.c!==st.ciclo){st.ciclo=+b.dataset.c;changeBank()}});
$('areas').addEventListener('click',e=>{const b=e.target.closest('.area');if(b&&b.dataset.a!==st.area){st.area=b.dataset.a;changeBank()}});
$('temas').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;st.cat=b.dataset.c;paintTemas();next()});

function paintSel(){
  document.querySelectorAll('.ciclo').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.c===st.ciclo));
  document.querySelectorAll('.area').forEach(b=>b.setAttribute('aria-pressed',b.dataset.a===st.area));
  const c=ciclo();
  $('temasTitle').textContent=`Temas de ${c.nombre} · ${AREAS[st.area]}`;
  $('tagNivel').textContent=`${c.nombre} · ${AREAS[st.area]}`;
  const chips=[['all','Todos los temas'],...Object.entries(bank().temas)];
  $('temas').innerHTML=chips.map(([k,v])=>`<button class="chip" data-c="${k}" aria-pressed="false">${v}</button>`).join('');
  paintTemas();
}
function paintTemas(){document.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed',c.dataset.c===st.cat))}

function changeBank(first){
  st.cat='all';st.used=new Set();st.usedP=new Set();
  if(!first){st.score=0;st.streak=0;st.solved=0}
  st.best=+store.get(bestKey())||0;
  store.set('rioNumerosCiclo',st.ciclo);store.set('rioNumerosArea',st.area);
  try{history.replaceState(null,'',`#clei${st.ciclo}-${AREA_SLUG[st.area]}`)}catch(e){}
  paintSel();next();
}

/* ---------- teclado ---------- */
const ROWS=['QWERTYUIOP','ASDFGHJKLÑ','ZXCVBNM'];
$('kb').innerHTML=ROWS.map(r=>`<div class="row">${[...r].map(l=>`<button class="key" id="k-${l}" data-l="${l}" aria-label="Letra ${l}">${l}</button>`).join('')}</div>`).join('');
$('kb').addEventListener('click',e=>{const b=e.target.closest('.key');if(b)guess(b.dataset.l)});
document.addEventListener('keydown',e=>{
  if(!$('modal').hidden){if(e.key==='Escape')closeReto();return}
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const l=norm(e.key);if(/^[A-ZÑ]$/.test(l)){guess(l);e.preventDefault()}
  else if(e.key==='Enter'&&st.status!=='play'&&e.target.tagName!=='BUTTON'){next()}
});

/* ---------- palabras ---------- */
function pickWord(){
  const P=bank().palabras;
  let pool=P.map((w,i)=>i).filter(i=>st.cat==='all'||P[i][0]===st.cat);
  let fresh=pool.filter(i=>!st.used.has(i));
  if(!fresh.length){pool.forEach(i=>st.used.delete(i));fresh=pool}
  const i=fresh[Math.floor(Math.random()*fresh.length)];st.used.add(i);
  const [c,word,clue]=P[i];const disp=word.toUpperCase();
  return{c,disp,word:[...disp].map(norm).join(''),clue};
}
function letters(){return new Set([...st.w.word].filter(ch=>/[A-ZÑ]/.test(ch)))}
function progress(){const ls=letters();return [...ls].filter(x=>st.guessed.has(x)).length/ls.size}

function next(){
  st.w=pickWord();st.guessed=new Set();st.wrong=new Set();st.errors=0;st.retos=0;st.status='play';
  Scene.reset();$('banner').hidden=true;
  document.querySelectorAll('.key').forEach(k=>{k.disabled=false;k.className='key'});
  render();
}
function render(){
  const w=st.w, done=st.status!=='play', tema=bank().temas[w.c];
  $('catTag').textContent=tema;$('clueCat').textContent='Pista · '+tema;$('clue').textContent=w.clue;
  const D=[...w.disp], N=[...w.word];
  const parts=[];let cur=[];
  D.forEach((ch,i)=>{if(ch===' '){parts.push(cur);cur=[]}else cur.push(i)});parts.push(cur);
  $('word').style.setProperty('--n',Math.max(...parts.map(p=>p.length)));
  $('word').innerHTML=parts.map(p=>`<span class="wd">${p.map(i=>{
    if(st.guessed.has(N[i]))return`<span class="tile on">${D[i]}</span>`;
    if(done)return`<span class="tile miss">${D[i]}</span>`;
    return'<span class="tile"></span>';
  }).join('')}</span>`).join('');
  $('wrongList').textContent=st.wrong.size?[...st.wrong].join(' '):'—';
  $('logs').innerHTML=Array.from({length:MAX_ERR},(_,i)=>`<i class="${i<MAX_ERR-st.errors?'':'off'}"></i>`).join('');
  $('trip').style.width=(progress()*100)+'%';
  $('retoBtn').textContent=`Reto del río (${MAX_RETO-st.retos})`;
  $('retoBtn').disabled=done||st.retos>=MAX_RETO;
  $('score').textContent=st.score;$('streak').textContent=st.streak;$('solved').textContent=st.solved;$('best').textContent=st.best;
}
function guess(l,fromReto){
  if(st.status!=='play'||st.guessed.has(l)||st.wrong.has(l))return;
  const key=$('k-'+l);
  if(letters().has(l)){
    st.guessed.add(l);if(key){key.classList.add('ok');key.disabled=true}
    const cnt=[...st.w.word].filter(c=>c===l).length;
    if(!fromReto){st.score+=10*cnt;Scene.good(`+${10*cnt} · ¡La balsa avanza!`)}
    else Scene.good('¡Reto superado! Avanza');
    Scene.setProgress(progress());
    if([...letters()].every(x=>st.guessed.has(x)))win();
  }else{
    st.wrong.add(l);if(key){key.classList.add('no');key.disabled=true}
    miss();
  }
  render();
}
function miss(){st.errors++;Scene.setErrors(st.errors);Scene.bad();if(st.errors>=MAX_ERR)lose()}
function win(){
  st.status='won';const bonus=50+(MAX_ERR-st.errors)*10;st.score+=bonus;st.streak++;st.solved++;
  saveBest();Scene.win();
  $('banner').className='banner win';$('bannerTitle').textContent='¡Llegaste a la orilla!';
  $('bannerText').textContent=`${st.w.disp} · +${bonus} puntos de bono`;$('banner').hidden=false;lockKeys();
}
function lose(){
  st.status='lost';st.streak=0;saveBest();Scene.lose();
  $('banner').className='banner lose';$('bannerTitle').textContent='La balsa se partió';
  $('bannerText').textContent=`La palabra era ${st.w.disp}. El remero llegó nadando a la orilla.`;$('banner').hidden=false;lockKeys();
}
function lockKeys(){document.querySelectorAll('.key').forEach(k=>k.disabled=true);setTimeout(()=>$('nextBtn').focus({preventScroll:true}),50)}
function saveBest(){if(st.score>st.best){st.best=st.score;store.set(bestKey(),st.best)}}
$('nextBtn').onclick=()=>next();
$('skipBtn').onclick=()=>{if(st.status==='play'&&st.guessed.size)st.streak=0;next()};

/* ---------- Reto del río ---------- */
let curP=null;
function openReto(){
  if(st.status!=='play'||st.retos>=MAX_RETO)return;
  const P=bank().problemas;
  let pool=P.map((p,i)=>i).filter(i=>P[i][0]===st.w.c);
  if(!pool.length)pool=P.map((p,i)=>i);
  let fresh=pool.filter(i=>!st.usedP.has(i));if(!fresh.length){pool.forEach(i=>st.usedP.delete(i));fresh=pool}
  const i=fresh[Math.floor(Math.random()*fresh.length)];st.usedP.add(i);curP=P[i];
  const opts=[curP[2],...curP[3]].sort(()=>Math.random()-.5);
  $('retoQ').textContent=curP[1];
  $('retoOpts').innerHTML=opts.map(o=>`<button class="opt">${o}</button>`).join('');
  $('retoFb').hidden=true;$('modal').hidden=false;
  setTimeout(()=>$('retoOpts').querySelector('.opt').focus(),30);
}
$('retoOpts').addEventListener('click',e=>{
  const b=e.target.closest('.opt');if(!b||b.disabled)return;
  const ok=b.textContent===curP[2];st.retos++;
  $('retoOpts').querySelectorAll('.opt').forEach(o=>{o.disabled=true;if(o.textContent===curP[2])o.classList.add('right')});
  if(!ok)b.classList.add('bad');
  let msg;
  if(ok){const hidden=[...letters()].filter(x=>!st.guessed.has(x));const l=hidden[Math.floor(Math.random()*hidden.length)];st.score+=15;msg=`<b>¡Correcto!</b> Se destapó la letra <b>${l}</b>. `;guess(l,true)}
  else{msg=`<b>No era esa.</b> La balsa perdió un tronco. `;miss()}
  $('retoFb').innerHTML=msg+curP[4];$('retoFb').hidden=false;render();
  $('retoClose').focus();
});
function closeReto(){$('modal').hidden=true}
$('retoBtn').onclick=openReto;$('retoClose').onclick=closeReto;
$('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeReto()});

/* ---------- sección del docente: tabla de contenidos por ciclo ---------- */
$('tablaCiclos').innerHTML=`<thead><tr><th>Ciclo</th><th>Grados</th><th>Matemáticas</th><th>Física</th></tr></thead><tbody>${
  CICLOS.map(c=>{const m=BANCO[`${c.id}-mat`],f=BANCO[`${c.id}-fis`];
    return`<tr><th scope="row">${c.nombre}</th><td>${c.grados}</td><td>${Object.values(m.temas).join(' · ')}<small>${m.palabras.length} palabras · ${m.problemas.length} retos</small></td><td>${Object.values(f.temas).join(' · ')}<small>${f.palabras.length} palabras · ${f.problemas.length} retos</small></td></tr>`}).join('')
}</tbody>`;

changeBank(true);
