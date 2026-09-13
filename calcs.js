// Motor de calculadoras clínicas: fórmulas fisiológicas + escalas/scores.
// Esquema de cada calculadora:
// { id, nombre, categoria, resumen, campos:[{id,label,tipo:'num'|'select'|'bool',unidad,min,max,step,default,opciones:[{value,label,puntos}]}],
//   calcular(v) -> {valor, unidad, detalle?}, interpretar(valor,v) -> {texto, severidad, detalle?}, referencia }
// severidad: 'normal'|'leve'|'moderado'|'grave'|'critico'|'info'

const CATS_CLIN = [
  {id:"formulas", nombre:"Fórmulas y fisiología"},
  {id:"urgencias", nombre:"Urgencias y triage"},
  {id:"cardio", nombre:"Cardiología"},
  {id:"neuro", nombre:"Neurología"},
  {id:"respiratorio", nombre:"Respiratorio"},
  {id:"nefro", nombre:"Nefrología"},
  {id:"gastro", nombre:"Gastroenterología"},
  {id:"nutricion", nombre:"Endocrino y nutrición"},
  {id:"gineco", nombre:"Obstetricia"},
  {id:"pediatria", nombre:"Pediatría"},
  {id:"trauma", nombre:"Trauma"},
  {id:"infecto", nombre:"Infectología y sepsis"},
  {id:"hemato", nombre:"Anticoagulación y hemostasia"},
];

function band(valor, tramos){
  for (const t of tramos){
    if ((t.min===undefined || valor>=t.min) && (t.max===undefined || valor<t.max)) return t;
  }
  return tramos[tramos.length-1];
}
function sumaCampos(v){ return Object.values(v).reduce((a,b)=>a+(+b||0),0); }

