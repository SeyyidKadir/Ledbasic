const fs=require('fs'), zlib=require('zlib'), {El,mkList,matchSel}=require('/tmp/sim/dom.js');
const HTML='/home/claude/ledlang/index.html';
const src=fs.readFileSync(HTML,'utf8');
const scripts=src.match(/<script>([\s\S]*?)<\/script>/g).map(s=>s.replace(/^<script>|<\/script>$/g,''));

// --- Belge iskeleti: gerçek HTML'in gövdesini parse et ---
const bodyMatch=src.match(/<body>([\s\S]*)<\/body>/);
const documentEl=new El('html');
const body=new El('body'); documentEl.appendChild(body);
// script/style bloklarını çıkarıp gövdeyi kur
let bodyHtml=bodyMatch[1].replace(/<script>[\s\S]*?<\/script>/g,'').replace(/<style>[\s\S]*?<\/style>/g,'');
body.innerHTML=bodyHtml;

// --- Player payload'ını gövdeye ekle (gerçek export biçiminde) ---
const project={version:1,
  meta:{name:'Trafik Lambası',author:'Üstad Çağrı',updatedAt:new Date().toISOString()},
  board:{cols:30,rowsPerHalf:5},
  counters:{compIdSeq:4,pinCounters:{led:2,sound:1}},
  components:[
    {id:1,kind:'led',name:'LED1',pin:'P12',x:40,y:90,props:{color:'red',rgb:{r:255,g:40,b:40}}},
    {id:2,kind:'led',name:'LED2',pin:'P14',x:90,y:90,props:{color:'green',rgb:{r:60,g:220,b:120}}},
    {id:3,kind:'sound',name:'BUZZER1',pin:'P20',x:150,y:90,props:{soundType:'passive',volume:160}}
  ],
  code:'YAK LED1\nBEKLE 100\nSONDUR LED1\nYAK LED2\nSES BUZZER1, 60, 100',
  tabs:[{name:'ana',code:'YAK LED1\nBEKLE 100\nSONDUR LED1\nYAK LED2\nSES BUZZER1, 60, 100'}],
  activeTab:'ana'};
const json=JSON.stringify(project);
const payload={v:1,enc:'gzip',data:Buffer.from(zlib.gzipSync(Buffer.from(json,'utf8'))).toString('base64')};
const payEl=new El('script'); payEl.setAttribute('id','ledbasicPlayerData');
payEl.setAttribute('type','application/json'); payEl.textContent=JSON.stringify(payload);
body.appendChild(payEl);

// --- document / window ---
function allEls(){ const out=[]; const walk=n=>{n.children.forEach(c=>{out.push(c);walk(c);});}; walk(documentEl); return out; }
const document={
  documentElement:documentEl, body, head:new El('head'), title:'',
  getElementById(id){ return allEls().find(e=>e.id===id)||null; },
  querySelector(s){ return documentEl.querySelector(s); },
  querySelectorAll(s){ return documentEl.querySelectorAll(s); },
  createElement(t){ return new El(t); },
  createTextNode(t){ const e=new El('span'); e.textContent=t; return e; },
  _listeners:{},
  addEventListener(t,fn){ (document._listeners[t]=document._listeners[t]||[]).push(fn); },
  removeEventListener(t,fn){ const a=document._listeners[t]; if(a){const i=a.indexOf(fn); if(i>=0)a.splice(i,1);} },
  dispatchEvent(ev){ (document._listeners[ev.type]||[]).slice().forEach(fn=>fn(ev)); return true; },
  activeElement:null,
  get readyState(){ return 'complete'; }
};
const store={};
const rafQueue=[];
global.window=global;
const winL={};
global.addEventListener=(t,f)=>{(winL[t]=winL[t]||[]).push(f);};
global.removeEventListener=(t,f)=>{const a=winL[t];if(a){const i=a.indexOf(f);if(i>=0)a.splice(i,1);}};
global.dispatchEvent=ev=>{(winL[ev.type]||[]).slice().forEach(f=>f(ev));return true;};
global.document=document;
global.localStorage={getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k in store)delete store[k]}};
global.requestAnimationFrame=cb=>{rafQueue.push(cb);return rafQueue.length;};
global.cancelAnimationFrame=()=>{};
global.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
global.getComputedStyle=el=>({getPropertyValue:()=>'',fontSize:'13px',lineHeight:'20px',paddingLeft:'0px',paddingTop:'0px'});
global.innerWidth=1200; global.innerHeight=800;
global.devicePixelRatio=1;
global.alert=m=>console.log('   [alert]',m);
global.confirm=()=>true;
global.prompt=(m,d)=>d;
global.navigator={userAgent:'node',platform:'node'};
global.AudioContext=function(){ this.state='running'; this.currentTime=0;
  this.createOscillator=()=>({type:'',frequency:{value:0},connect(){},start(){},stop(){}});
  this.createGain=()=>({gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}},connect(){}});
  this.destination={}; this.resume=()=>{}; };
