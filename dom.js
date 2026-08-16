/* Minimal ama uygulamayı ayağa kaldırmaya yetecek DOM taklidi. */
let idSeq = 0;

class ClassList {
  constructor(el){ this.el=el; this.s=new Set(); }
  add(...c){ c.forEach(x=>x&&this.s.add(x)); }
  remove(...c){ c.forEach(x=>this.s.delete(x)); }
  toggle(c,on){ if(on===undefined) on=!this.s.has(c); on?this.s.add(c):this.s.delete(c); return on; }
  contains(c){ return this.s.has(c); }
  get value(){ return [...this.s].join(' '); }
  forEach(f){ this.s.forEach(f); }
}

class Style {
  constructor(){ this._p={}; }
  setProperty(k,v){ this._p[k]=v; }
  getPropertyValue(k){ return this._p[k]||''; }
  removeProperty(k){ delete this._p[k]; }
}
// style.foo = 'x' desteklemek için Proxy
function makeStyle(){ return new Proxy(new Style(), {
  set(t,k,v){ if(k in t) t[k]=v; else t._p[k]=v; return true; },
  get(t,k){ if(k in t) return t[k]; return t._p[k]!==undefined?t._p[k]:''; }
});}

class El {
  constructor(tag){
    this.tagName=(tag||'div').toUpperCase();
    this.children=[]; this.parentNode=null;
    this._cl=new ClassList(this); this.style=makeStyle();
    this.dataset={}; this._listeners={};
    this._text=''; this._attrs={};
    this.value=''; this.checked=false; this.files=null;
    this.offsetWidth=60; this.offsetHeight=40;
    this.scrollTop=0; this.scrollLeft=0; this.scrollHeight=100; this.clientHeight=100;
    this.selectionStart=0; this.selectionEnd=0;
    this._uid=++idSeq;
  }
  get classList(){ return this._cl; }
  set className(v){ this._cl.s=new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className(){ return this._cl.value; }
  setAttribute(k,v){
    this._attrs[k]=String(v);
    if(k==='class') this.className=v;
    else if(k==='id') this.id=v;
    else if(k.startsWith('data-')){
      const camel=k.slice(5).replace(/-([a-z])/g,(m,p)=>p.toUpperCase());
      this.dataset[camel]=String(v);
    }
  }
  getAttribute(k){
    if(k==='class') return this.className;
    if(k==='id') return this.id||null;
    return this._attrs[k]!==undefined?this._attrs[k]:null;
  }
  removeAttribute(k){ delete this._attrs[k]; }
  hasAttribute(k){ return this.getAttribute(k)!==null; }
  get textContent(){
    if(this.children.length===0) return this._text;
    return this.children.map(c=>c.textContent).join('');
  }
  set textContent(v){ this._text=String(v); this.children=[]; }
  set innerHTML(html){ this.children=[]; this._text=''; parseInto(this,String(html)); }
  get innerHTML(){ return serialize(this); }
  get outerHTML(){ return '<'+this.tagName.toLowerCase()+'>'+serialize(this)+'</'+this.tagName.toLowerCase()+'>'; }
  appendChild(c){ if(c.parentNode) c.parentNode.removeChild(c); c.parentNode=this; this.children.push(c); return c; }
  insertBefore(c,ref){ if(c.parentNode)c.parentNode.removeChild(c); c.parentNode=this;
    const i=ref?this.children.indexOf(ref):-1; if(i<0)this.children.push(c); else this.children.splice(i,0,c); return c; }
  removeChild(c){ const i=this.children.indexOf(c); if(i>=0){this.children.splice(i,1); c.parentNode=null;} return c; }
  replaceChild(nw,old){ const i=this.children.indexOf(old); if(i>=0){this.children[i]=nw; nw.parentNode=this; old.parentNode=null;} return old; }
  remove(){ if(this.parentNode) this.parentNode.removeChild(this); }
  get firstChild(){ return this.children[0]||null; }
  get lastChild(){ return this.children[this.children.length-1]||null; }
  matches(sel){ return matchSel(this,sel); }
  closest(sel){ let n=this; while(n){ if(n.matches&&n.matches(sel)) return n; n=n.parentNode; } return null; }
  querySelector(sel){ const r=this.querySelectorAll(sel); return r[0]||null; }
  querySelectorAll(sel){
    const parts=String(sel).split(',').map(s=>s.trim()).filter(Boolean);
    const out=[];
    const walk=(n)=>{ n.children.forEach(c=>{ if(parts.some(p=>matchSel(c,p))) out.push(c); walk(c); }); };
    walk(this);
    return mkList(out);
  }
  addEventListener(t,f){ (this._listeners[t]=this._listeners[t]||[]).push(f); }
  removeEventListener(t,f){ const a=this._listeners[t]; if(a){const i=a.indexOf(f); if(i>=0)a.splice(i,1);} }
  dispatchEvent(ev){ (this._listeners[ev.type]||[]).slice().forEach(f=>f(ev)); return true; }
  fire(type,extra){ const ev=Object.assign({type,target:this,preventDefault(){},stopPropagation(){},
    clientX:0,clientY:0,pointerId:1,key:''},extra||{});
    let n=this; while(n){ (n._listeners[type]||[]).slice().forEach(f=>f.call(n,ev)); n=n.parentNode; }
    // Gerçek tarayıcıda olay document'a kadar baloncuklanır; birçok kod
    // pointermove/pointerup'ı document üzerinde dinler.
    if(typeof document!=='undefined' && document._listeners && document._listeners[type])
      document._listeners[type].slice().forEach(f=>f(ev));
    return ev; }
  getBoundingClientRect(){ return {left:0,top:0,right:this.offsetWidth,bottom:this.offsetHeight,
    width:this.offsetWidth,height:this.offsetHeight,x:0,y:0}; }
  setPointerCapture(){} releasePointerCapture(){} focus(){} blur(){} click(){ this.fire('click'); }
  scrollIntoView(){} getClientRects(){ return [this.getBoundingClientRect()]; }
  contains(n){ let p=n; while(p){ if(p===this) return true; p=p.parentNode; } return false; }
}

function mkList(arr){ arr.forEach=Array.prototype.forEach.bind(arr); return arr; }

function matchSel(el,sel){
  sel=sel.trim();
  if(!sel) return false;
  // birleşik seçici: .a.b / div.a / #id / [attr]
  const m=sel.match(/^([a-zA-Z]+)?((?:[.#][\w-]+)*)((?:\[[^\]]+\])*)(?::not\(([^)]+)\))?$/);
  if(!m) return false;
  const [,tag,cls,attrs,notSel]=m;
  if(tag && el.tagName!==tag.toUpperCase()) return false;
  if(cls){ for(const t of cls.match(/[.#][\w-]+/g)||[]){
    if(t[0]==='.'&&!el.classList.contains(t.slice(1))) return false;
    if(t[0]==='#'&&el.id!==t.slice(1)) return false; } }
  if(attrs){ for(const a of attrs.match(/\[[^\]]+\]/g)||[]){
    const inner=a.slice(1,-1); const eq=inner.indexOf('=');
    if(eq<0){ if(!el.hasAttribute(inner)) return false; }
    else { const k=inner.slice(0,eq); const v=inner.slice(eq+1).replace(/^["']|["']$/g,'');
      if(el.getAttribute(k)!==v) return false; } } }
  if(notSel && matchSel(el,notSel)) return false;
  return true;
}

const VOID=new Set(['input','br','hr','img','meta','link','span-void']);
function parseInto(parent,html){
  const re=/<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s=>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)/g;
  let m, stack=[parent];
  while((m=re.exec(html))){
    const [,close,tag,attrStr,selfClose,text]=m;
    const top=stack[stack.length-1];
    if(text!==undefined){ if(text.trim()||text.includes(' ')) top._text+=text; continue; }
    if(close){ if(stack.length>1) stack.pop(); continue; }
    const el=new El(tag);
    for(const am of (attrStr||'').matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)){
      const k=am[1]; if(!k) continue;
      const v=am[2]!==undefined?am[2]:(am[3]!==undefined?am[3]:(am[4]!==undefined?am[4]:''));
      el.setAttribute(k,v);
    }
    top.appendChild(el);
    if(!selfClose && !VOID.has(tag.toLowerCase())) stack.push(el);
  }
}
function serialize(el){
  let s=el._text||'';
  el.children.forEach(c=>{ s+='<'+c.tagName.toLowerCase()+'>'+serialize(c)+'</'+c.tagName.toLowerCase()+'>'; });
  return s;
}

module.exports={El,mkList,matchSel};
