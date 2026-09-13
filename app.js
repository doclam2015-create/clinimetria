let activeTab = "todos";
let query = "";

const CALCS = [...CALCS_BASE, ...CALCS2];
const CAT_NAME = Object.fromEntries(CATS_CLIN.map(c=>[c.id,c.nombre]));

function buildTabs(){
  const tabs = document.getElementById("tabs");
  const all = [{id:"todos", nombre:"Todos"}, ...CATS_CLIN, {id:"refs", nombre:"Valores normales"}, {id:"algos", nombre:"Algoritmos"}];
  tabs.innerHTML = all.map(t=>`<div class="tab ${activeTab===t.id?'on':''}" data-id="${t.id}">${t.nombre}</div>`).join("");
  tabs.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{ activeTab=t.dataset.id; render(); });
}

function calcCard(c){
  return `<div class="card" data-type="calc" data-id="${c.id}">
    <span class="catlabel">${CAT_NAME[c.categoria]}</span>
    <b>${c.nombre}</b><p>${c.resumen}</p>
  </div>`;
}
function algoCard(a){
  return `<div class="card" data-type="algo" data-id="${a.id}">
    <span class="catlabel">${a.categoria}</span>
    <b>${a.nombre}</b><p>${a.pasos.length} pasos</p>
  </div>`;
}

function renderRefs(list){
  const groups = {};
  list.forEach(r=>{ (groups[r.grupo]=groups[r.grupo]||[]).push(r); });
  return Object.entries(groups).map(([g,items])=>`
    <div class="section-title">${g}</div>
    <div class="refgroup"><table class="reftable">${items.map(r=>`<tr><td>${r.nombre}</td><td>${r.valor}</td><td>${r.unidad}</td></tr>`).join("")}</table></div>
  `).join("");
}

function matchesText(hay, q){ return hay.toLowerCase().includes(q); }

function render(){
  buildTabs();
  const content = document.getElementById("content");
  const empty = document.getElementById("empty");
  const q = query.trim().toLowerCase();

  if (q){
    const calcs = CALCS.filter(c=>matchesText(c.nombre+" "+c.resumen+" "+CAT_NAME[c.categoria], q));
    const refs = REFS.filter(r=>matchesText(r.nombre+" "+r.grupo, q));
    const algos = ALGOS.filter(a=>matchesText(a.nombre+" "+a.categoria, q));
    empty.style.display = (calcs.length+refs.length+algos.length)===0 ? "block":"none";
    let html = "";
    if (calcs.length) html += `<div class="section-title">Calculadoras</div>` + calcs.map(calcCard).join("");
    if (algos.length) html += `<div class="section-title">Algoritmos</div>` + algos.map(algoCard).join("");
    if (refs.length) html += renderRefs(refs);
    content.innerHTML = html;
  } else if (activeTab==="refs"){
    empty.style.display = "none";
    content.innerHTML = renderRefs(REFS);
  } else if (activeTab==="algos"){
    empty.style.display = "none";
    content.innerHTML = ALGOS.map(algoCard).join("");
  } else if (activeTab==="todos"){
    empty.style.display = "none";
    content.innerHTML = CATS_CLIN.map(cat=>{
      const items = CALCS.filter(c=>c.categoria===cat.id);
      if (!items.length) return "";
      return `<div class="section-title">${cat.nombre}</div>` + items.map(calcCard).join("");
    }).join("");
  } else {
    const items = CALCS.filter(c=>c.categoria===activeTab);
    empty.style.display = items.length ? "none":"block";
    content.innerHTML = items.map(calcCard).join("");
  }

  content.querySelectorAll(".card[data-type='calc']").forEach(el=>el.onclick=()=>openCalc(el.dataset.id));
  content.querySelectorAll(".card[data-type='algo']").forEach(el=>el.onclick=()=>openAlgo(el.dataset.id));
}