global.URL.createObjectURL=()=>'blob:mock'; global.URL.revokeObjectURL=()=>{};

// canvas stub (grafik LCD için)
const origCreate=document.createElement;
document.createElement=function(t){ const e=origCreate.call(document,t);
  if(String(t).toLowerCase()==='canvas'){
    e.width=128; e.height=64;
    e.getContext=()=>({ createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),
      putImageData(){}, getImageData:(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),
      fillRect(){}, clearRect(){}, beginPath(){}, stroke(){}, fill(){}, moveTo(){}, lineTo(){}, arc(){},
      measureText:()=>({width:8}), fillText(){}, save(){}, restore(){}, translate(){}, scale(){} });
  }
  return e; };

// --- Scriptleri sırayla yükle ---
const vm=require('vm');
const ctx=vm.createContext(global);
let stage='';
try{
  stage='motor'; vm.runInContext(scripts[0],ctx,{filename:'engine.js'});
  stage='editör'; vm.runInContext(scripts[1],ctx,{filename:'miniide.js'});
  stage='uygulama'; vm.runInContext(scripts[2],ctx,{filename:'app.js'});
  console.log('✓ üç script de hatasız yüklendi');
}catch(e){
  console.log('✗ '+stage+' yüklenirken HATA:');
  console.log('   '+e.message);
  if(e.stack) console.log(e.stack.split('\n').slice(1,4).map(l=>'   '+l.trim()).join('\n'));
  process.exit(1);
}

// rAF kuyruğunu boşalt (player açılışı ve animasyonlar buna bağlı)
(async()=>{
  for(let round=0; round<40; round++){
    const q=rafQueue.splice(0);
    q.forEach(cb=>{ try{ cb(performance.now()); }catch(e){ console.log('   [raf hata]',e.message); } });
    await new Promise(r=>setTimeout(r,12));
  }
  // --- SONUÇLARI ÖLÇ ---
  console.log('');
  console.log('=== PLAYER MODU SONUÇLARI ===');
  let ok=0,bad=0; const chk=(l,c,extra)=>{c?ok++:bad++;console.log((c?'✓':'✗')+'  '+l+(extra?'  ('+extra+')':''));};

  chk('body.player-mode sınıfı eklendi', body.classList.contains('player-mode'));
  const title=document.getElementById('pbTitle'), author=document.getElementById('pbAuthor');
  chk('proje adı şeride yazıldı', title && title.textContent==='Trafik Lambası', title&&title.textContent);
  chk('yapan adı şeride yazıldı', author && author.textContent.includes('Üstad Çağrı'), author&&author.textContent);
  // Bileşenler koddan oluşturulan bir katmana eklenir; belgenin tamamında ara
  const comps=documentEl.querySelectorAll('.component');
  chk('bileşenler sahneye kuruldu', comps.length===3, comps.length+' bileşen');
  chk('LED bileşeni var', documentEl.querySelectorAll('.comp-led').length>0);
  chk('ses bileşeni var', documentEl.querySelectorAll('.comp-sound').length>0);
  const status=document.getElementById('statusPill');
  chk('durum göstergesi güncellendi', status && status.textContent!=='Hazır', status&&status.textContent);
  const cons=document.getElementById('consoleEl');
  const ctext=cons?cons.textContent:'';
  chk('konsolda hata/uyarı yok', !/hata|uyar|error|warn/i.test(ctext), ctext.slice(0,70)||'boş');
  // Bileşen isimleri doğru mu
  const names=[...comps].map(c=>{const l=c.querySelector('.label'); return l?l.textContent.split(' ')[0]:'?';});
  chk('bileşen etiketleri yazıldı', names.join(',')==='LED1,LED2,BUZZER1', names.join(','));

  // Program bileşenleri GERÇEKTEN etkiledi mi?
  // Kod: YAK LED1 / BEKLE / SONDUR LED1 / YAK LED2 -> sonunda LED2 yanık, LED1 sönük
  const leds=[...documentEl.querySelectorAll('.comp-led')];
  const led1=leds.find(e=>(e.querySelector('.label')||{textContent:''}).textContent.startsWith('LED1'));
  const led2=leds.find(e=>(e.querySelector('.label')||{textContent:''}).textContent.startsWith('LED2'));
  chk('LED1 sonunda SÖNÜK (SONDUR uygulandı)', led1 && !led1.classList.contains('on'));
  chk('LED2 sonunda YANIK (YAK uygulandı)', led2 && led2.classList.contains('on'));

  // Player'da editör/araç çubuğu DOM'da duruyor ama CSS ile saklı;
  // saklamayı tetikleyen sınıfın gövdede olduğunu yukarıda doğruladık.
  chk('breadboard sahnede', !!document.getElementById('breadboard'));
  chk('otomatik kayıt yapılmadı (izleyici korundu)', !Object.keys(store).some(k=>k.startsWith('ledbasic.autosave')), Object.keys(store).join(',')||'boş');

  console.log('');
  console.log('GEÇEN: '+ok+'   KALAN: '+bad);
})();