const CALCS = [
// ---------- FÓRMULAS ----------
{
  id:"imc", nombre:"Índice de Masa Corporal (IMC)", categoria:"formulas",
  resumen:"Clasificación nutricional según OMS.",
  campos:[
    {id:"peso", label:"Peso", tipo:"num", unidad:"kg", min:1, step:0.1, default:70},
    {id:"talla", label:"Talla", tipo:"num", unidad:"cm", min:30, step:0.1, default:170},
  ],
  calcular(v){ const t=v.talla/100; return {valor:+(v.peso/(t*t)).toFixed(1), unidad:"kg/m²"}; },
  interpretar(x){
    const t = band(x,[
      {max:16, label:"Delgadez severa", severidad:"grave"},
      {max:17, label:"Delgadez moderada", severidad:"moderado"},
      {max:18.5, label:"Delgadez leve", severidad:"leve"},
      {max:25, label:"Normopeso", severidad:"normal"},
      {max:30, label:"Sobrepeso", severidad:"leve"},
      {max:35, label:"Obesidad grado I", severidad:"moderado"},
      {max:40, label:"Obesidad grado II", severidad:"grave"},
      {label:"Obesidad grado III (mórbida)", severidad:"critico"},
    ]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"OMS, clasificación internacional de adultos por IMC."
},
{
  id:"sc", nombre:"Superficie Corporal (Mosteller)", categoria:"formulas",
  resumen:"Usada para dosificación de fármacos y quimioterapia.",
  campos:[
    {id:"peso", label:"Peso", tipo:"num", unidad:"kg", min:1, step:0.1, default:70},
    {id:"talla", label:"Talla", tipo:"num", unidad:"cm", min:30, step:0.1, default:170},
  ],
  calcular(v){ return {valor:+Math.sqrt((v.peso*v.talla)/3600).toFixed(2), unidad:"m²"}; },
  interpretar(x){ return {texto:"Superficie corporal estimada", severidad:"info"}; },
  referencia:"Mosteller RD. NEJM 1987."
},
{
  id:"cg", nombre:"Cockcroft-Gault (Clearance de creatinina)", categoria:"nefro",
  resumen:"Estima el clearance de creatinina para ajuste de fármacos.",
  campos:[
    {id:"edad", label:"Edad", tipo:"num", unidad:"años", min:1, max:120, default:60},
    {id:"peso", label:"Peso", tipo:"num", unidad:"kg", min:1, step:0.1, default:70},
    {id:"cr", label:"Creatinina sérica", tipo:"num", unidad:"mg/dL", min:0.1, step:0.01, default:1.0},
    {id:"sexo", label:"Sexo", tipo:"select", opciones:[{value:"1",label:"Masculino"},{value:"0.85",label:"Femenino"}]},
  ],
  calcular(v){ const val = ((140-v.edad)*v.peso*v.sexo)/(72*v.cr); return {valor:+val.toFixed(1), unidad:"mL/min"}; },
  interpretar(x){
    const t = band(x,[
      {max:15, label:"Falla renal (G5)", severidad:"critico"},
      {max:30, label:"Falla renal grave (G4)", severidad:"grave"},
      {max:60, label:"Falla renal moderada (G3)", severidad:"moderado"},
      {max:90, label:"Falla renal leve (G2)", severidad:"leve"},
      {label:"Función renal normal (G1)", severidad:"normal"},
    ]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Cockcroft DW, Gault MH. Nephron 1976."
},
{
  id:"ckdepi", nombre:"CKD-EPI 2021 (eGFR sin raza)", categoria:"nefro",
  resumen:"Tasa de filtración glomerular estimada.",
  campos:[
    {id:"edad", label:"Edad", tipo:"num", unidad:"años", min:1, max:120, default:60},
    {id:"cr", label:"Creatinina sérica", tipo:"num", unidad:"mg/dL", min:0.1, step:0.01, default:1.0},
    {id:"sexo", label:"Sexo", tipo:"select", opciones:[{value:"F",label:"Femenino"},{value:"M",label:"Masculino"}]},
  ],
  calcular(v){
    const isF = v.sexo==="F";
    const k = isF?0.7:0.9, a = isF?-0.241:-0.302;
    const minCr = Math.min(v.cr/k,1), maxCr = Math.max(v.cr/k,1);
    let egfr = 142*Math.pow(minCr,a)*Math.pow(maxCr,-1.200)*Math.pow(0.9938,v.edad);
    if (isF) egfr *= 1.012;
    return {valor:+egfr.toFixed(1), unidad:"mL/min/1.73m²"};
  },
  interpretar(x){
    const t = band(x,[
      {max:15, label:"ERC G5 (falla renal)", severidad:"critico"},
      {max:30, label:"ERC G4 (grave)", severidad:"grave"},
      {max:45, label:"ERC G3b (moderada-grave)", severidad:"moderado"},
      {max:60, label:"ERC G3a (moderada)", severidad:"moderado"},
      {max:90, label:"ERC G2 (leve)", severidad:"leve"},
      {label:"Función renal normal (G1)", severidad:"normal"},
    ]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Inker LA, et al. NEJM 2021 (CKD-EPI 2021, sin coeficiente racial)."
},
{
  id:"anion", nombre:"Anion Gap (corregido por albúmina)", categoria:"nefro",
  resumen:"Detecta acidosis metabólica con gap aumentado.",
  campos:[
    {id:"na", label:"Sodio", tipo:"num", unidad:"mEq/L", min:1, default:140},
    {id:"cl", label:"Cloro", tipo:"num", unidad:"mEq/L", min:1, default:104},
    {id:"hco3", label:"Bicarbonato", tipo:"num", unidad:"mEq/L", min:1, default:24},
    {id:"alb", label:"Albúmina", tipo:"num", unidad:"g/dL", min:0, step:0.1, default:4.0},
  ],
  calcular(v){
    const ag = v.na - (v.cl+v.hco3);
    const corr = ag + 2.5*(4-v.alb);
    return {valor:+corr.toFixed(1), unidad:"mEq/L", detalle:`AG sin corregir: ${ag.toFixed(1)} mEq/L`};
  },
  interpretar(x){
    if (x>16) return {texto:"Anion gap elevado — sospechar acidosis metabólica con gap aumentado (cetoacidosis, uremia, acidosis láctica, tóxicos)", severidad:"grave"};
    if (x<8) return {texto:"Anion gap bajo (raro: hipoalbuminemia, intoxicación por litio, mieloma)", severidad:"leve"};
    return {texto:"Anion gap normal", severidad:"normal"};
  },
  referencia:"Corrección de Figge: AG + 2.5 × (4 − albúmina g/dL)."
},
{
  id:"osmol", nombre:"Osmolaridad plasmática calculada", categoria:"nefro",
  resumen:"Compárela con la osmolaridad medida para calcular el gap osmolar (tóxicos: metanol, etilenglicol).",
  campos:[
    {id:"na", label:"Sodio", tipo:"num", unidad:"mEq/L", min:1, default:140},
    {id:"glu", label:"Glucosa", tipo:"num", unidad:"mg/dL", min:1, default:90},
    {id:"bun", label:"Nitrógeno ureico (BUN)", tipo:"num", unidad:"mg/dL", min:0, default:14},
  ],
  calcular(v){ const o = 2*v.na + v.glu/18 + v.bun/2.8; return {valor:+o.toFixed(1), unidad:"mOsm/L"}; },
  interpretar(x){
    const t = band(x,[{max:275,label:"Baja",severidad:"leve"},{max:295,label:"Normal",severidad:"normal"},{label:"Elevada",severidad:"moderado"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Osm = 2×Na + Glucosa/18 + BUN/2.8. Gap osmolar normal < 10 mOsm/L."
},
{
  id:"nacorr", nombre:"Sodio corregido por hiperglucemia", categoria:"nefro",
  resumen:"Corrige la pseudohiponatremia dilucional por glucosa alta.",
  campos:[
    {id:"na", label:"Sodio medido", tipo:"num", unidad:"mEq/L", min:1, default:130},
    {id:"glu", label:"Glucosa", tipo:"num", unidad:"mg/dL", min:1, default:400},
  ],
  calcular(v){ const c = v.na + 1.6*((v.glu-100)/100); return {valor:+c.toFixed(1), unidad:"mEq/L"}; },
  interpretar(x){
    if (x<135) return {texto:"Hiponatremia real persistente tras corrección", severidad:"moderado"};
    if (x>145) return {texto:"Hipernatremia tras corrección", severidad:"moderado"};
    return {texto:"Sodio corregido normal", severidad:"normal"};
  },
  referencia:"Katz MA. NEJM 1973 — factor 1.6 por cada 100 mg/dL de glucosa sobre 100."
},
{
  id:"cacorr", nombre:"Calcio corregido por albúmina", categoria:"nefro",
  resumen:"Ajusta el calcio total cuando la albúmina está alterada.",
  campos:[
    {id:"ca", label:"Calcio sérico total", tipo:"num", unidad:"mg/dL", min:0, step:0.1, default:9.0},
    {id:"alb", label:"Albúmina", tipo:"num", unidad:"g/dL", min:0, step:0.1, default:4.0},
  ],
  calcular(v){ const c = v.ca + 0.8*(4-v.alb); return {valor:+c.toFixed(2), unidad:"mg/dL"}; },
  interpretar(x){
    const t = band(x,[{max:8.5,label:"Hipocalcemia",severidad:"moderado"},{max:10.5,label:"Normal",severidad:"normal"},{label:"Hipercalcemia",severidad:"moderado"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Ca corregido = Ca medido + 0.8 × (4 − albúmina g/dL)."
},
{
  id:"agua", nombre:"Déficit de agua libre", categoria:"nefro",
  resumen:"Estima el volumen de agua libre a reponer en hipernatremia.",
  campos:[
    {id:"peso", label:"Peso", tipo:"num", unidad:"kg", min:1, default:70},
    {id:"na", label:"Sodio actual", tipo:"num", unidad:"mEq/L", min:1, default:155},
    {id:"sexo", label:"Sexo", tipo:"select", opciones:[{value:"0.6",label:"Masculino"},{value:"0.5",label:"Femenino"}]},
    {id:"edadCat", label:"Edad", tipo:"select", opciones:[{value:"1",label:"Adulto"},{value:"0.85",label:"Adulto mayor (ajuste ACT)"}]},
  ],
  calcular(v){ const act = v.peso*v.sexo*v.edadCat; const d = act*((v.na/140)-1); return {valor:+d.toFixed(2), unidad:"L"}; },
  interpretar(x){ return {texto: x>0 ? `Reponer ~${x.toFixed(1)} L de agua libre, en 48–72 h (corregir Na ≤ 8–10 mEq/L/día)` : "Sin déficit calculado", severidad:"info"}; },
  referencia:"ACT × [(Na actual / 140) − 1]. Ajustar velocidad para evitar edema cerebral por corrección rápida."
},
{
  id:"holliday", nombre:"Requerimiento de líquidos (Holliday-Segar)", categoria:"pediatria",
  resumen:"Mantención basal de líquidos endovenosos en pediatría.",
  campos:[{id:"peso", label:"Peso", tipo:"num", unidad:"kg", min:0.5, step:0.1, default:20}],
  calcular(v){
    const p=v.peso; let ml;
    if (p<=10) ml = p*100;
    else if (p<=20) ml = 1000 + (p-10)*50;
    else ml = 1500 + (p-20)*20;
    return {valor:+ml.toFixed(0), unidad:"mL/día", detalle:`≈ ${(ml/24).toFixed(1)} mL/h`};
  },
  interpretar(x){ return {texto:"Requerimiento basal de mantención (regla 4-2-1 por hora equivalente)", severidad:"info"}; },
  referencia:"Holliday MA, Segar WE. Pediatrics 1957."
},
{
  id:"parkland", nombre:"Fórmula de Parkland (quemados)", categoria:"trauma",
  resumen:"Volumen de reanimación en las primeras 24 h en quemados.",
  campos:[
    {id:"peso", label:"Peso", tipo:"num", unidad:"kg", min:1, default:70},
    {id:"scq", label:"% Superficie corporal quemada (2°-3°)", tipo:"num", unidad:"%", min:1, max:100, default:20},
  ],
  calcular(v){
    const total = 4*v.peso*v.scq;
    return {valor:+total.toFixed(0), unidad:"mL/24h", detalle:`50% (${(total/2).toFixed(0)} mL) en las primeras 8 h desde la quemadura; 50% restante en las 16 h siguientes`};
  },
  interpretar(x){ return {texto:"Ringer lactato salvo indicación distinta; ajustar según diuresis (0.5–1 mL/kg/h)", severidad:"info"}; },
  referencia:"Fórmula de Parkland: 4 mL × kg × %SCQ."
},
{
  id:"qtc", nombre:"QT corregido (Bazett y Fridericia)", categoria:"cardio",
  resumen:"Evalúa riesgo de arritmias ventriculares por prolongación del QT.",
  campos:[
    {id:"qt", label:"Intervalo QT medido", tipo:"num", unidad:"ms", min:200, default:400},
    {id:"rr", label:"Intervalo RR (60/FC)", tipo:"num", unidad:"seg", min:0.3, step:0.01, default:0.8},
  ],
  calcular(v){
    const bazett = v.qt/Math.sqrt(v.rr);
    const fridericia = v.qt/Math.cbrt(v.rr);
    return {valor:+bazett.toFixed(0), unidad:"ms (Bazett)", detalle:`Fridericia: ${fridericia.toFixed(0)} ms`};
  },
  interpretar(x){
    const t = band(x,[{max:440,label:"QTc normal",severidad:"normal"},{max:460,label:"QTc límite",severidad:"leve"},{max:500,label:"QTc prolongado",severidad:"moderado"},{label:"QTc muy prolongado — riesgo alto de torsade de pointes",severidad:"critico"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Bazett QTc = QT/√RR. Fridericia QTc = QT/∛RR (más fiable con FC extrema)."
},
{
  id:"pafi", nombre:"Índice PaO₂/FiO₂ (Kirby)", categoria:"respiratorio",
  resumen:"Clasifica la severidad del SDRA (criterios de Berlín).",
  campos:[
    {id:"pao2", label:"PaO₂", tipo:"num", unidad:"mmHg", min:1, default:80},
    {id:"fio2", label:"FiO₂", tipo:"num", unidad:"fracción (0.21-1.0)", min:0.21, max:1, step:0.01, default:0.21},
  ],
  calcular(v){ return {valor:+(v.pao2/v.fio2).toFixed(0), unidad:"mmHg"}; },
  interpretar(x){
    const t = band(x,[{max:100,label:"SDRA grave",severidad:"critico"},{max:200,label:"SDRA moderado",severidad:"grave"},{max:300,label:"SDRA leve",severidad:"moderado"},{label:"Normal",severidad:"normal"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Definición de Berlín de SDRA, 2012 (requiere PEEP/CPAP ≥ 5 cmH₂O)."
},
{
  id:"aa", nombre:"Gradiente alvéolo-arterial de O₂", categoria:"respiratorio",
  resumen:"Diferencia entre el O₂ alveolar calculado y el arterial medido.",
  campos:[
    {id:"fio2", label:"FiO₂", tipo:"num", unidad:"fracción", min:0.21, max:1, step:0.01, default:0.21},
    {id:"paco2", label:"PaCO₂", tipo:"num", unidad:"mmHg", min:1, default:40},
    {id:"pao2", label:"PaO₂", tipo:"num", unidad:"mmHg", min:1, default:90},
    {id:"patm", label:"Presión atmosférica", tipo:"num", unidad:"mmHg", default:760},
  ],
  calcular(v){
    const pao2alv = v.fio2*(v.patm-47) - v.paco2/0.8;
    const grad = pao2alv - v.pao2;
    return {valor:+grad.toFixed(0), unidad:"mmHg"};
  },
  interpretar(x){ return {texto: x>15 ? "Gradiente elevado — sugiere shunt, alteración V/Q o difusión" : "Gradiente normal (valor esperado ≈ edad/4 + 4)", severidad: x>15?"moderado":"normal"}; },
  referencia:"PAO₂ = FiO₂×(Patm−47) − PaCO₂/0.8. Gradiente normal aumenta con la edad."
},
{
  id:"fena", nombre:"Fracción de excreción de sodio (FeNa)", categoria:"nefro",
  resumen:"Diferencia falla renal prerrenal (FeNa<1%) de necrosis tubular aguda (FeNa>2%).",
  campos:[
    {id:"nau", label:"Sodio urinario", tipo:"num", unidad:"mEq/L", min:0, default:20},
    {id:"crp", label:"Creatinina plasmática", tipo:"num", unidad:"mg/dL", min:0.01, step:0.01, default:1.5},
    {id:"nap", label:"Sodio plasmático", tipo:"num", unidad:"mEq/L", min:1, default:140},
    {id:"cru", label:"Creatinina urinaria", tipo:"num", unidad:"mg/dL", min:0.01, default:50},
  ],
  calcular(v){ const f = ((v.nau*v.crp)/(v.nap*v.cru))*100; return {valor:+f.toFixed(2), unidad:"%"}; },
  interpretar(x){
    if (x<1) return {texto:"Sugiere causa prerrenal (hipoperfusión)", severidad:"leve"};
    if (x>2) return {texto:"Sugiere necrosis tubular aguda (causa renal intrínseca)", severidad:"moderado"};
    return {texto:"Zona indeterminada", severidad:"info"};
  },
  referencia:"No válido si el paciente recibió diuréticos recientes (usar FeUrea)."
},
{
  id:"feurea", nombre:"Fracción de excreción de urea (FeUrea)", categoria:"nefro",
  resumen:"Alternativa a FeNa cuando el paciente usa diuréticos.",
  campos:[
    {id:"ureau", label:"Urea urinaria", tipo:"num", unidad:"mg/dL", min:0, default:600},
    {id:"crp", label:"Creatinina plasmática", tipo:"num", unidad:"mg/dL", min:0.01, step:0.01, default:1.5},
    {id:"ureap", label:"Urea plasmática", tipo:"num", unidad:"mg/dL", min:1, default:40},
    {id:"cru", label:"Creatinina urinaria", tipo:"num", unidad:"mg/dL", min:0.01, default:50},
  ],
  calcular(v){ const f = ((v.ureau*v.crp)/(v.ureap*v.cru))*100; return {valor:+f.toFixed(2), unidad:"%"}; },
  interpretar(x){
    if (x<35) return {texto:"Sugiere causa prerrenal", severidad:"leve"};
    return {texto:"Sugiere necrosis tubular aguda", severidad:"moderado"};
  },
  referencia:"Punto de corte 35%; útil bajo efecto diurético."
},
{
  id:"shockidx", nombre:"Índice de choque (Shock Index)", categoria:"urgencias",
  resumen:"FC/PAS; predictor precoz de inestabilidad hemodinámica.",
  campos:[
    {id:"fc", label:"Frecuencia cardíaca", tipo:"num", unidad:"lpm", min:1, default:80},
    {id:"pas", label:"Presión arterial sistólica", tipo:"num", unidad:"mmHg", min:1, default:120},
  ],
  calcular(v){ return {valor:+(v.fc/v.pas).toFixed(2), unidad:""}; },
  interpretar(x){
    const t = band(x,[{max:0.7,label:"Normal",severidad:"normal"},{max:1.0,label:"Límite alto — vigilar",severidad:"leve"},{label:"Elevado — sospechar shock/hemorragia oculta",severidad:"grave"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Valor normal 0.5–0.7. >1.0 se asocia a mayor mortalidad en trauma y sepsis."
},
{
  id:"map", nombre:"Presión Arterial Media (PAM)", categoria:"cardio",
  resumen:"Meta habitual ≥65 mmHg en shock séptico.",
  campos:[
    {id:"pas", label:"PA sistólica", tipo:"num", unidad:"mmHg", min:1, default:120},
    {id:"pad", label:"PA diastólica", tipo:"num", unidad:"mmHg", min:1, default:80},
  ],
  calcular(v){ return {valor:+((v.pas + 2*v.pad)/3).toFixed(0), unidad:"mmHg"}; },
  interpretar(x){ return {texto: x<65 ? "Bajo meta habitual de perfusión (≥65 mmHg)" : "Adecuada para perfusión de órganos", severidad: x<65?"grave":"normal"}; },
  referencia:"PAM = (PAS + 2×PAD) / 3."
},
{
  id:"winters", nombre:"Fórmula de Winter (compensación respiratoria)", categoria:"respiratorio",
  resumen:"PaCO₂ esperada en acidosis metabólica compensada.",
  campos:[{id:"hco3", label:"Bicarbonato sérico", tipo:"num", unidad:"mEq/L", min:1, default:12}],
  calcular(v){ const esp = 1.5*v.hco3 + 8; return {valor:+esp.toFixed(1), unidad:"mmHg", detalle:`Rango esperado: ${(esp-2).toFixed(0)}–${(esp+2).toFixed(0)} mmHg`}; },
  interpretar(x){ return {texto:"Compare con la PaCO₂ medida: si es mayor, hay acidosis respiratoria sobreagregada; si es menor, alcalosis respiratoria sobreagregada", severidad:"info"}; },
  referencia:"PaCO₂ esperada = 1.5×HCO₃⁻ + 8 (± 2)."
},
{
  id:"mifflin", nombre:"Gasto energético basal (Mifflin-St Jeor)", categoria:"nutricion",
  resumen:"Estima el requerimiento calórico basal diario.",
  campos:[
    {id:"peso", label:"Peso", tipo:"num", unidad:"kg", min:1, default:70},
    {id:"talla", label:"Talla", tipo:"num", unidad:"cm", min:30, default:170},
    {id:"edad", label:"Edad", tipo:"num", unidad:"años", min:1, max:120, default:40},
    {id:"sexo", label:"Sexo", tipo:"select", opciones:[{value:"5",label:"Masculino"},{value:"-161",label:"Femenino"}]},
  ],
  calcular(v){ const geb = 10*v.peso + 6.25*v.talla - 5*v.edad + (+v.sexo); return {valor:+geb.toFixed(0), unidad:"kcal/día"}; },
  interpretar(x){ return {texto:"Multiplicar por factor de actividad/estrés (1.2–1.6) para el requerimiento total", severidad:"info"}; },
  referencia:"Mifflin MD, et al. Am J Clin Nutr 1990."
},

// ---------- SCORES ----------
{
  id:"gcs", nombre:"Escala de Coma de Glasgow (GCS)", categoria:"neuro",
  resumen:"Evalúa el nivel de conciencia (apertura ocular + respuesta verbal + motora).",
  campos:[
    {id:"ocular", label:"Apertura ocular", tipo:"select", opciones:[
      {value:"4",label:"Espontánea (4)"},{value:"3",label:"Al estímulo verbal (3)"},{value:"2",label:"Al dolor (2)"},{value:"1",label:"Ninguna (1)"}]},
    {id:"verbal", label:"Respuesta verbal", tipo:"select", opciones:[
      {value:"5",label:"Orientada (5)"},{value:"4",label:"Confusa (4)"},{value:"3",label:"Palabras inapropiadas (3)"},{value:"2",label:"Sonidos incomprensibles (2)"},{value:"1",label:"Ninguna (1)"}]},
    {id:"motora", label:"Respuesta motora", tipo:"select", opciones:[
      {value:"6",label:"Obedece órdenes (6)"},{value:"5",label:"Localiza el dolor (5)"},{value:"4",label:"Retira al dolor (4)"},{value:"3",label:"Flexión anormal — decorticación (3)"},{value:"2",label:"Extensión anormal — descerebración (2)"},{value:"1",label:"Ninguna (1)"}]},
  ],
  calcular(v){ return {valor: (+v.ocular)+(+v.verbal)+(+v.motora), unidad:"/15"}; },
  interpretar(x){
    const t = band(x,[{max:9,label:"TEC grave",severidad:"critico"},{max:13,label:"TEC moderado",severidad:"grave"},{max:15,label:"TEC leve",severidad:"leve"},{label:"Normal",severidad:"normal"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Teasdale G, Jennett B. Lancet 1974. GCS ≤8: considerar vía aérea avanzada."
},
{
  id:"news2", nombre:"NEWS2 (National Early Warning Score)", categoria:"urgencias",
  resumen:"Detecta deterioro clínico precoz en pacientes hospitalizados.",
  campos:[
    {id:"fr", label:"Frecuencia respiratoria", tipo:"select", opciones:[{value:"3",label:"≤8 rpm"},{value:"0",label:"9–11 rpm"},{value:"0",label:"12–20 rpm"},{value:"2",label:"21–24 rpm"},{value:"3",label:"≥25 rpm"}]},
    {id:"spo2", label:"Saturación de O₂", tipo:"select", opciones:[{value:"3",label:"≤91%"},{value:"2",label:"92–93%"},{value:"1",label:"94–95%"},{value:"0",label:"≥96%"}]},
    {id:"o2sup", label:"Oxígeno suplementario", tipo:"select", opciones:[{value:"0",label:"Aire ambiental"},{value:"2",label:"Requiere O₂ suplementario"}]},
    {id:"ta", label:"PA sistólica", tipo:"select", opciones:[{value:"3",label:"≤90 mmHg"},{value:"2",label:"91–100 mmHg"},{value:"1",label:"101–110 mmHg"},{value:"0",label:"111–219 mmHg"},{value:"3",label:"≥220 mmHg"}]},
    {id:"fc", label:"Frecuencia cardíaca", tipo:"select", opciones:[{value:"3",label:"≤40 lpm"},{value:"1",label:"41–50 lpm"},{value:"0",label:"51–90 lpm"},{value:"1",label:"91–110 lpm"},{value:"2",label:"111–130 lpm"},{value:"3",label:"≥131 lpm"}]},
    {id:"conciencia", label:"Nivel de conciencia", tipo:"select", opciones:[{value:"0",label:"Alerta"},{value:"3",label:"Confusión / no alerta (nueva)"}]},
    {id:"temp", label:"Temperatura", tipo:"select", opciones:[{value:"3",label:"≤35.0 °C"},{value:"1",label:"35.1–36.0 °C"},{value:"0",label:"36.1–38.0 °C"},{value:"1",label:"38.1–39.0 °C"},{value:"2",label:"≥39.1 °C"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"puntos"}; },
  interpretar(x){
    const t = band(x,[{max:5,label:"Riesgo bajo — monitorización de rutina",severidad:"normal"},{max:7,label:"Riesgo medio — revisión médica urgente",severidad:"moderado"},{label:"Riesgo alto — evaluación inmediata por equipo con competencias en cuidados críticos",severidad:"critico"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Royal College of Physicians, NEWS2, 2017. Nota: un solo parámetro con 3 puntos ya amerita revisión urgente."
},
{
  id:"qsofa", nombre:"qSOFA", categoria:"infecto",
  resumen:"Cribado rápido de riesgo en sospecha de sepsis fuera de UCI.",
  campos:[
    {id:"fr", label:"Frecuencia respiratoria ≥22 rpm", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"conciencia", label:"Alteración del estado de conciencia (Glasgow <15)", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"pas", label:"PA sistólica ≤100 mmHg", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/3"}; },
  interpretar(x){
    return x>=2
      ? {texto:"Alto riesgo de mala evolución — evaluar SOFA completo, lactato y bundle de sepsis", severidad:"critico"}
      : {texto:"Bajo riesgo por qSOFA (no descarta sepsis — usar criterio clínico)", severidad:"normal"};
  },
  referencia:"Singer M, et al. Sepsis-3, JAMA 2016."
},
{
  id:"sofa", nombre:"SOFA (Sequential Organ Failure Assessment)", categoria:"infecto",
  resumen:"Cuantifica disfunción orgánica en pacientes críticos/sépticos.",
  campos:[
    {id:"resp", label:"Respiratorio: PaO₂/FiO₂", tipo:"select", opciones:[{value:"0",label:"≥400"},{value:"1",label:"300–399"},{value:"2",label:"200–299"},{value:"3",label:"100–199 (con soporte ventilatorio)"},{value:"4",label:"<100 (con soporte ventilatorio)"}]},
    {id:"coag", label:"Coagulación: plaquetas (×10³/µL)", tipo:"select", opciones:[{value:"0",label:"≥150"},{value:"1",label:"100–149"},{value:"2",label:"50–99"},{value:"3",label:"20–49"},{value:"4",label:"<20"}]},
    {id:"higado", label:"Hígado: bilirrubina (mg/dL)", tipo:"select", opciones:[{value:"0",label:"<1.2"},{value:"1",label:"1.2–1.9"},{value:"2",label:"2.0–5.9"},{value:"3",label:"6.0–11.9"},{value:"4",label:"≥12.0"}]},
    {id:"cardio", label:"Cardiovascular", tipo:"select", opciones:[{value:"0",label:"PAM ≥70 mmHg sin vasopresores"},{value:"1",label:"PAM <70 mmHg sin vasopresores"},{value:"2",label:"Dopamina <5 o dobutamina (cualquier dosis)"},{value:"3",label:"Dopamina 5.1–15 o noradrenalina/adrenalina ≤0.1"},{value:"4",label:"Dopamina >15 o noradrenalina/adrenalina >0.1"}]},
    {id:"snc", label:"SNC: Glasgow", tipo:"select", opciones:[{value:"0",label:"15"},{value:"1",label:"13–14"},{value:"2",label:"10–12"},{value:"3",label:"6–9"},{value:"4",label:"<6"}]},
    {id:"renal", label:"Renal: creatinina (mg/dL) o diuresis", tipo:"select", opciones:[{value:"0",label:"<1.2"},{value:"1",label:"1.2–1.9"},{value:"2",label:"2.0–3.4"},{value:"3",label:"3.5–4.9 o diuresis <500 mL/día"},{value:"4",label:"≥5.0 o diuresis <200 mL/día"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/24"}; },
  interpretar(x){
    const t = band(x,[{max:2,label:"Disfunción orgánica mínima",severidad:"normal"},{max:6,label:"Disfunción orgánica leve-moderada",severidad:"moderado"},{max:11,label:"Disfunción orgánica grave",severidad:"grave"},{label:"Disfunción orgánica muy grave — mortalidad muy elevada",severidad:"critico"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Vincent JL, et al. Intensive Care Med 1996. Sepsis-3: aumento ≥2 puntos define disfunción orgánica sepsis-asociada."
},
{
  id:"curb65", nombre:"CURB-65 (neumonía adquirida en la comunidad)", categoria:"respiratorio",
  resumen:"Estratifica severidad y decide manejo ambulatorio vs. hospitalario.",
  campos:[
    {id:"c", label:"Confusión nueva", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"u", label:"Urea >7 mmol/L (BUN >19 mg/dL)", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"r", label:"Frecuencia respiratoria ≥30 rpm", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"b", label:"PA sistólica <90 o diastólica ≤60 mmHg", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"e", label:"Edad ≥65 años", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/5"}; },
  interpretar(x){
    const t = band(x,[{max:1,label:"Riesgo bajo — manejo ambulatorio",severidad:"normal"},{max:2,label:"Riesgo intermedio — considerar hospitalización breve",severidad:"moderado"},{max:3,label:"Riesgo alto — hospitalizar",severidad:"grave"},{label:"Riesgo muy alto — considerar UCI",severidad:"critico"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Lim WS, et al. Thorax 2003."
},
{
  id:"chadsvasc", nombre:"CHA₂DS₂-VASc", categoria:"cardio",
  resumen:"Riesgo de ACV/embolia en fibrilación auricular no valvular.",
  campos:[
    {id:"icc", label:"Insuficiencia cardíaca / disfunción VI", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"hta", label:"Hipertensión arterial", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"edad75", label:"Edad ≥75 años", tipo:"bool", opciones:[{value:"2",label:"Sí"},{value:"0",label:"No"}]},
    {id:"dm", label:"Diabetes mellitus", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"acv", label:"ACV/AIT/tromboembolismo previo", tipo:"bool", opciones:[{value:"2",label:"Sí"},{value:"0",label:"No"}]},
    {id:"vasc", label:"Enfermedad vascular (IAM, EAP, placa aórtica)", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"edad6574", label:"Edad 65–74 años", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"sexo", label:"Sexo femenino", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"puntos"}; },
  interpretar(x){
    const t = band(x,[{max:1,label:"Riesgo bajo — anticoagulación generalmente no indicada",severidad:"normal"},{max:2,label:"Riesgo moderado — considerar anticoagulación",severidad:"moderado"},{label:"Riesgo alto — anticoagulación oral recomendada",severidad:"grave"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Lip GYH, et al. Chest 2010. Guías ESC de fibrilación auricular."
},
{
  id:"hasbled", nombre:"HAS-BLED", categoria:"hemato",
  resumen:"Riesgo de sangrado mayor con anticoagulación oral.",
  campos:[
    {id:"h", label:"Hipertensión no controlada (PAS >160)", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"a", label:"Función renal o hepática anormal (1 pto c/u)", tipo:"select", opciones:[{value:"0",label:"Ninguna"},{value:"1",label:"Una"},{value:"2",label:"Ambas"}]},
    {id:"s", label:"ACV previo", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"b", label:"Sangrado previo o predisposición", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"l", label:"INR lábil (si usa warfarina)", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"e", label:"Edad >65 años", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"d", label:"Fármacos (antiagregantes/AINEs) o alcohol (1 pto c/u)", tipo:"select", opciones:[{value:"0",label:"Ninguno"},{value:"1",label:"Uno"},{value:"2",label:"Ambos"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"puntos"}; },
  interpretar(x){
    const t = band(x,[{max:2,label:"Riesgo de sangrado bajo",severidad:"normal"},{label:"Riesgo de sangrado alto — extremar precaución y controles frecuentes",severidad:"grave"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Pisters R, et al. Chest 2010. No debe usarse solo para negar anticoagulación."
},
{
  id:"wellstvp", nombre:"Wells (Trombosis Venosa Profunda)", categoria:"hemato",
  resumen:"Probabilidad clínica pretest de TVP.",
  campos:[
    {id:"cancer", label:"Cáncer activo", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"paralisis", label:"Parálisis/inmovilización de EEII", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"reposo", label:"Reposo en cama >3 días o cirugía mayor <12 semanas", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"dolor", label:"Dolor localizado en trayecto venoso profundo", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"edema", label:"Edema de toda la extremidad", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"pantorrilla", label:"Edema de pantorrilla >3 cm vs. contralateral", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"godet", label:"Edema con fóvea (pierna sintomática)", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"colateral", label:"Venas colaterales superficiales (no varicosas)", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"tvpprevia", label:"TVP previa documentada", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"altdx", label:"Diagnóstico alternativo tan/más probable", tipo:"bool", opciones:[{value:"-2",label:"Sí"},{value:"0",label:"No"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"puntos"}; },
  interpretar(x){
    const t = band(x,[{max:0,label:"Probabilidad baja — dímero D para descartar",severidad:"normal"},{max:2,label:"Probabilidad moderada",severidad:"moderado"},{label:"Probabilidad alta — considerar ecografía doppler directa",severidad:"grave"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Wells PS, et al. NEJM 2003."
},
{
  id:"wellstep", nombre:"Wells (Tromboembolismo Pulmonar)", categoria:"hemato",
  resumen:"Probabilidad clínica pretest de TEP.",
  campos:[
    {id:"tvpsigno", label:"Signos clínicos de TVP", tipo:"select", opciones:[{value:"3",label:"Sí"},{value:"0",label:"No"}]},
    {id:"altdx", label:"TEP es el diagnóstico más probable", tipo:"select", opciones:[{value:"3",label:"Sí"},{value:"0",label:"No"}]},
    {id:"fc", label:"Frecuencia cardíaca >100 lpm", tipo:"select", opciones:[{value:"1.5",label:"Sí"},{value:"0",label:"No"}]},
    {id:"inmov", label:"Inmovilización ≥3 días o cirugía en 4 semanas previas", tipo:"select", opciones:[{value:"1.5",label:"Sí"},{value:"0",label:"No"}]},
    {id:"tepprevio", label:"TVP/TEP previo", tipo:"select", opciones:[{value:"1.5",label:"Sí"},{value:"0",label:"No"}]},
    {id:"hemoptisis", label:"Hemoptisis", tipo:"select", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"cancer", label:"Cáncer activo (tratado en últimos 6 meses o paliativo)", tipo:"select", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"puntos"}; },
  interpretar(x){
    const t = band(x,[{max:1.9,label:"Probabilidad baja",severidad:"normal"},{max:6,label:"Probabilidad moderada",severidad:"moderado"},{label:"Probabilidad alta",severidad:"grave"}]);
    return {texto: t.label+" — (score de 2 niveles: ≤4 'TEP improbable', >4 'TEP probable')", severidad:t.severidad};
  },
  referencia:"Wells PS, et al. Ann Intern Med 2001; versión dicotómica Christopher study 2006."
},
{
  id:"perc", nombre:"Regla PERC (descarte de TEP)", categoria:"hemato",
  resumen:"Si TODOS los criterios son negativos y la sospecha clínica es baja, se puede descartar TEP sin dímero D.",
  campos:[
    {id:"edad", label:"Edad ≥50 años", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"fc", label:"FC ≥100 lpm", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"spo2", label:"SatO₂ <95%", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"hemoptisis", label:"Hemoptisis", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"estrogeno", label:"Uso de estrógenos", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"cirugia", label:"Cirugía/trauma reciente (≤4 semanas)", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"tepprevio", label:"TVP/TEP previo", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"edemaunilateral", label:"Edema unilateral de pierna", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/8"}; },
  interpretar(x){
    return x===0
      ? {texto:"PERC negativo — si la sospecha clínica pretest es baja, se puede descartar TEP sin más estudios", severidad:"normal"}
      : {texto:"PERC positivo — continuar algoritmo diagnóstico (dímero D / angioTAC)", severidad:"moderado"};
  },
  referencia:"Kline JA, et al. J Thromb Haemost 2004. Solo aplicable si la sospecha pretest ya es baja."
},
{
  id:"childpugh", nombre:"Child-Pugh", categoria:"gastro",
  resumen:"Pronóstico de cirrosis hepática.",
  campos:[
    {id:"bili", label:"Bilirrubina total", tipo:"select", opciones:[{value:"1",label:"<2 mg/dL"},{value:"2",label:"2–3 mg/dL"},{value:"3",label:">3 mg/dL"}]},
    {id:"alb", label:"Albúmina", tipo:"select", opciones:[{value:"1",label:">3.5 g/dL"},{value:"2",label:"2.8–3.5 g/dL"},{value:"3",label:"<2.8 g/dL"}]},
    {id:"inr", label:"INR", tipo:"select", opciones:[{value:"1",label:"<1.7"},{value:"2",label:"1.7–2.3"},{value:"3",label:">2.3"}]},
    {id:"ascitis", label:"Ascitis", tipo:"select", opciones:[{value:"1",label:"Ausente"},{value:"2",label:"Leve"},{value:"3",label:"Moderada-severa"}]},
    {id:"encefalopatia", label:"Encefalopatía hepática", tipo:"select", opciones:[{value:"1",label:"Ausente"},{value:"2",label:"Grado I-II"},{value:"3",label:"Grado III-IV"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/15"}; },
  interpretar(x){
    const t = band(x,[{max:6,label:"Clase A — buen pronóstico (supervivencia 1 año ~100%)",severidad:"normal"},{max:9,label:"Clase B — pronóstico intermedio (~80%)",severidad:"moderado"},{label:"Clase C — mal pronóstico (~45%), considerar trasplante",severidad:"grave"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Pugh RN, et al. Br J Surg 1973."
},
{
  id:"meld", nombre:"MELD-Na", categoria:"gastro",
  resumen:"Prioriza trasplante hepático y estima mortalidad a 90 días.",
  campos:[
    {id:"bili", label:"Bilirrubina total", tipo:"num", unidad:"mg/dL", min:0.1, step:0.1, default:1.5},
    {id:"inr", label:"INR", tipo:"num", unidad:"", min:0.1, step:0.01, default:1.2},
    {id:"cr", label:"Creatinina", tipo:"num", unidad:"mg/dL", min:0.1, step:0.01, default:1.0},
    {id:"na", label:"Sodio sérico", tipo:"num", unidad:"mEq/L", min:100, max:145, default:137},
  ],
  calcular(v){
    const bili = Math.max(v.bili,1), inr = Math.max(v.inr,1), cr = Math.min(Math.max(v.cr,1),4);
    let meld = 3.78*Math.log(bili) + 11.2*Math.log(inr) + 9.57*Math.log(cr) + 6.43;
    meld = Math.round(meld);
    const na = Math.min(Math.max(v.na,125),137);
    let meldNa = meld;
    if (meld>11) meldNa = meld + 1.32*(137-na) - (0.033*meld*(137-na));
    return {valor: Math.round(meldNa), unidad:"puntos", detalle:`MELD sin sodio: ${meld}`};
  },
  interpretar(x){
    const t = band(x,[{max:9,label:"Mortalidad a 90 días ~2%",severidad:"normal"},{max:19,label:"Mortalidad a 90 días ~6–20%",severidad:"leve"},{max:29,label:"Mortalidad a 90 días ~20–50%",severidad:"moderado"},{max:39,label:"Mortalidad a 90 días ~50–75%",severidad:"grave"},{label:"Mortalidad a 90 días >80%",severidad:"critico"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Kamath PS, et al. Hepatology 2001; UNOS MELD-Na 2016."
},
{
  id:"ranson", nombre:"Criterios de Ranson (ingreso, no biliar)", categoria:"gastro",
  resumen:"Severidad de pancreatitis aguda al ingreso.",
  campos:[
    {id:"edad", label:"Edad >55 años", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"leuco", label:"Leucocitos >16.000/µL", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"glu", label:"Glucosa >200 mg/dL", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"ldh", label:"LDH >350 UI/L", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"ast", label:"AST >250 UI/L", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/5 (ingreso)"}; },
  interpretar(x){
    const t = band(x,[{max:2,label:"Pancreatitis leve (mortalidad <5%)",severidad:"normal"},{max:4,label:"Pancreatitis moderada (mortalidad ~15%)",severidad:"moderado"},{label:"Pancreatitis grave (mortalidad >40%)",severidad:"grave"}]);
    return {texto:t.label+" — solo criterios de ingreso; faltan 6 criterios a las 48 h para el score completo", severidad:t.severidad};
  },
  referencia:"Ranson JH, et al. Surg Gynecol Obstet 1974."
},
{
  id:"blatchford", nombre:"Glasgow-Blatchford (HDA alta)", categoria:"gastro",
  resumen:"Predice necesidad de intervención en hemorragia digestiva alta.",
  campos:[
    {id:"bun", label:"Nitrógeno ureico (BUN)", tipo:"select", opciones:[{value:"0",label:"<18.2 mg/dL"},{value:"2",label:"18.2–22.3"},{value:"3",label:"22.4–28.0"},{value:"4",label:"28.1–70.0"},{value:"6",label:">70.0"}]},
    {id:"hbHombre", label:"Hemoglobina (hombres)", tipo:"select", opciones:[{value:"0",label:"≥13 g/dL / no aplica"},{value:"1",label:"12–12.9"},{value:"3",label:"10–11.9"},{value:"6",label:"<10"}]},
    {id:"pas", label:"PA sistólica", tipo:"select", opciones:[{value:"0",label:"≥110 mmHg"},{value:"1",label:"100–109"},{value:"2",label:"90–99"},{value:"3",label:"<90"}]},
    {id:"otros", label:"FC ≥100, melena, síncope, hepatopatía o ICC (1-2 pts c/u)", tipo:"select", opciones:[{value:"0",label:"Ninguno"},{value:"2",label:"1–2 presentes"},{value:"4",label:"3 o más presentes"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"puntos"}; },
  interpretar(x){
    return x===0
      ? {texto:"Riesgo muy bajo — puede manejarse ambulatoriamente", severidad:"normal"}
      : {texto:"Score >0 — considerar hospitalización y endoscopia", severidad: x>=6?"grave":"moderado"};
  },
  referencia:"Blatchford O, et al. Lancet 2000."
},
{
  id:"abcd2", nombre:"ABCD2 (riesgo tras AIT)", categoria:"neuro",
  resumen:"Riesgo de ACV en los siguientes 2–7 días tras un AIT.",
  campos:[
    {id:"edad", label:"Edad ≥60 años", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"pa", label:"PA ≥140/90 mmHg al evaluar", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"clinica", label:"Clínica", tipo:"select", opciones:[{value:"0",label:"Otros síntomas"},{value:"1",label:"Alteración del habla sin debilidad"},{value:"2",label:"Debilidad unilateral"}]},
    {id:"duracion", label:"Duración", tipo:"select", opciones:[{value:"0",label:"<10 min"},{value:"1",label:"10–59 min"},{value:"2",label:"≥60 min"}]},
    {id:"dm", label:"Diabetes mellitus", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/7"}; },
  interpretar(x){
    const t = band(x,[{max:3,label:"Riesgo bajo (~1% a 2 días)",severidad:"normal"},{max:5,label:"Riesgo moderado (~4% a 2 días)",severidad:"moderado"},{label:"Riesgo alto (~8% a 2 días) — hospitalizar y estudiar con urgencia",severidad:"grave"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Johnston SC, et al. Lancet 2007."
},
{
  id:"centor", nombre:"Centor/McIsaac (faringitis estreptocócica)", categoria:"infecto",
  resumen:"Probabilidad de faringoamigdalitis por Streptococcus del grupo A.",
  campos:[
    {id:"exudado", label:"Exudado o inflamación amigdalina", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"adenopatia", label:"Adenopatía cervical anterior dolorosa", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"fiebre", label:"Fiebre / historia de fiebre", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"tos", label:"Ausencia de tos", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"edad", label:"Edad", tipo:"select", opciones:[{value:"1",label:"3–14 años"},{value:"0",label:"15–44 años"},{value:"-1",label:"≥45 años"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"puntos (McIsaac)"}; },
  interpretar(x){
    const t = band(x,[{max:0,label:"Riesgo ~1–2,5% — no cultivo ni antibiótico",severidad:"normal"},{max:2,label:"Riesgo ~5–17% — cultivo/test rápido antes de antibiótico",severidad:"leve"},{max:3,label:"Riesgo ~28–35% — cultivo/test rápido",severidad:"moderado"},{label:"Riesgo ~51–53% — considerar tratamiento empírico o test rápido",severidad:"grave"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"McIsaac WJ, et al. CMAJ 1998."
},
{
  id:"apgar", nombre:"APGAR", categoria:"gineco",
  resumen:"Evaluación de la vitalidad del recién nacido al minuto y 5 minutos.",
  campos:[
    {id:"fc", label:"Frecuencia cardíaca", tipo:"select", opciones:[{value:"0",label:"Ausente (0)"},{value:"1",label:"<100 lpm (1)"},{value:"2",label:"≥100 lpm (2)"}]},
    {id:"resp", label:"Esfuerzo respiratorio", tipo:"select", opciones:[{value:"0",label:"Ausente (0)"},{value:"1",label:"Débil/irregular (1)"},{value:"2",label:"Llanto vigoroso (2)"}]},
    {id:"tono", label:"Tono muscular", tipo:"select", opciones:[{value:"0",label:"Flácido (0)"},{value:"1",label:"Flexión leve (1)"},{value:"2",label:"Movimiento activo (2)"}]},
    {id:"reflejo", label:"Irritabilidad refleja", tipo:"select", opciones:[{value:"0",label:"Sin respuesta (0)"},{value:"1",label:"Mueca (1)"},{value:"2",label:"Llanto/tos vigorosa (2)"}]},
    {id:"color", label:"Color", tipo:"select", opciones:[{value:"0",label:"Cianosis/palidez central (0)"},{value:"1",label:"Acrocianosis (1)"},{value:"2",label:"Rosado completo (2)"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/10"}; },
  interpretar(x){
    const t = band(x,[{max:3,label:"Depresión severa — reanimación inmediata",severidad:"critico"},{max:6,label:"Depresión moderada — estimulación y soporte",severidad:"grave"},{label:"Normal",severidad:"normal"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Apgar V. Curr Res Anesth Analg 1953. Evaluar a 1 y 5 minutos (y 10 min si persiste bajo)."
},
{
  id:"bishop", nombre:"Score de Bishop", categoria:"gineco",
  resumen:"Evalúa la maduración cervical antes de inducir el trabajo de parto.",
  campos:[
    {id:"dilatacion", label:"Dilatación", tipo:"select", opciones:[{value:"0",label:"0 cm"},{value:"1",label:"1–2 cm"},{value:"2",label:"3–4 cm"},{value:"3",label:"≥5 cm"}]},
    {id:"borramiento", label:"Borramiento", tipo:"select", opciones:[{value:"0",label:"0–30%"},{value:"1",label:"40–50%"},{value:"2",label:"60–70%"},{value:"3",label:"≥80%"}]},
    {id:"altura", label:"Altura de presentación (estación)", tipo:"select", opciones:[{value:"0",label:"-3"},{value:"1",label:"-2"},{value:"2",label:"-1/0"},{value:"3",label:"+1/+2"}]},
    {id:"consistencia", label:"Consistencia cervical", tipo:"select", opciones:[{value:"0",label:"Firme"},{value:"1",label:"Media"},{value:"2",label:"Blanda"}]},
    {id:"posicion", label:"Posición cervical", tipo:"select", opciones:[{value:"0",label:"Posterior"},{value:"1",label:"Media"},{value:"2",label:"Anterior"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/13"}; },
  interpretar(x){
    return x>=8
      ? {texto:"Cérvix favorable — alta probabilidad de parto vaginal exitoso tras inducción", severidad:"normal"}
      : {texto:"Cérvix desfavorable — considerar maduración cervical previa a inducción", severidad:"moderado"};
  },
  referencia:"Bishop EH. Obstet Gynecol 1964."
},
{
  id:"killip", nombre:"Clasificación de Killip-Kimball", categoria:"cardio",
  resumen:"Estratifica el riesgo en el infarto agudo de miocardio según signos de insuficiencia cardíaca.",
  campos:[
    {id:"clase", label:"Hallazgos clínicos", tipo:"select", opciones:[
      {value:"1",label:"I: Sin signos de insuficiencia cardíaca"},
      {value:"2",label:"II: Crépitos basales, S3, o congestión venosa"},
      {value:"3",label:"III: Edema pulmonar franco"},
      {value:"4",label:"IV: Shock cardiogénico"},
    ]},
  ],
  calcular(v){ return {valor:+v.clase, unidad:""}; },
  interpretar(x){
    const t = band(x,[{max:1,label:"Killip I — mortalidad ~6%",severidad:"normal"},{max:2,label:"Killip II — mortalidad ~17%",severidad:"moderado"},{max:3,label:"Killip III — mortalidad ~38%",severidad:"grave"},{label:"Killip IV — mortalidad ~67%",severidad:"critico"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Killip T, Kimball JT. Am J Cardiol 1967."
},
{
  id:"timi", nombre:"TIMI Risk Score (SCA sin elevación ST)", categoria:"cardio",
  resumen:"Riesgo de eventos isquémicos a 14 días en SCA sin elevación del ST.",
  campos:[
    {id:"edad", label:"Edad ≥65 años", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"factores", label:"≥3 factores de riesgo coronario", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"coronaria", label:"Estenosis coronaria ≥50% conocida", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"desnivel", label:"Desviación del segmento ST", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"angina", label:"≥2 episodios de angina en 24 h", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"aas", label:"Uso de AAS en los últimos 7 días", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"marcadores", label:"Marcadores cardíacos elevados", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/7"}; },
  interpretar(x){
    const t = band(x,[{max:2,label:"Riesgo bajo (~5-8% eventos a 14 días)",severidad:"normal"},{max:4,label:"Riesgo intermedio (~13-20%)",severidad:"moderado"},{label:"Riesgo alto (~26-41%) — estrategia invasiva precoz",severidad:"grave"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Antman EM, et al. JAMA 2000."
},
{
  id:"charlson", nombre:"Índice de Comorbilidad de Charlson", categoria:"urgencias",
  resumen:"Predice mortalidad a 10 años según comorbilidades.",
  campos:[
    {id:"edad", label:"Edad", tipo:"select", opciones:[{value:"0",label:"<50 años"},{value:"1",label:"50–59"},{value:"2",label:"60–69"},{value:"3",label:"70–79"},{value:"4",label:"≥80"}]},
    {id:"iam", label:"Infarto de miocardio", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"icc", label:"Insuficiencia cardíaca congestiva", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"vascular", label:"Enfermedad vascular periférica", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"cerebro", label:"Enfermedad cerebrovascular", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"epoc", label:"EPOC", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"dm", label:"Diabetes (sin daño de órgano) / con daño de órgano", tipo:"select", opciones:[{value:"0",label:"No"},{value:"1",label:"Sin daño de órgano"},{value:"2",label:"Con daño de órgano"}]},
    {id:"renal", label:"Enfermedad renal moderada-severa", tipo:"bool", opciones:[{value:"2",label:"Sí"},{value:"0",label:"No"}]},
    {id:"tumor", label:"Tumor sólido (localizado/metastásico)", tipo:"select", opciones:[{value:"0",label:"No"},{value:"2",label:"Localizado"},{value:"6",label:"Metastásico"}]},
    {id:"higado", label:"Hepatopatía (leve / moderada-severa)", tipo:"select", opciones:[{value:"0",label:"No"},{value:"1",label:"Leve"},{value:"3",label:"Moderada-severa"}]},
    {id:"vih", label:"SIDA", tipo:"bool", opciones:[{value:"6",label:"Sí"},{value:"0",label:"No"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"puntos"}; },
  interpretar(x){
    const t = band(x,[{max:1,label:"Mortalidad a 10 años ~muy baja",severidad:"normal"},{max:3,label:"Mortalidad a 10 años baja-moderada",severidad:"leve"},{max:5,label:"Mortalidad a 10 años moderada-alta",severidad:"moderado"},{label:"Mortalidad a 10 años muy alta",severidad:"grave"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Charlson ME, et al. J Chronic Dis 1987."
},
];

if (typeof module !== "undefined") module.exports = { CALCS, CATS_CLIN };
