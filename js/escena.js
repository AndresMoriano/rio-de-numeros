/* Río de Números · Escena animada del río (canvas) */
/* ===================== ESCENA (canvas) ===================== */
const Scene = (() => {
  const cv = document.getElementById('scene'), ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W=800,H=400,dpr=1, L={}, clouds=[], cloudSpr=[], t=0, storm=0, errors=0, mode='play';
  let rainbow=0, flash=0, bolt=null, rain=[], rings=[], drift=[], birds=[], flies=[];
  // travesía: posición de la balsa, troncos, animaciones de acierto y de error
  let raftX=null, prog=0, logsShown=7, pending=0, breakT=0, settle=0, shakeT=0, pushT=0, stumbleT=0, redFlash=0;
  let padPh=0, prevCos=1, parts=[], texts=[], swimHat=null, lastBx=0, lastBy=0;
  const RK=()=>Math.min(H/400,W/480);
  const startX=()=>Math.max(W*.3,W*.17+170*RK()*.42);
  const endX=()=>Math.max(startX()+40,W*.8-170*RK()*.52);
  const lerp=(a,b,k)=>a+(b-a)*k;
  const hx=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255]};
  const mix=(a,b,k,al=1)=>{const A=hx(a),B=hx(b);return`rgba(${A.map((v,i)=>Math.round(lerp(v,B[i],k))).join(',')},${al})`};
  function rng(s){return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646}}
  const off=()=>{const c=document.createElement('canvas');c.width=W*dpr;c.height=H*dpr;const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);return[c,x]};
  const horizon=()=>H*0.56;

  function crown(c,x,y,r,col,R){
    const n=6+Math.floor(R()*4);
    for(let i=0;i<n;i++){
      const cx=x+(R()-.5)*r*1.3, cy=y+(R()-.3)*r*.8, cr=r*(.35+R()*.35);
      const g=c.createRadialGradient(cx-cr*.35,cy-cr*.45,cr*.08,cx,cy,cr);
      g.addColorStop(0,col.light);g.addColorStop(.55,col.base);g.addColorStop(1,col.dark);
      c.fillStyle=g;c.beginPath();c.arc(cx,cy,cr,0,7);c.fill();
      c.fillStyle=col.light;c.globalAlpha=.35;
      for(let s=0;s<14;s++){const a=R()*6.28,d=R()*cr*.85;c.beginPath();c.arc(cx+Math.cos(a)*d-cr*.15,cy+Math.sin(a)*d-cr*.2,Math.max(.6,cr*.07),0,7);c.fill()}
      c.globalAlpha=1;
    }
  }
  function frond(c,x,y,len,a,col,lw){
    const ex=x+Math.cos(a)*len, ey=y+Math.sin(a)*len*.55+len*.38;
    const mx=x+Math.cos(a)*len*.55, my=y+Math.sin(a)*len*.55-len*.12;
    c.strokeStyle=col;c.lineWidth=Math.max(1,len*.03*lw);c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(mx,my,ex,ey);c.stroke();
    c.lineWidth=Math.max(.6,len*.013*lw);c.beginPath();
    for(let s=.12;s<1;s+=.065){
      const px=(1-s)*(1-s)*x+2*(1-s)*s*mx+s*s*ex, py=(1-s)*(1-s)*y+2*(1-s)*s*my+s*s*ey, l=len*.24*(1-s*.6);
      c.moveTo(px,py);c.lineTo(px+Math.cos(a+1.3)*l*.45,py+l);c.moveTo(px,py);c.lineTo(px+Math.cos(a-1.3)*l*.45,py+l*.9);
    }
    c.stroke();
  }
  function palm(c,x,by,h,lean,col,R,sway=0){
    const tx=x+lean*h, ty=by-h;
    c.lineCap='round';c.strokeStyle=col.trunk;c.lineWidth=Math.max(1.5,h*.03);
    c.beginPath();c.moveTo(x,by);c.quadraticCurveTo(x+lean*h*.15,by-h*.6,tx,ty);c.stroke();
    for(let i=0;i<12;i++){const a=-Math.PI/2+(i/11-.5)*Math.PI*1.75+(R()-.5)*.2+sway*(1+i%3*.3);frond(c,tx,ty,h*(.3+R()*.08),a,col.leaf,1)}
  }
  function ridge(c,base,amp,fr,seed,g){
    const R=rng(seed),ph=fr.map(()=>R()*6.28);
    c.beginPath();c.moveTo(0,H);
    for(let x=0;x<=W+4;x+=4){let y=base;fr.forEach((f,i)=>y-=Math.sin(x/W*f*6.28+ph[i])*amp/(i+1));c.lineTo(x,y)}
    c.lineTo(W,H);c.closePath();c.fillStyle=g;c.fill();
  }

  function build(){
    const y0=horizon();
    // montañas
    let [mc,m]=off();
    let g=m.createLinearGradient(0,y0-H*.3,0,y0);g.addColorStop(0,'#5b7186');g.addColorStop(1,'#3d5566');
    ridge(m,y0-H*.12,H*.07,[1.3,3.1,7],11,g);
    g=m.createLinearGradient(0,y0-H*.2,0,y0);g.addColorStop(0,'#3a5560');g.addColorStop(1,'#25403f');
    ridge(m,y0-H*.06,H*.05,[2.1,4.7,11],29,g);
    L.mount=mc;
    // selva lejana
    let [fc,f]=off();const R=rng(7);
    const far={base:'#2c4d3f',light:'#5f8a66',dark:'#162a21'};
    f.fillStyle=far.dark;f.fillRect(0,y0-H*.035,W,H);
    for(let x=-10;x<W+20;x+=H*.022){crown(f,x,y0-H*.03-R()*H*.05,H*.03*(.7+R()*.6),far,R)}
    for(let i=0;i<9;i++){palm(f,R()*W,y0-H*.02,H*(.13+R()*.07),(R()-.5)*.25,{trunk:'#1b3027',leaf:'#2f5443'},R)}
    for(let x=-10;x<W+20;x+=H*.028){crown(f,x,y0-H*.005-R()*H*.03,H*.028*(.7+R()*.6),{base:'#24433a',light:'#4f7a5a',dark:'#12241c'},R)}
    L.far=fc;
    // orillas cercanas
    let [nc,n]=off();const Q=rng(41);
    const near={base:'#1f3b27',light:'#4c7a43',dark:'#0a160d'};
    g=n.createLinearGradient(0,y0,0,H);g.addColorStop(0,'#24361f');g.addColorStop(1,'#0b130c');
    n.fillStyle=g;n.beginPath();n.moveTo(0,y0+H*.01);n.bezierCurveTo(W*.12,y0+H*.04,W*.2,y0+H*.12,W*.17,H*.72);n.bezierCurveTo(W*.15,H*.86,W*.24,H*.95,W*.27,H);n.lineTo(0,H);n.closePath();n.fill();
    n.beginPath();n.moveTo(W,y0+H*.03);n.bezierCurveTo(W*.9,y0+H*.08,W*.86,H*.66,W*.88,H*.78);n.bezierCurveTo(W*.89,H*.88,W*.8,H*.95,W*.77,H);n.lineTo(W,H);n.closePath();n.fill();
    // barro húmedo en la orilla
    n.strokeStyle='rgba(120,95,60,.35)';n.lineWidth=H*.008;
    n.beginPath();n.moveTo(W*.02,y0+H*.015);n.bezierCurveTo(W*.13,y0+H*.05,W*.2,y0+H*.13,W*.172,H*.72);n.stroke();
    n.beginPath();n.moveTo(W*.98,y0+H*.035);n.bezierCurveTo(W*.9,y0+H*.09,W*.862,H*.66,W*.882,H*.78);n.stroke();
    // pasto
    n.strokeStyle='#3d6634';n.lineWidth=1.2;
    for(let i=0;i<260;i++){const left=i%2===0;const yy=y0+Q()*(H-y0);const edge=left?W*(.17-.06*Math.pow(1-(yy-y0)/(H-y0),2)):W*(.87+.06*Math.pow(1-(yy-y0)/(H-y0),2));const xx=left?Q()*edge:edge+Q()*(W-edge);const hh=H*(.01+Q()*.025);n.beginPath();n.moveTo(xx,yy);n.quadraticCurveTo(xx+(Q()-.5)*hh,yy-hh*.6,xx+(Q()-.5)*hh*.8,yy-hh);n.stroke()}
    for(let i=0;i<7;i++){crown(n,Q()*W*.13,y0-H*.18+Q()*H*.22,H*(.09+Q()*.06),near,Q)}
    for(let i=0;i<6;i++){crown(n,W*.88+Q()*W*.14,y0-H*.16+Q()*H*.22,H*(.08+Q()*.06),near,Q)}
    for(let i=0;i<4;i++){crown(n,-H*.05+Q()*W*.08,Q()*H*.12,H*(.12+Q()*.05),near,Q)}
    for(let i=0;i<4;i++){crown(n,W*.94+Q()*W*.08,Q()*H*.1,H*(.11+Q()*.05),near,Q)}
    // helechos frontales
    for(let i=0;i<5;i++){const x=Q()*W*.18,y=H*(.82+Q()*.16);for(let k=0;k<7;k++)frond(n,x,y,H*.12,-Math.PI/2+(k/6-.5)*2.4,'#2d5a2c',1.4)}
    for(let i=0;i<5;i++){const x=W*.84+Q()*W*.16,y=H*(.82+Q()*.16);for(let k=0;k<7;k++)frond(n,x,y,H*.12,-Math.PI/2+(k/6-.5)*2.4,'#2d5a2c',1.4)}
    L.near=nc;
    // sprites de nubes
    cloudSpr=[];
    for(let s=0;s<4;s++){
      const cw=W*.42,ch=H*.2;
      const mk=(c1,c2)=>{const c=document.createElement('canvas');c.width=cw*dpr;c.height=ch*dpr;const x=c.getContext('2d');x.scale(dpr,dpr);const R2=rng(100+s);
        for(let i=0;i<34;i++){const px=cw*(.15+R2()*.7),py=ch*(.35+R2()*.4),r=ch*(.12+R2()*.22);const gg=x.createRadialGradient(px,py-r*.3,r*.1,px,py,r);gg.addColorStop(0,c1);gg.addColorStop(1,c2);x.fillStyle=gg;x.beginPath();x.arc(px,py,r,0,7);x.fill()}
        return c};
      cloudSpr.push({light:mk('rgba(255,214,190,.55)','rgba(240,160,150,0)'),dark:mk('rgba(70,78,86,.95)','rgba(40,46,52,0)'),w:cw,h:ch});
    }
    if(!clouds.length){const R3=rng(5);for(let i=0;i<9;i++)clouds.push({x:R3()*W*1.3-W*.2,y:R3()*H*.3-H*.05,s:.6+R3()*.8,v:3+R3()*6,k:i%4})}
    if(!flies.length){const R4=rng(77);for(let i=0;i<30;i++)flies.push({x:R4()<.5?R4()*.18:.82+R4()*.18,y:.45+R4()*.4,p:R4()*6.28})}
  }

  function resize(){
    const r=cv.getBoundingClientRect();if(!r.width)return;
    dpr=Math.min(2,window.devicePixelRatio||1);W=r.width;H=r.height;
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    clouds=[];build();
  }
  new ResizeObserver(resize).observe(cv);

  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
  function log(x,y,len,th){
    const g=ctx.createLinearGradient(0,y-th/2,0,y+th/2);g.addColorStop(0,'#b08355');g.addColorStop(.4,'#7a5230');g.addColorStop(1,'#2e1c0e');
    ctx.fillStyle=g;rr(x,y-th/2,len,th,th/2);ctx.fill();
    ctx.strokeStyle='rgba(35,20,8,.45)';ctx.lineWidth=Math.max(.6,th*.07);
    for(let i=1;i<6;i++){ctx.beginPath();ctx.moveTo(x+len*i/6,y-th*.35);ctx.quadraticCurveTo(x+len*i/6+th*.6,y,x+len*i/6,y+th*.3);ctx.stroke()}
    ctx.fillStyle='#d4ab73';ctx.beginPath();ctx.ellipse(x+len-th*.2,y,th*.3,th*.47,0,0,7);ctx.fill();
    ctx.strokeStyle='rgba(110,70,35,.7)';ctx.beginPath();ctx.ellipse(x+len-th*.2,y,th*.16,th*.26,0,0,7);ctx.stroke();
  }
  /* ---- el remero ---- */
  const SKIN='#8d5b3b', SLEEVE='#e2dbc9', SLEEVE2='#b8b09c';
  function arm(S,G,pk,sleeve){
    const mx=(S[0]+G[0])/2,my=(S[1]+G[1])/2,dx=G[0]-S[0],dy=G[1]-S[1],d=Math.hypot(dx,dy)||1;
    let px=-dy/d,py=dx/d;if(py<0){px=-px;py=-py}
    const bend=Math.max(0,22*pk-d)*.45+1.5*pk, E=[mx+px*bend,my+py*bend];
    ctx.lineCap='round';
    ctx.strokeStyle=sleeve;ctx.lineWidth=5*pk;ctx.beginPath();ctx.moveTo(S[0],S[1]);ctx.lineTo(E[0],E[1]);ctx.stroke();
    ctx.strokeStyle=SKIN;ctx.lineWidth=3.6*pk;ctx.beginPath();ctx.moveTo(E[0],E[1]);ctx.lineTo(G[0],G[1]);ctx.stroke();
    ctx.fillStyle=SKIN;ctx.beginPath();ctx.arc(G[0],G[1],2.3*pk,0,7);ctx.fill();
  }
  function head(x,y,pk,happy){
    ctx.fillStyle=SKIN;ctx.fillRect(x-2*pk,y+4*pk,4*pk,5*pk);
    const g=ctx.createRadialGradient(x-2*pk,y-2.5*pk,pk,x,y,7*pk);g.addColorStop(0,'#a8714c');g.addColorStop(1,'#6f4529');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,6.6*pk,0,7);ctx.fill();
    ctx.beginPath();ctx.moveTo(x+6*pk,y-1.5*pk);ctx.lineTo(x+8.4*pk,y+1*pk);ctx.lineTo(x+6*pk,y+1.8*pk);ctx.fill();
    ctx.fillStyle='#1a1210';ctx.beginPath();ctx.moveTo(x-.5*pk,y-1.5*pk);ctx.arc(x-.5*pk,y-1.5*pk,6.9*pk,Math.PI*.82,Math.PI*1.72);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.arc(x+3.6*pk,y-1.4*pk,.95*pk,0,7);ctx.fill();
    ctx.strokeStyle='#3a2014';ctx.lineWidth=.9*pk;ctx.beginPath();
    if(happy)ctx.arc(x+3.8*pk,y+2.2*pk,1.9*pk,.2,Math.PI-.5);else{ctx.moveTo(x+3*pk,y+3.3*pk);ctx.lineTo(x+5.6*pk,y+3.1*pk)}
    ctx.stroke();
  }
  function hat(x,y,pk,rot){
    ctx.save();ctx.translate(x,y);ctx.rotate(rot);
    ctx.fillStyle='#d8c28a';ctx.beginPath();ctx.ellipse(0,0,14*pk,3.4*pk,0,0,7);ctx.fill();
    ctx.fillStyle='#c7ab6a';rr(-6.5*pk,-8*pk,13*pk,8*pk,3*pk);ctx.fill();
    ctx.fillStyle='#5a2d1a';ctx.fillRect(-6.5*pk,-2.8*pk,13*pk,2*pk);
    ctx.strokeStyle='rgba(90,60,20,.4)';ctx.lineWidth=.6*pk;ctx.beginPath();ctx.ellipse(0,0,10*pk,2.2*pk,0,0,7);ctx.stroke();
    ctx.restore();
  }
  // pose: 'paddle' rema tranquilo · 'push' rema con fuerza · 'stumble' se tambalea · 'cheer' celebra
  function person(pk,pose,ph,T){
    let lean=.06, ang=.3+Math.sin(ph)*.45, dx=-Math.cos(ph)*3*pk, hatUp=0, hatRot=0, jump=0;
    if(pose==='push'){lean=.2+Math.sin(ph)*.08;ang=.2+Math.sin(ph)*.65}
    if(pose==='stumble'){const e=Math.sin(Math.min(1,T)*Math.PI);lean=.06-.5*e;ang=.3-1.25*e;hatUp=18*pk*e;hatRot=-.7*e;dx=0}
    if(pose==='cheer'){jump=Math.abs(Math.sin(t*5))*7*pk;lean=0}
    ctx.save();ctx.translate(0,-jump);ctx.lineCap='round';
    // pantalón
    const knee=pose==='push'?3*pk:1.5*pk;
    ctx.strokeStyle='#2e4660';ctx.lineWidth=6*pk;ctx.beginPath();
    ctx.moveTo(-5*pk,-9*pk);ctx.lineTo(-3*pk+knee,-16*pk);ctx.lineTo(-1.5*pk,-24*pk);
    ctx.moveTo(5*pk,-9*pk);ctx.lineTo(6*pk+knee,-16*pk);ctx.lineTo(2*pk,-24*pk);ctx.stroke();
    // botas pantaneras
    [-5,5].forEach(f=>{ctx.fillStyle='#17201b';rr((f-3.6)*pk,-11*pk,7.2*pk,11*pk,2*pk);ctx.fill();rr((f-3.6)*pk,-3.4*pk,10.5*pk,3.4*pk,1.6*pk);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.16)';ctx.lineWidth=.9*pk;ctx.beginPath();ctx.moveTo((f-1.8)*pk,-10*pk);ctx.lineTo((f-1.8)*pk,-4*pk);ctx.stroke()});
    // hombros y manos sobre el canalete
    const hy=-24*pk, sx=Math.sin(lean)*23*pk, sy=hy-Math.cos(lean)*23*pk, ox=Math.cos(lean)*3.5*pk, oy=Math.sin(lean)*3.5*pk;
    const S1=[sx+ox,sy+oy], S2=[sx-ox,sy-oy];
    let G1,G2,u=[0,1];
    if(pose==='cheer'){G1=[sx-9*pk,sy-21*pk];G2=[sx+10*pk,sy-21*pk]}
    else{const P=[sx+10*pk+dx,sy+13*pk];u=[Math.sin(ang),Math.cos(ang)];G1=[P[0]-u[0]*13*pk,P[1]-u[1]*13*pk];G2=[P[0]+u[0]*9*pk,P[1]+u[1]*9*pk]}
    arm(S2,G1,pk,SLEEVE2);
    // torso, cabeza y sombrero
    ctx.save();ctx.translate(0,hy);ctx.rotate(lean);
    const g=ctx.createLinearGradient(-8*pk,0,8*pk,0);g.addColorStop(0,'#cfc7b2');g.addColorStop(.5,'#f2ecdd');g.addColorStop(1,'#b3ab96');
    ctx.fillStyle=g;rr(-8*pk,-25*pk,16*pk,26*pk,6*pk);ctx.fill();
    ctx.fillStyle='#3b2a1a';ctx.fillRect(-8*pk,-2*pk,16*pk,3*pk);
    ctx.fillStyle='rgba(60,50,40,.35)';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(3*pk,-20*pk+i*6*pk,.8*pk,0,7);ctx.fill()}
    head(1*pk,-33*pk,pk,pose==='cheer');
    hat(1*pk,-38.5*pk-hatUp,pk,hatRot);
    ctx.restore();
    // canalete
    ctx.strokeStyle='#6b4624';ctx.lineWidth=2.6*pk;ctx.beginPath();ctx.fillStyle='#7a5030';
    if(pose==='cheer'){
      ctx.moveTo(G1[0]-12*pk,G1[1]);ctx.lineTo(G2[0]+22*pk,G2[1]);ctx.stroke();
      ctx.beginPath();ctx.ellipse(G2[0]+32*pk,G2[1],12*pk,4.6*pk,0,0,7);ctx.fill();
    }else{
      const tx0=G1[0]-u[0]*5*pk, ty0=G1[1]-u[1]*5*pk;
      ctx.moveTo(tx0,ty0);ctx.lineTo(G1[0]+u[0]*68*pk,G1[1]+u[1]*68*pk);ctx.stroke();
      ctx.lineWidth=2*pk;ctx.beginPath();ctx.moveTo(tx0-u[1]*3.5*pk,ty0+u[0]*3.5*pk);ctx.lineTo(tx0+u[1]*3.5*pk,ty0-u[0]*3.5*pk);ctx.stroke();
      ctx.beginPath();ctx.ellipse(G1[0]+u[0]*74*pk,G1[1]+u[1]*74*pk,4.6*pk,12*pk,-ang,0,7);ctx.fill();
    }
    arm(S1,G2,pk,SLEEVE);
    ctx.restore();
  }
  function swimmer(x,y,rk,dt){
    const pk=rk*1.2, b=Math.sin(t*2)*2*rk, wy=y+3*rk;
    if(!swimHat)swimHat={x:x+34*rk};
    swimHat.x+=W*.012*dt;
    clipped(wy,()=>{
      ctx.save();ctx.translate(x,y+b);
      ctx.fillStyle=SLEEVE;rr(-16*pk,-2*pk,13*pk,24*pk,5*pk);ctx.fill();
      ctx.strokeStyle='#2e4660';ctx.lineWidth=6*pk;ctx.lineCap='round';ctx.beginPath();
      ctx.moveTo(-12*pk,20*pk);ctx.lineTo(-20*pk,34*pk+Math.sin(t*4)*3*pk);ctx.moveTo(-7*pk,20*pk);ctx.lineTo(-12*pk,36*pk-Math.sin(t*4)*3*pk);ctx.stroke();
      log(-32*rk,4*rk,64*rk,10*rk);
      head(-8*pk,-7*pk,pk,false);
      arm([-11*pk,0],[6*pk,1*pk],pk,SLEEVE2);arm([-6*pk,1*pk],[13*pk,2*pk],pk,SLEEVE);
      ctx.restore();
    });
    hat(swimHat.x,wy+Math.sin(t*2.4)*1.5*rk,pk*.9,Math.sin(t*1.7)*.08);
    ctx.fillStyle='rgba(235,245,240,.3)';
    for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(x-30*rk+i*20*rk,wy,6*rk+Math.sin(t*3+i)*2*rk,1.3*rk,0,0,7);ctx.fill()}
  }
  // dibuja algo dos veces: nítido sobre el agua y tenue (sumergido) debajo de la línea de agua
  function clipped(wy,fn){
    ctx.save();ctx.beginPath();ctx.rect(-20,-20,W+40,wy+20);ctx.clip();fn();ctx.restore();
    ctx.save();ctx.beginPath();ctx.rect(-20,wy,W+40,H-wy+20);ctx.clip();ctx.globalAlpha*=.26;fn();ctx.restore();
  }
  function jag(x,y,th,dir){
    ctx.fillStyle='#e3c38d';ctx.beginPath();ctx.moveTo(x-dir*th*.6,y-th/2);ctx.lineTo(x,y-th/2);
    for(let i=1;i<=6;i++)ctx.lineTo(x+dir*(i%2?th*.5:th*.08),y-th/2+th*i/6);
    ctx.lineTo(x-dir*th*.6,y+th/2);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(90,55,25,.6)';ctx.lineWidth=Math.max(.6,th*.06);ctx.stroke();
  }
  function crack(x,y,th,p){
    ctx.strokeStyle=`rgba(255,240,210,${.6+.4*Math.sin(t*40)})`;ctx.lineWidth=Math.max(1,th*.13);ctx.beginPath();ctx.moveTo(x,y-th/2);
    const segs=Math.max(1,Math.round(6*Math.min(1,p*1.5+.2)));
    for(let i=1;i<=segs;i++)ctx.lineTo(x+(i%2?th*.28:-th*.22),y-th/2+th*i/6);
    ctx.stroke();
  }
  function drawDock(by,rk){
    const x0=W*.8,x1=W+10,dy=by-14*rk;
    for(let x=x0+4*rk;x<x1;x+=30*rk){
      ctx.fillStyle='#2e2014';ctx.fillRect(x,dy-10*rk,5*rk,by+8*rk-(dy-10*rk));
      ctx.strokeStyle='rgba(220,235,235,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x+2.5*rk,by+8*rk,6*rk,1.5*rk,0,0,7);ctx.stroke();
    }
    const g=ctx.createLinearGradient(0,dy-7*rk,0,dy+2*rk);g.addColorStop(0,'#9a7448');g.addColorStop(1,'#4a321c');
    ctx.fillStyle=g;ctx.fillRect(x0,dy-7*rk,x1-x0,8*rk);
    ctx.strokeStyle='rgba(30,18,8,.6)';ctx.lineWidth=1;
    for(let x=x0;x<x1;x+=10*rk){ctx.beginPath();ctx.moveTo(x,dy-7*rk);ctx.lineTo(x,dy+1*rk);ctx.stroke()}
    ctx.fillStyle='#3b2a1a';ctx.fillRect(x0+2*rk,dy-24*rk,5*rk,18*rk);
    ctx.strokeStyle='#c9b27a';ctx.lineWidth=1.4*rk;ctx.beginPath();ctx.arc(x0+4.5*rk,dy-18*rk,3.2*rk,0,7);ctx.stroke();
  }
  function doBreak(bx,by,len,th,rk){
    if(logsShown<=0)return;
    logsShown--;settle=logsShown>0?1:0;
    drift.push({x:bx-len*.27,y:by+2*rk,vx:-W*.05,vy:H*.03,r:0,vr:-.35,a:1,half:'L',len:len*.5,th});
    drift.push({x:bx+len*.27,y:by+2*rk,vx:W*.06,vy:H*.035,r:0,vr:.3,a:1,half:'R',len:len*.5,th});
    const cols=['#e3c38d','#b08355','#7a5230'];
    for(let i=0;i<26;i++)parts.push({type:'wood',x:bx+(Math.random()-.5)*20*rk,y:by,vx:(Math.random()-.5)*280*rk,vy:-(120+Math.random()*210)*rk,g:520*rk,life:2.4,max:2.4,wy:by+(3+Math.random()*14)*rk,r:Math.random()*6,vr:(Math.random()-.5)*14,size:(2+Math.random()*3)*rk,c:cols[i%3]});
    for(let i=0;i<32;i++)parts.push({type:'drop',x:bx+(Math.random()-.5)*len*.8,y:by+2*rk,vx:(Math.random()-.5)*170*rk,vy:-(80+Math.random()*190)*rk,g:480*rk,life:1.5,max:1.5,wy:by+6*rk,size:(1+Math.random()*1.8)*rk});
    for(let i=0;i<5;i++)rings.push({x:bx+(Math.random()-.5)*len*.7,y:by+6*rk,r:2+i*3,a:.6});
    redFlash=1;
    texts=texts.filter(o=>o.c!=='#ff9a88');texts.push({s:logsShown>0?'¡CRAC! Se partió un tronco':'¡La balsa se deshizo!',x:bx,y:by-115*rk,c:'#ff9a88',life:1.9});
  }
  function plantains(k){
    ctx.strokeStyle='#4b3a1c';ctx.lineWidth=2*k;ctx.beginPath();ctx.moveTo(0,-26*k);ctx.lineTo(0,-2*k);ctx.stroke();
    for(let r=0;r<4;r++)for(let i=0;i<4;i++){
      const y=-22*k+r*5.5*k, x=(i-1.5)*4*k;
      ctx.strokeStyle=r%2?'#6f9b35':'#86b043';ctx.lineWidth=3.2*k;ctx.beginPath();ctx.arc(x+2*k,y,6*k,Math.PI*1.05,Math.PI*1.6);ctx.stroke();
    }
  }
  function lantern(x,y,k,on){
    ctx.fillStyle='#2b2b2b';ctx.fillRect(x-4*k,y-14*k,8*k,14*k);
    ctx.fillStyle=on?`rgba(255,${190+Math.sin(t*9)*20|0},90,.95)`:'#3a3a35';ctx.fillRect(x-3*k,y-12*k,6*k,9*k);
    ctx.strokeStyle='#2b2b2b';ctx.lineWidth=1.2*k;ctx.beginPath();ctx.arc(x,y-15*k,3*k,Math.PI,0);ctx.stroke();
  }
  function bird(b){
    const k=H/400*b.s, fl=Math.sin(t*10+b.p);
    ctx.save();ctx.translate(b.x,b.y);ctx.scale(b.vx<0?-1:1,1);
    ctx.fillStyle=b.c[0];ctx.beginPath();ctx.ellipse(0,0,9*k,3.6*k,0,0,7);ctx.fill();
    ctx.beginPath();ctx.moveTo(-8*k,0);ctx.lineTo(-24*k,2*k);ctx.lineTo(-8*k,2.5*k);ctx.fill();
    ctx.fillStyle=b.c[1];ctx.beginPath();ctx.moveTo(-2*k,-1*k);ctx.lineTo(-6*k,-16*k*fl);ctx.lineTo(5*k,-1*k);ctx.fill();
    ctx.fillStyle=b.c[2];ctx.beginPath();ctx.arc(8*k,-1*k,2.6*k,0,7);ctx.fill();
    ctx.restore();
  }

  let last=performance.now();
  function frame(now){
    if(!L.mount||!L.near){resize();requestAnimationFrame(frame);return}
    const dt=Math.min(.05,(now-last)/1000);last=now;t+=dt;
    const target = mode==='won'?0:Math.min(1,errors/MAX_ERR*1.05);
    storm+= (target-storm)*Math.min(1,dt*1.4);
    if(mode==='won')rainbow=Math.min(1,rainbow+dt*.5);else rainbow=Math.max(0,rainbow-dt);
    const s=storm, y0=horizon(), k=H/400;
    const wind=.03+s*.14;

    // cielo
    let g=ctx.createLinearGradient(0,0,0,y0);
    g.addColorStop(0,mix('#132650','#191f25',s));g.addColorStop(.55,mix('#7a4d7d','#363f47',s));g.addColorStop(1,mix('#f3a660','#5b6469',s));
    ctx.fillStyle=g;ctx.fillRect(0,0,W,y0+2);
    // estrellas
    ctx.fillStyle=`rgba(255,255,240,${.55*(1-s)})`;{const R=rng(3);for(let i=0;i<60;i++){const x=R()*W,y=R()*y0*.45;if(Math.sin(t*2+i)>-.3)ctx.fillRect(x,y,1.2,1.2)}}
    // sol
    const sx=W*.7, sy=y0-H*.07;
    if(s<.98){
      g=ctx.createRadialGradient(sx,sy,0,sx,sy,H*.35);g.addColorStop(0,`rgba(255,220,150,${.75*(1-s)})`);g.addColorStop(1,'rgba(255,170,90,0)');
      ctx.fillStyle=g;ctx.fillRect(0,0,W,y0);
      ctx.fillStyle=`rgba(255,226,170,${1-s})`;ctx.beginPath();ctx.arc(sx,sy,H*.045,0,7);ctx.fill();
    }
    // arcoíris
    if(rainbow>0){
      const cols=['#ff5a4e','#ff9b3d','#ffe15a','#6fd16b','#4fa8ff','#7b6cff'];
      ctx.lineWidth=H*.012;cols.forEach((c,i)=>{ctx.strokeStyle=c;ctx.globalAlpha=.32*rainbow;ctx.beginPath();ctx.arc(W*.42,y0+H*.12,H*.55-i*H*.012,Math.PI*1.08,Math.PI*1.92);ctx.stroke()});ctx.globalAlpha=1;
    }
    // nubes
    clouds.forEach(c=>{
      c.x+=c.v*(1+s*4)*dt*(W/800);if(c.x>W*1.1)c.x=-W*.5;
      const sp=cloudSpr[c.k];if(!sp)return;const w=sp.w*c.s,h=sp.h*c.s,yy=c.y+s*H*.05;
      ctx.globalAlpha=.7*(1-s);ctx.drawImage(sp.light,c.x,yy,w,h);
      ctx.globalAlpha=Math.min(1,s*1.3);ctx.drawImage(sp.dark,c.x,yy,w*1.2,h*1.25);
    });
    ctx.globalAlpha=1;
    // montañas y bruma
    ctx.drawImage(L.mount,0,0,W,H);
    g=ctx.createLinearGradient(0,y0-H*.2,0,y0);g.addColorStop(0,mix('#f3a660','#5b6469',s,0));g.addColorStop(1,mix('#e9a57a','#5b6469',s,.5));
    ctx.fillStyle=g;ctx.fillRect(0,y0-H*.2,W,H*.2);
    ctx.drawImage(L.far,0,0,W,H);

    // río
    const top=y0-H*.035*s;
    g=ctx.createLinearGradient(0,top,0,H);
    g.addColorStop(0,mix('#c98a63','#4e585b',s));g.addColorStop(.25,mix('#4d6a6a','#33403f',s));g.addColorStop(1,mix('#0f2a2c','#0b1415',s));
    ctx.fillStyle=g;ctx.fillRect(0,top,W,H-top);
    // reflejo de la selva
    ctx.save();ctx.beginPath();ctx.rect(0,top,W,H-top);ctx.clip();
    ctx.globalAlpha=.32*(1-s*.6);ctx.translate(0,2*top);ctx.scale(1,-1);ctx.drawImage(L.far,0,0,W,H);ctx.restore();
    // reflejo del sol
    if(s<.95){for(let i=0;i<40;i++){const p=i/40,y=top+p*p*(H-top)*.9+2,w=(W*.03+p*W*.05)*(.6+.4*Math.sin(t*2+i*1.7));ctx.fillStyle=`rgba(255,215,150,${(.5-p*.45)*(1-s)})`;ctx.fillRect(sx-w/2+Math.sin(t*1.3+i)*6,y,w,1.6+p*2)}}
    // ondas
    ctx.lineCap='round';
    for(let j=0;j<90;j++){
      const p=Math.pow(((j*.618)%1),1.5), y=top+p*(H-top)+Math.sin(t*(1+s)+j)*2*(1+s*2);
      const x=((j*137.5+t*(14+s*40)*(.4+p))%(W+80))-40, len=(8+p*40)*(1+s*.6);
      ctx.strokeStyle=`rgba(${s>.5?'190,205,210':'255,230,200'},${.06+p*.1+s*.06})`;ctx.lineWidth=.8+p*1.6;
      ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+len/2,y-1.5-s*3,x+len,y);ctx.stroke();
    }
    // ======== travesía en balsa ========
    const rk=RK(), len=170*rk, th=12*rk, by=top+(H-top)*.46, pk=rk*1.2;
    if(raftX===null)raftX=startX();
    const tx=startX()+(endX()-startX())*prog, px0=raftX;
    raftX+=(tx-raftX)*Math.min(1,dt*(pushT>0?1.9:1.1));
    const vel=(raftX-px0)/Math.max(dt,1e-3);
    pushT=Math.max(0,pushT-dt);stumbleT=Math.max(0,stumbleT-dt);shakeT=Math.max(0,shakeT-dt);
    settle=Math.max(0,settle-dt*2.5);redFlash=Math.max(0,redFlash-dt*1.4);
    // cola de rupturas: cada error agrieta el tronco del frente y luego lo parte
    if(breakT>0){breakT-=dt;if(breakT<=0)doBreak(lastBx,by,len,th,rk)}
    else if(pending>0&&logsShown>0){pending--;breakT=.38;shakeT=.75;stumbleT=1.1}

    drawDock(by,rk);

    // mitades de troncos partidos a la deriva
    drift.forEach(d=>{
      d.vx+=(W*.012-d.vx)*dt*.4;d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy*=Math.pow(.6,dt);d.r+=d.vr*dt;d.vr*=Math.pow(.5,dt);d.a=Math.max(0,d.a-dt*.045);
      const yy=d.y+Math.sin(t*2+d.x*.05)*2*rk;
      ctx.globalAlpha=d.a;
      clipped(yy+d.th*.2,()=>{ctx.save();ctx.translate(d.x,yy);ctx.rotate(d.r);log(-d.len/2,0,d.len,d.th);jag(d.half==='L'?d.len/2:-d.len/2,0,d.th,d.half==='L'?1:-1);ctx.restore()});
      ctx.globalAlpha=1;
    });
    drift=drift.filter(d=>d.a>0&&d.x<W+200);

    // partículas (estela, astillas, gotas)
    parts.forEach(p=>{
      p.life-=dt;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.type==='wood'){p.r+=p.vr*dt;if(p.vy>0&&p.y>p.wy){p.y=p.wy;p.vy=0;p.g=0;p.vx*=.25;p.vr*=.15;if(!p.hit){p.hit=1;rings.push({x:p.x,y:p.y,r:1,a:.5})}}}
      else if(p.type==='drop'){if(p.vy>0&&p.y>p.wy){p.life=0;if(Math.random()<.3)rings.push({x:p.x,y:p.wy,r:1,a:.4})}}
      else p.size+=dt*8*rk;
    });
    parts=parts.filter(p=>p.life>0);
    parts.forEach(p=>{if(p.type!=='foam')return;ctx.fillStyle=`rgba(235,245,240,${p.life/p.max*.35})`;ctx.beginPath();ctx.ellipse(p.x,p.y,p.size,p.size*.28,0,0,7);ctx.fill()});

    const n=logsShown, st01=stumbleT>0?1-stumbleT/1.1:0;
    const sh=shakeT>0?Math.sin(t*75)*5*rk*(shakeT/.75):0;
    const recoil=stumbleT>0?-Math.sin(st01*Math.PI)*W*.018:0;
    const bx=raftX+sh+recoil;lastBx=bx;lastBy=by;
    const bob=Math.sin(t*1.6)*(2+s*5)*rk;
    let ang=Math.sin(t*1.1)*(.02+s*.06);
    if(stumbleT>0)ang+=Math.sin(st01*Math.PI*3)*.07*(1-st01);
    // estela cuando la balsa avanza
    if(vel>W*.012&&n>0&&Math.random()<dt*35)parts.push({type:'foam',x:bx-len*.5+Math.random()*10*rk,y:by+th*.3+Math.random()*7*rk,vx:-vel*.25,vy:Math.random()*5*rk,g:0,life:1.5,max:1.5,size:(4+Math.random()*6)*rk});
    const lampOn=errors<6&&mode!=='lost'&&n>=3;
    let pose='paddle';
    if(mode==='won'&&Math.abs(raftX-tx)<W*.015)pose='cheer';
    else if(stumbleT>0)pose='stumble';
    else if(pushT>0||Math.abs(tx-raftX)>W*.02)pose='push';
    padPh+=dt*(pose==='push'?7:pose==='paddle'?2.2:0);
    const cph=Math.cos(padPh);
    if(n>0&&(pose==='push'||pose==='paddle')&&prevCos>0&&cph<=0){
      const m=pose==='push'?10:4;
      for(let i=0;i<m;i++)parts.push({type:'drop',x:bx+64*rk+(Math.random()-.5)*10*rk,y:by+2*rk,vx:(Math.random()-.3)*70*rk,vy:-(60+Math.random()*100)*rk,g:330*rk,life:1,max:1,wy:by+4*rk,size:(1+Math.random()*1.4)*rk});
    }
    prevCos=cph;

    if(n>0){
      ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(bx,by+10*rk,len*.6,10*rk,0,0,7);ctx.fill();
      if(lampOn){ctx.save();ctx.globalCompositeOperation='lighter';const lx=bx-76*rk;g=ctx.createRadialGradient(lx,by+10*rk,0,lx,by+10*rk,70*rk);g.addColorStop(0,`rgba(255,170,70,${.33+Math.sin(t*9)*.04})`);g.addColorStop(1,'rgba(255,140,40,0)');ctx.fillStyle=g;ctx.fillRect(lx-80*rk,by-70*rk,160*rk,150*rk);ctx.restore()}
      const raft=()=>{
        ctx.save();ctx.translate(bx,by+bob);ctx.rotate(ang);ctx.translate(settle*2.4*rk,-settle*5.5*rk);
        for(let i=0;i<n;i++){const d=n-1-i,lx=-len/2+d*2.4*rk,ly=-d*5.5*rk;
          if(d===0&&breakT>0){const j=Math.sin(t*95)*1.6*rk;log(lx+j,ly,len,th);crack(lx+len/2+j,ly,th,1-breakT/.38)}
          else log(lx,ly,len,th)}
        ctx.strokeStyle='#c9b27a';ctx.lineWidth=1.6*rk;
        [-.32,.3].forEach(f=>{ctx.beginPath();ctx.moveTo(len*f,-(n-1)*5.5*rk-th*.4);ctx.lineTo(len*f-(n-1)*2.4*rk,th*.4);ctx.stroke()});
        const deck=-(n-1)*5.5*rk*.5-th*.35;
        if(n>=2){ctx.save();ctx.translate(-48*rk,deck);plantains(rk*1.1);ctx.restore()}
        if(n>=3)lantern(-76*rk,deck,rk,lampOn);
        ctx.save();ctx.translate(6*rk,deck);person(pk,pose,padPh,st01);ctx.restore();
        ctx.restore();
      };
      clipped(by+th*.25,raft);
      ctx.fillStyle='rgba(235,245,240,.38)';
      for(let i=0;i<7;i++){ctx.beginPath();ctx.ellipse(bx-len*.58+i*len*.19,by+th*.25+Math.sin(t*3+i)*1.2*rk,7*rk+Math.sin(t*4+i)*2*rk,1.3*rk,0,0,7);ctx.fill()}
    }else{
      swimmer(bx,by,rk,dt);
    }

    // astillas y gotas por encima de todo lo del río
    parts.forEach(p=>{
      if(p.type==='wood'){ctx.save();ctx.globalAlpha=Math.min(1,p.life);ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.size,-p.size*.25,p.size*2,p.size*.5);ctx.restore()}
      else if(p.type==='drop'){ctx.fillStyle=`rgba(225,240,245,${Math.min(1,p.life)*.85})`;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,7);ctx.fill()}
    });

    // orillas cercanas
    ctx.drawImage(L.near,0,0,W,H);
    // palmas que se mueven con el viento
    const pr=rng(901);
    palm(ctx,W*.035,H*1.02,H*.86,.16,{trunk:'#1c2a1c',leaf:'#24452a'},pr,Math.sin(t*1.2)*wind);
    palm(ctx,W*.975,H*1.02,H*.8,-.18,{trunk:'#1c2a1c',leaf:'#24452a'},pr,Math.sin(t*1.1+1)*wind);

    // guacamayas
    if(mode==='won'&&birds.length<5&&Math.random()<dt*1.5){const R=Math.random;birds.push({x:-30,y:H*(.12+R()*.25),vx:W*(.12+R()*.08),s:.8+R()*.6,p:R()*6,c:R()<.5?['#d8352a','#2f6fd6','#f2d24a']:['#2f8fd6','#f2c23a','#1b3d7a']})}
    birds.forEach(b=>{b.x+=b.vx*dt;b.y+=Math.sin(t*2+b.p)*.4;bird(b)});birds=birds.filter(b=>b.x<W+60);

    // luciérnagas
    if(s<.35&&!reduce){ctx.save();ctx.globalCompositeOperation='lighter';flies.forEach(f=>{const a=(.5+.5*Math.sin(t*3+f.p))*(1-s*2.8);if(a<=0)return;const x=f.x*W+Math.sin(t*.7+f.p)*12,y=f.y*H+Math.cos(t*.9+f.p)*8;g=ctx.createRadialGradient(x,y,0,x,y,6);g.addColorStop(0,`rgba(220,255,140,${a})`);g.addColorStop(1,'rgba(220,255,140,0)');ctx.fillStyle=g;ctx.fillRect(x-6,y-6,12,12)});ctx.restore()}

    // lluvia
    const want=Math.floor(Math.max(0,s-.2)*1.25*420*(W/900));
    while(rain.length<want)rain.push({x:Math.random()*W*1.2,y:Math.random()*-H,v:H*(1.6+Math.random()),l:8+Math.random()*12});
    if(rain.length>want)rain.length=want;
    ctx.strokeStyle='rgba(200,215,225,.35)';ctx.lineWidth=1;ctx.beginPath();
    const slant=.28+s*.3;
    rain.forEach(d=>{d.y+=d.v*dt;d.x-=d.v*dt*slant;
      if(d.y>top+(H-top)*Math.random()*1.4||d.x<-20){if(d.y>top&&rings.length<120&&Math.random()<.4)rings.push({x:d.x,y:d.y,r:1,a:.5});d.y=Math.random()*-40;d.x=Math.random()*W*1.25}
      ctx.moveTo(d.x,d.y);ctx.lineTo(d.x+d.l*slant*k,d.y-d.l*k)});
    ctx.stroke();
    rings.forEach(r=>{r.r+=dt*14;r.a-=dt*1.1;ctx.strokeStyle=`rgba(210,225,230,${Math.max(0,r.a)})`;ctx.beginPath();ctx.ellipse(r.x,r.y,r.r,r.r*.3,0,0,7);ctx.stroke()});
    rings=rings.filter(r=>r.a>0);

    // relámpagos
    if(!reduce&&s>.6&&!bolt&&Math.random()<dt*.5*s){
      const pts=[];let x=W*(.2+Math.random()*.6),y=0;while(y<y0-H*.05){pts.push([x,y]);x+=(Math.random()-.5)*W*.05;y+=H*(.03+Math.random()*.05)}bolt={pts,life:.25};flash=1;
    }
    if(bolt){ctx.strokeStyle=`rgba(235,240,255,${bolt.life*4})`;ctx.lineWidth=2.2;ctx.shadowColor='#cfe0ff';ctx.shadowBlur=14;ctx.beginPath();bolt.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.shadowBlur=0;bolt.life-=dt;if(bolt.life<=0)bolt=null}

    // oscurecimiento y viñeta
    ctx.fillStyle=`rgba(6,10,14,${Math.max(0,s*.32)})`;ctx.fillRect(0,0,W,H);
    if(flash>0){ctx.fillStyle=`rgba(225,235,255,${flash*.45})`;ctx.fillRect(0,0,W,H);flash=Math.max(0,flash-dt*3)}
    g=ctx.createRadialGradient(W/2,H*.55,H*.3,W/2,H*.55,W*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.45)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // destello rojo en los bordes cuando se parte un tronco
    if(redFlash>0){g=ctx.createRadialGradient(W/2,H/2,H*.25,W/2,H/2,W*.7);g.addColorStop(0,'rgba(220,50,30,0)');g.addColorStop(1,`rgba(220,50,30,${.5*redFlash})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
    // textos flotantes
    ctx.textAlign='center';ctx.lineJoin='round';
    const fs=Math.round(Math.max(18,28*RK()));
    ctx.font=`900 ${fs}px "Big Shoulders Display", Impact, sans-serif`;
    texts.forEach(o=>{o.life-=dt;o.y-=H*.06*dt;
      const half=ctx.measureText(o.s).width/2+12, x=Math.min(W-half,Math.max(half,o.x));
      ctx.globalAlpha=Math.max(0,Math.min(1,o.life*1.6));
      ctx.lineWidth=6;ctx.strokeStyle='rgba(5,10,8,.85)';ctx.strokeText(o.s,x,o.y);
      ctx.fillStyle=o.c;ctx.fillText(o.s,x,o.y)});
    ctx.globalAlpha=1;texts=texts.filter(o=>o.life>0);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    setErrors(e){if(e>errors&&e>=5&&!reduce)flash=.5;errors=e},
    bad(){pending++},
    good(msg){pushT=1.3;texts=texts.filter(o=>o.c!=='#a9f0a0');texts.push({s:msg,x:lastBx||W*.4,y:(lastBy||H*.75)-115*RK(),c:'#a9f0a0',life:1.6})},
    setProgress(p){prog=Math.max(0,Math.min(1,p))},
    win(){mode='won';birds=[]},
    lose(){mode='lost'},
    reset(){mode='play';errors=0;logsShown=7;pending=0;breakT=0;settle=0;shakeT=0;stumbleT=0;redFlash=0;
      drift=[];parts=[];texts=[];rainbow=0;prog=0;swimHat=null;raftX=-W*.3;pushT=2.2}
  };
})();