// ---- Calculator sheet ----
let currentVals = {};
function openCalc(id){
  const c = CALCS.find(x=>x.id===id);
  currentVals = {};
  c.campos.forEach(f=>{ currentVals[f.id] = f.default!==undefined ? String(f.default) : (f.opciones?f.opciones[0].value:""); });

  const fieldsHtml = c.campos.map(f=>{
    if (f.tipo==="num"){
      return `<div class="field"><label>${f.label}${f.unidad?` (${f.unidad})`:""}</label>
        <input type="number" inputmode="decimal" step="${f.step||1}" ${f.min!==undefined?`min="${f.min}"`:""} ${f.max!==undefined?`max="${f.max}"`:""} value="${f.default}" data-field="${f.id}"></div>`;
    }
    if (f.tipo==="date"){
      return `<div class="field"><label>${f.label}</label>
        <input type="date" value="${f.default}" data-field="${f.id}"></div>`;
    }
    if (f.tipo==="bool"){
      return `<div class="field"><label>${f.label}</label><div class="boolrow" data-field="${f.id}">
        ${f.opciones.map((o,i)=>`<button type="button" data-value="${o.value}" class="${i===f.opciones.length-1?'sel':''}">${o.label}</button>`).join("")}
      </div></div>`;
    }
    // select
    return `<div class="field"><label>${f.label}</label><select data-field="${f.id}">
      ${f.opciones.map(o=>`<option value="${o.value}">${o.label}</option>`).join("")}
    </select></div>`;
  }).join("");

  document.getElementById("sheet-content").innerHTML = `
    <div class="sh-title">${c.nombre}</div>
    <div class="sh-sub">${c.resumen}</div>
    ${fieldsHtml}
    <div id="result"></div>
    <div class="sh-ref">${c.referencia}</div>
    <button class="sh-close" onclick="closeSheet()">Cerrar</button>
  `;

  const sheet = document.getElementById("sheet-content");
  sheet.querySelectorAll("input[data-field]").forEach(inp=>{
    inp.addEventListener("input", ()=>{ currentVals[inp.dataset.field]=inp.value; updateCalc(c); });
  });
  sheet.querySelectorAll("select[data-field]").forEach(sel=>{
    sel.addEventListener("change", ()=>{ currentVals[sel.dataset.field]=sel.value; updateCalc(c); });
  });
  sheet.querySelectorAll(".boolrow[data-field]").forEach(row=>{
    const fieldId = row.dataset.field;
    row.querySelectorAll("button").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        row.querySelectorAll("button").forEach(b=>b.classList.remove("sel"));
        btn.classList.add("sel");
        currentVals[fieldId]=btn.dataset.value;
        updateCalc(c);
      });
    });
    // default selection = last option already marked 'sel' above matches default "No" pattern; sync currentVals
    const selBtn = row.querySelector("button.sel");
    if (selBtn) currentVals[fieldId] = selBtn.dataset.value;
  });

  updateCalc(c);
  document.getElementById("sheet-bg").classList.add("show");
  document.getElementById("sheet").classList.add("show");
}

function updateCalc(c){
  const vals = {};
  c.campos.forEach(f=>{ vals[f.id] = f.tipo==="num" ? parseFloat(currentVals[f.id]) : currentVals[f.id]; });
  if (c.campos.some(f=>f.tipo==="date" && !vals[f.id])){
    document.getElementById("result").innerHTML = `<span style="color:var(--muted)">Selecciona una fecha.</span>`;
    return;
  }
  if (c.campos.some(f=>f.tipo==="num" && isNaN(vals[f.id]))){
    document.getElementById("result").innerHTML = `<span style="color:var(--muted)">Completa todos los campos numéricos.</span>`;
    return;
  }
  const r = c.calcular(vals);
  const i = c.interpretar(r.valor, vals);
  document.getElementById("result").className = `bar bar-${i.severidad}`;
  document.getElementById("result").innerHTML = `
    <span class="rv">${r.valor}</span><span class="ru">${r.unidad||""}</span>
    <div class="rt sev-${i.severidad}">${i.texto}</div>
    ${r.detalle?`<div class="rd">${r.detalle}</div>`:""}
  `;
}

function openAlgo(id){
  const a = ALGOS.find(x=>x.id===id);
  document.getElementById("sheet-content").innerHTML = `
    <div class="sh-title">${a.nombre}</div>
    <div class="sh-sub">${a.categoria}</div>
    <ol class="algo-steps">${a.pasos.map(p=>`<li>${p}</li>`).join("")}</ol>
    <div class="sh-ref">${a.nota}</div>
    <button class="sh-close" onclick="closeSheet()">Cerrar</button>
  `;
  document.getElementById("sheet-bg").classList.add("show");
  document.getElementById("sheet").classList.add("show");
}

function closeSheet(){
  document.getElementById("sheet-bg").classList.remove("show");
  document.getElementById("sheet").classList.remove("show");
}

document.getElementById("search").addEventListener("input", e=>{ query = e.target.value; render(); });

render();
