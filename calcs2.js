// Extensión del catálogo de calculadoras: fórmulas y escalas adicionales.
// Usa el mismo motor y esquema definidos en calcs.js (band, sumaCampos).
function addDias(fechaISO, dias){
  const d = new Date(fechaISO+"T00:00:00");
  d.setDate(d.getDate()+dias);
  return d.toLocaleDateString("es-CL", {year:"numeric", month:"long", day:"numeric"});
}
const hoyISO = new Date().toISOString().slice(0,10);

const CALCS2 = [
// ---------- ANTROPOMETRÍA Y CONVERSIONES ----------
{
  id:"pci", nombre:"Peso corporal ideal (Devine)", categoria:"formulas",
  resumen:"Referencia para dosificación de fármacos por peso.",
  campos:[
    {id:"sexo", label:"Sexo", tipo:"select", opciones:[{value:"50",label:"Masculino"},{value:"45.5",label:"Femenino"}]},
    {id:"talla", label:"Talla", tipo:"num", unidad:"cm", min:100, default:170},
  ],
  calcular(v){
    const in_ = v.talla/2.54;
    const pci = (+v.sexo) + 2.3*Math.max(0, in_-60);
    return {valor:+pci.toFixed(1), unidad:"kg"};
  },
  interpretar(){ return {texto:"Peso corporal ideal — válido para tallas superiores a ~152 cm (5 pies)", severidad:"info"}; },
  referencia:"Devine BJ. Clin Pharmacol 1974."
},
{
  id:"tallahijo", nombre:"Talla diana por talla parental", categoria:"pediatria",
  resumen:"Estima el potencial de talla adulta del niño según la talla de los padres.",
  campos:[
    {id:"sexo", label:"Sexo del hijo/a", tipo:"select", opciones:[{value:"13",label:"Masculino"},{value:"-13",label:"Femenino"}]},
    {id:"madre", label:"Talla materna", tipo:"num", unidad:"cm", min:100, default:160},
    {id:"padre", label:"Talla paterna", tipo:"num", unidad:"cm", min:100, default:175},
  ],
  calcular(v){ const t = (v.madre+v.padre+(+v.sexo))/2; return {valor:+t.toFixed(1), unidad:"cm"}; },
  interpretar(){ return {texto:"Rango esperado ± 8.5 cm; evaluar con velocidad de crecimiento y curva poblacional", severidad:"info"}; },
  referencia:"Estimación auxológica clásica de talla diana (target height)."
},
{
  id:"cmin", nombre:"Centímetros a pulgadas", categoria:"formulas",
  resumen:"Conversión rápida de unidades de longitud.",
  campos:[{id:"cm", label:"Centímetros", tipo:"num", unidad:"cm", min:0, default:170}],
  calcular(v){ return {valor:+(v.cm/2.54).toFixed(2), unidad:"in"}; },
  interpretar(){ return {texto:"Conversión SI directa", severidad:"info"}; },
  referencia:"1 in = 2.54 cm."
},
{
  id:"lbkg", nombre:"Libras a kilogramos", categoria:"formulas",
  resumen:"Conversión rápida de unidades de peso.",
  campos:[{id:"lb", label:"Libras", tipo:"num", unidad:"lb", min:0, default:154}],
  calcular(v){ return {valor:+(v.lb*0.45359237).toFixed(2), unidad:"kg"}; },
  interpretar(){ return {texto:"Conversión SI directa", severidad:"info"}; },
  referencia:"1 lb = 0.45359237 kg."
},
{
  id:"cf", nombre:"Temperatura °C a °F", categoria:"formulas",
  resumen:"Conversión rápida de temperatura.",
  campos:[{id:"c", label:"Temperatura", tipo:"num", unidad:"°C", default:37}],
  calcular(v){ return {valor:+(v.c*9/5+32).toFixed(1), unidad:"°F"}; },
  interpretar(){ return {texto:"Conversión directa", severidad:"info"}; },
  referencia:"°F = °C × 9/5 + 32."
},
// ---------- NEFROLOGÍA ADICIONAL ----------
{
  id:"be", nombre:"Exceso de base (Van Slyke simplificada)", categoria:"nefro",
  resumen:"Complementa la lectura de gases arteriales.",
  campos:[
    {id:"ph", label:"pH arterial", tipo:"num", min:6.8, max:7.8, step:0.01, default:7.30},
    {id:"hco3", label:"Bicarbonato", tipo:"num", unidad:"mEq/L", min:1, default:18},
  ],
  calcular(v){ const be = 0.93*(v.hco3-24.4+14.8*(v.ph-7.40)); return {valor:+be.toFixed(1), unidad:"mEq/L"}; },
  interpretar(x){
    const t = band(x,[{max:-2,label:"Déficit de base (acidosis metabólica)",severidad:"moderado"},{max:2,label:"Normal",severidad:"normal"},{label:"Exceso de base (alcalosis metabólica)",severidad:"moderado"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Van Slyke, ecuación simplificada. Interpretar junto con la gasometría completa."
},
{
  id:"clcrmedido", nombre:"Clearance de creatinina medido (orina de 24h)", categoria:"nefro",
  resumen:"Clearance real a partir de una recolección de orina.",
  campos:[
    {id:"cru", label:"Creatinina urinaria", tipo:"num", unidad:"mg/dL", min:0.01, default:80},
    {id:"vol", label:"Volumen urinario total", tipo:"num", unidad:"mL", min:1, default:1500},
    {id:"crs", label:"Creatinina sérica", tipo:"num", unidad:"mg/dL", min:0.01, step:0.01, default:1.0},
    {id:"min", label:"Duración de la recolección", tipo:"num", unidad:"min", min:1, default:1440},
  ],
  calcular(v){ const cl = (v.cru*v.vol)/(v.crs*v.min); return {valor:+cl.toFixed(1), unidad:"mL/min"}; },
  interpretar(){ return {texto:"Interpretar solo si la recolección fue completa (verificar creatinina urinaria total esperada)", severidad:"info"}; },
  referencia:"Clearance urinario medido: CrU × volumen / (CrS × minutos)."
},
{
  id:"schwartz", nombre:"eGFR pediátrico (Schwartz bedside)", categoria:"pediatria",
  resumen:"Filtración glomerular estimada en niños.",
  campos:[
    {id:"talla", label:"Talla", tipo:"num", unidad:"cm", min:30, default:100},
    {id:"cr", label:"Creatinina sérica", tipo:"num", unidad:"mg/dL", min:0.05, step:0.01, default:0.5},
  ],
  calcular(v){ return {valor:+((0.413*v.talla)/v.cr).toFixed(1), unidad:"mL/min/1.73m²"}; },
  interpretar(x){ return {texto: x<90 ? "Filtración glomerular reducida para edad pediátrica" : "Filtración glomerular normal", severidad: x<90?"moderado":"normal"}; },
  referencia:"Schwartz GJ, et al. J Am Soc Nephrol 2009 (ecuación bedside CKiD)."
},
{
  id:"femg", nombre:"Fracción de excreción de magnesio (FeMg)", categoria:"nefro",
  resumen:"Evalúa pérdida renal de magnesio.",
  campos:[
    {id:"mgu", label:"Magnesio urinario", tipo:"num", unidad:"mg/dL", min:0, step:0.01, default:1.0},
    {id:"crs", label:"Creatinina sérica", tipo:"num", unidad:"mg/dL", min:0.01, step:0.01, default:1.0},
    {id:"mgs", label:"Magnesio sérico", tipo:"num", unidad:"mg/dL", min:0.01, step:0.01, default:1.5},
    {id:"cru", label:"Creatinina urinaria", tipo:"num", unidad:"mg/dL", min:0.01, default:50},
  ],
  calcular(v){ const f = (v.mgu*v.crs)/(0.7*v.mgs*v.cru)*100; return {valor:+f.toFixed(2), unidad:"%"}; },
  interpretar(x){ return {texto: x>4 ? "FeMg >4% sugiere pérdida renal de magnesio" : "FeMg normal (pérdida extrarrenal si hay hipomagnesemia)", severidad: x>4?"moderado":"normal"}; },
  referencia:"El factor 0.7 corrige por la fracción de Mg sérico unida a proteínas (~30% no filtrable)."
},
{
  id:"bau", nombre:"Brecha aniónica urinaria", categoria:"nefro",
  resumen:"Estima la capacidad de acidificación renal (amoniogénesis) en acidosis metabólica sin gap.",
  campos:[
    {id:"nau", label:"Sodio urinario", tipo:"num", unidad:"mEq/L", min:0, default:40},
    {id:"ku", label:"Potasio urinario", tipo:"num", unidad:"mEq/L", min:0, default:30},
    {id:"clu", label:"Cloro urinario", tipo:"num", unidad:"mEq/L", min:0, default:60},
  ],
  calcular(v){ return {valor:+(v.nau+v.ku-v.clu).toFixed(1), unidad:"mEq/L"}; },
  interpretar(x){
    return x>0
      ? {texto:"Positiva — sugiere causa renal (acidosis tubular renal, amoniogénesis alterada)", severidad:"moderado"}
      : {texto:"Negativa — sugiere pérdida extrarrenal (p.ej. diarrea) con respuesta renal apropiada", severidad:"normal"};
  },
  referencia:"Solo válido en acidosis metabólica hiperclorémica con anion gap normal."
},
// ---------- OBSTETRICIA ----------
{
  id:"fpp", nombre:"Fecha probable de parto (Naegele)", categoria:"gineco",
  resumen:"Estimación obstétrica a partir de la fecha de última regla.",
  campos:[{id:"fur", label:"Fecha de última regla", tipo:"date", default:hoyISO}],
  calcular(v){ return {valor: addDias(v.fur,280), unidad:""}; },
  interpretar(){ return {texto:"Ajustar por duración del ciclo y confirmar con ecografía precoz si está disponible", severidad:"info"}; },
  referencia:"Regla de Naegele: FUR + 280 días."
},
{
  id:"fconcep", nombre:"Fecha de concepción / ovulación estimada", categoria:"gineco",
  resumen:"Estimación calendárica según duración habitual del ciclo.",
  campos:[
    {id:"fur", label:"Primer día de la última regla", tipo:"date", default:hoyISO},
    {id:"ciclo", label:"Duración habitual del ciclo", tipo:"num", unidad:"días", min:20, max:45, default:28},
  ],
  calcular(v){ return {valor: addDias(v.fur, v.ciclo-14), unidad:""}; },
  interpretar(){ return {texto:"Menor precisión en ciclos irregulares", severidad:"info"}; },
  referencia:"Método calendárico: FUR + (duración del ciclo − 14 días)."
},
// ---------- CUIDADOS CRÍTICOS ADICIONALES ----------
{
  id:"ppc", nombre:"Presión de perfusión cerebral (PPC)", categoria:"neuro",
  resumen:"Meta habitual 60–70 mmHg en TEC grave con HIC.",
  campos:[
    {id:"pam", label:"Presión arterial media", tipo:"num", unidad:"mmHg", min:1, default:85},
    {id:"pic", label:"Presión intracraneal", tipo:"num", unidad:"mmHg", min:0, default:15},
  ],
  calcular(v){ return {valor:+(v.pam-v.pic).toFixed(0), unidad:"mmHg"}; },
  interpretar(x){
    const t = band(x,[{max:50,label:"PPC crítica — riesgo de isquemia cerebral",severidad:"critico"},{max:60,label:"PPC baja",severidad:"grave"},{max:70,label:"PPC en rango objetivo habitual",severidad:"normal"},{label:"PPC alta — vigilar riesgo de hiperemia",severidad:"leve"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"PPC = PAM − PIC. Guías de manejo del TEC grave (Brain Trauma Foundation)."
},
{
  id:"ettdepth", nombre:"Profundidad de inserción del tubo endotraqueal (pediátrico, oral)", categoria:"pediatria",
  resumen:"Aproximación de la marca a nivel de la comisura labial.",
  campos:[{id:"edad", label:"Edad", tipo:"num", unidad:"años", min:0, max:18, step:0.5, default:5}],
  calcular(v){ return {valor:+(v.edad/2+12).toFixed(1), unidad:"cm (comisura labial)"}; },
  interpretar(){ return {texto:"Aproximación pediátrica — no aplicar como regla única en neonatos; confirmar con auscultación y radiografía", severidad:"info"}; },
  referencia:"Fórmula pediátrica clásica: edad/2 + 12 cm."
},
{
  id:"ettsize", nombre:"Tamaño del tubo endotraqueal (pediátrico)", categoria:"pediatria",
  resumen:"Diámetro interno estimado según edad.",
  campos:[
    {id:"tipo", label:"Tipo de tubo", tipo:"select", opciones:[{value:"3.5",label:"Con balón (cuffed)"},{value:"4",label:"Sin balón (uncuffed)"}]},
    {id:"edad", label:"Edad", tipo:"num", unidad:"años", min:1, max:18, step:0.5, default:5},
  ],
  calcular(v){ return {valor:+(v.edad/4+(+v.tipo)).toFixed(1), unidad:"mm (diámetro interno)"}; },
  interpretar(){ return {texto:"Aproximación pediátrica desde 1 año — no reemplaza la selección neonatal ni la evaluación individual", severidad:"info"}; },
  referencia:"Con balón: edad/4 + 3.5. Sin balón: edad/4 + 4."
},
{
  id:"volsang", nombre:"Volumen sanguíneo estimado", categoria:"pediatria",
  resumen:"Estimación por peso y grupo etario.",
  campos:[
    {id:"grupo", label:"Grupo", tipo:"select", opciones:[{value:"95",label:"Prematuro (95 mL/kg)"},{value:"85",label:"Recién nacido (85 mL/kg)"},{value:"75",label:"Niño (75 mL/kg)"},{value:"70",label:"Adulto (70 mL/kg)"},{value:"65",label:"Adulta (65 mL/kg)"}]},
    {id:"peso", label:"Peso", tipo:"num", unidad:"kg", min:0.3, default:70},
  ],
  calcular(v){ return {valor:+(v.peso*(+v.grupo)).toFixed(0), unidad:"mL"}; },
  interpretar(){ return {texto:"Factores poblacionales aproximados", severidad:"info"}; },
  referencia:"Volumen sanguíneo estimado = peso × factor etario/sexual (mL/kg)."
},
{
  id:"hh", nombre:"Ecuación de Henderson-Hasselbalch", categoria:"respiratorio",
  resumen:"Relación ácido-base para verificar consistencia de la gasometría.",
  campos:[
    {id:"hco3", label:"Bicarbonato", tipo:"num", unidad:"mEq/L", min:1, default:24},
    {id:"paco2", label:"PaCO₂", tipo:"num", unidad:"mmHg", min:1, default:40},
  ],
  calcular(v){ return {valor:+(6.1+Math.log10(v.hco3/(0.03*v.paco2))).toFixed(2), unidad:""}; },
  interpretar(){ return {texto:"Compare con el pH medido en la gasometría para verificar consistencia interna", severidad:"info"}; },
  referencia:"pH = 6.1 + log₁₀[HCO₃⁻ / (0.03 × PaCO₂)]."
},
{
  id:"nadeficit", nombre:"Déficit de sodio (hiponatremia)", categoria:"nefro",
  resumen:"Estima el sodio necesario para alcanzar una meta.",
  campos:[
    {id:"sexo", label:"Agua corporal total", tipo:"select", opciones:[{value:"0.6",label:"Varón adulto (0.6)"},{value:"0.5",label:"Mujer adulta (0.5)"},{value:"0.45",label:"Persona mayor / frágil (0.45)"}]},
    {id:"peso", label:"Peso", tipo:"num", unidad:"kg", min:1, default:70},
    {id:"naact", label:"Sodio actual", tipo:"num", unidad:"mEq/L", min:100, default:125},
    {id:"nameta", label:"Sodio objetivo", tipo:"num", unidad:"mEq/L", min:100, default:135},
  ],
  calcular(v){ const act=v.peso*v.sexo; return {valor:+(act*(v.nameta-v.naact)).toFixed(0), unidad:"mEq totales"}; },
  interpretar(){ return {texto:"Corregir ≤8-10 mEq/L en 24 h para evitar síndrome de desmielinización osmótica", severidad:"info"}; },
  referencia:"Déficit de Na = ACT × (Na objetivo − Na actual)."
},
{
  id:"act", nombre:"Agua corporal total (ACT)", categoria:"nefro",
  resumen:"Estimación por peso y factor poblacional.",
  campos:[
    {id:"factor", label:"Factor", tipo:"select", opciones:[{value:"0.7",label:"Lactante (0.7)"},{value:"0.6",label:"Varón adulto (0.6)"},{value:"0.5",label:"Mujer adulta (0.5)"},{value:"0.45",label:"Persona mayor / frágil (0.45)"}]},
    {id:"peso", label:"Peso", tipo:"num", unidad:"kg", min:1, default:70},
  ],
  calcular(v){ return {valor:+(v.peso*v.factor).toFixed(1), unidad:"L"}; },
  interpretar(){ return {texto:"Factores convencionales de agua corporal total", severidad:"info"}; },
  referencia:"ACT = peso × factor poblacional."
},
{
  id:"balancehidrico", nombre:"Diuresis y balance hídrico", categoria:"nefro",
  resumen:"Evalúa el ritmo diurético y el balance de ingresos/egresos.",
  campos:[
    {id:"peso", label:"Peso", tipo:"num", unidad:"kg", min:1, default:70},
    {id:"orina", label:"Volumen urinario", tipo:"num", unidad:"mL", min:0, default:800},
    {id:"horas", label:"Duración", tipo:"num", unidad:"h", min:0.5, default:8},
    {id:"ingresos", label:"Ingresos totales", tipo:"num", unidad:"mL", min:0, default:1500},
    {id:"egresos", label:"Egresos totales (incluida la orina)", tipo:"num", unidad:"mL", min:0, default:1200},
  ],
  calcular(v){
    const diuresis = v.orina/(v.peso*v.horas);
    const balance = v.ingresos-v.egresos;
    return {valor:+diuresis.toFixed(2), unidad:"mL/kg/h", detalle:`Balance hídrico: ${balance>=0?"+":""}${balance.toFixed(0)} mL`};
  },
  interpretar(x){
    const t = band(x,[{max:0.5,label:"Oliguria",severidad:"grave"},{max:0.8,label:"Diuresis en el límite bajo",severidad:"moderado"},{label:"Diuresis normal (≥0.5-1 mL/kg/h)",severidad:"normal"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Interpretar junto con la perfusión clínica, función renal y pérdidas insensibles/no medidas."
},
{
  id:"fick", nombre:"Gasto cardíaco (principio de Fick)", categoria:"cardio",
  resumen:"Estima el gasto cardíaco a partir del consumo de oxígeno.",
  campos:[
    {id:"vo2", label:"Consumo de O₂ (VO₂)", tipo:"num", unidad:"mL/min", min:1, default:250},
    {id:"cao2", label:"Contenido arterial de O₂ (CaO₂)", tipo:"num", unidad:"mL/dL", min:1, default:20},
    {id:"cvo2", label:"Contenido venoso mixto de O₂ (CvO₂)", tipo:"num", unidad:"mL/dL", min:0, default:15},
  ],
  calcular(v){ const co = v.vo2/((v.cao2-v.cvo2)*10); return {valor:+co.toFixed(2), unidad:"L/min"}; },
  interpretar(x){ return {texto: x<4 ? "Por debajo del rango normal habitual (4-8 L/min)" : (x>8?"Por sobre el rango normal habitual":"Dentro de rango normal habitual"), severidad: (x<4||x>8)?"moderado":"normal"}; },
  referencia:"Principio de Fick: GC = VO₂ / [(CaO₂−CvO₂) × 10]."
},
// ---------- FÁRMACOS Y CONVERSIONES ----------
{
  id:"caequiv", nombre:"Equivalentes de calcio", categoria:"farmacos",
  resumen:"Convierte entre mg de calcio elemental, mmol y mEq.",
  campos:[
    {id:"unidad", label:"Unidad de origen", tipo:"select", opciones:[{value:"1",label:"mg de calcio elemental"},{value:"40.078",label:"mmol de calcio"},{value:"20.039",label:"mEq de calcio"}]},
    {id:"cant", label:"Cantidad", tipo:"num", min:0, default:1000},
  ],
  calcular(v){
    const mg = v.cant*v.unidad;
    return {valor:+mg.toFixed(1), unidad:"mg elemental", detalle:`= ${(mg/40.078).toFixed(2)} mmol = ${(mg/20.039).toFixed(2)} mEq`};
  },
  interpretar(){ return {texto:"1 mmol de Ca²⁺ = 40.078 mg = 2 mEq. Verificar la concentración exacta del producto usado", severidad:"info"}; },
  referencia:"Masa atómica del calcio y valencia +2."
},
{
  id:"siunits", nombre:"Conversión a unidades SI (laboratorio)", categoria:"farmacos",
  resumen:"Convierte analitos comunes de unidades convencionales a SI.",
  campos:[
    {id:"analito", label:"Analito", tipo:"select", opciones:[
      {value:"0.0555",label:"Glucosa: mg/dL → mmol/L"},
      {value:"0.0259",label:"Colesterol: mg/dL → mmol/L"},
      {value:"0.0113",label:"Triglicéridos: mg/dL → mmol/L"},
      {value:"88.4",label:"Creatinina: mg/dL → µmol/L"},
      {value:"17.1",label:"Bilirrubina: mg/dL → µmol/L"},
      {value:"0.25",label:"Calcio: mg/dL → mmol/L"},
    ]},
    {id:"valor", label:"Resultado convencional", tipo:"num", unidad:"mg/dL", min:0, default:100},
  ],
  calcular(v){ return {valor:+(v.valor*v.analito).toFixed(3), unidad:"(unidad SI)"}; },
  interpretar(){ return {texto:"Confirme las unidades impresas por su laboratorio de referencia", severidad:"info"}; },
  referencia:"Factores de conversión basados en masa molar de cada analito."
},
{
  id:"corticoides", nombre:"Conversión de corticoides equivalentes", categoria:"farmacos",
  resumen:"Dosis equivalentes de glucocorticoides sistémicos.",
  campos:[
    {id:"origen", label:"Corticoide de origen", tipo:"select", opciones:[
      {value:"25",label:"Cortisona (25 mg)"},{value:"20",label:"Hidrocortisona (20 mg)"},{value:"5",label:"Prednisona (5 mg)"},
      {value:"5",label:"Prednisolona (5 mg)"},{value:"4",label:"Metilprednisolona (4 mg)"},{value:"4",label:"Triamcinolona (4 mg)"},
      {value:"0.75",label:"Dexametasona (0.75 mg)"},{value:"0.6",label:"Betametasona (0.6 mg)"},
    ]},
    {id:"dosis", label:"Dosis de origen", tipo:"num", unidad:"mg", min:0.01, step:0.01, default:20},
    {id:"destino", label:"Corticoide de destino", tipo:"select", opciones:[
      {value:"25",label:"Cortisona"},{value:"20",label:"Hidrocortisona"},{value:"5",label:"Prednisona"},
      {value:"5",label:"Prednisolona"},{value:"4",label:"Metilprednisolona"},{value:"4",label:"Triamcinolona"},
      {value:"0.75",label:"Dexametasona"},{value:"0.6",label:"Betametasona"},
    ]},
  ],
  calcular(v){ const d = (v.dosis/v.origen)*v.destino; return {valor:+d.toFixed(2), unidad:"mg (equivalente)"}; },
  interpretar(){ return {texto:"Equivalencia por potencia glucocorticoide; no considera efecto mineralocorticoide ni vida media", severidad:"info"}; },
  referencia:"Dosis equivalentes estándar de glucocorticoides sistémicos."
},
{
  id:"ganzoni", nombre:"Déficit total de hierro (Ganzoni)", categoria:"hemato",
  resumen:"Dosis total de hierro EV para corregir la anemia y reponer depósitos.",
  campos:[
    {id:"peso", label:"Peso", tipo:"num", unidad:"kg", min:1, default:70},
    {id:"hbact", label:"Hemoglobina actual", tipo:"num", unidad:"g/dL", min:1, step:0.1, default:9},
    {id:"hbmeta", label:"Hemoglobina objetivo", tipo:"num", unidad:"g/dL", min:1, step:0.1, default:15},
    {id:"deposito", label:"Depósito a reponer", tipo:"num", unidad:"mg", min:0, default:500},
  ],
  calcular(v){ const d = v.peso*(v.hbmeta-v.hbact)*2.4+v.deposito; return {valor:+d.toFixed(0), unidad:"mg de hierro"}; },
  interpretar(){ return {texto:"Verificar la preparación de hierro EV usada y su dosis máxima por infusión", severidad:"info"}; },
  referencia:"Fórmula de Ganzoni. Depósito habitual: 500 mg en adultos, 15 mg/kg en niños <35 kg."
},
// ---------- FLUIDOS IV ----------
{
  id:"flujoiv", nombre:"Velocidad de flujo IV", categoria:"formulas",
  resumen:"Convierte volumen y tiempo en velocidad de infusión.",
  campos:[
    {id:"vol", label:"Volumen", tipo:"num", unidad:"mL", min:1, default:1000},
    {id:"horas", label:"Tiempo", tipo:"num", unidad:"h", min:0.1, step:0.1, default:8},
  ],
  calcular(v){ return {valor:+(v.vol/v.horas).toFixed(1), unidad:"mL/h"}; },
  interpretar(){ return {texto:"Velocidad de infusión resultante", severidad:"info"}; },
  referencia:"Velocidad = volumen / tiempo."
},
{
  id:"gir", nombre:"Tasa de infusión de glucosa (GIR)", categoria:"pediatria",
  resumen:"Aporte de glucosa en infusiones EV, especialmente en neonatología.",
  campos:[
    {id:"dext", label:"Concentración de dextrosa", tipo:"num", unidad:"%", min:1, max:50, default:10},
    {id:"vol", label:"Volumen total", tipo:"num", unidad:"mL/kg/día", min:1, default:100},
  ],
  calcular(v){ return {valor:+((v.dext*v.vol)/144).toFixed(2), unidad:"mg/kg/min"}; },
  interpretar(x){ return {texto: x<4?"Aporte bajo": (x>12?"Aporte alto — vigilar hiperglucemia":"Dentro del rango habitual (4-12 mg/kg/min)"), severidad: (x<4||x>12)?"moderado":"normal"}; },
  referencia:"GIR = % dextrosa × mL/kg/día ÷ 144."
},
{
  id:"tiempoinf", nombre:"Tiempo de infusión IV", categoria:"formulas",
  resumen:"Calcula cuánto durará una infusión a una velocidad dada.",
  campos:[
    {id:"vol", label:"Volumen", tipo:"num", unidad:"mL", min:1, default:1000},
    {id:"vel", label:"Velocidad de bomba", tipo:"num", unidad:"mL/h", min:1, default:125},
  ],
  calcular(v){ return {valor:+(v.vol/v.vel).toFixed(2), unidad:"horas"}; },
  interpretar(){ return {texto:"Tiempo estimado de infusión", severidad:"info"}; },
  referencia:"Tiempo = volumen / velocidad."
},
// ---------- HEMATOLOGÍA ----------
{
  id:"ranC", nombre:"Recuento absoluto de neutrófilos (RAN)", categoria:"hemato",
  resumen:"Detecta neutropenia y su severidad.",
  campos:[
    {id:"leuco", label:"Leucocitos totales", tipo:"num", unidad:"/µL", min:1, default:5000},
    {id:"neu", label:"Neutrófilos", tipo:"num", unidad:"%", min:0, max:100, default:55},
    {id:"band", label:"Bandas (cayados)", tipo:"num", unidad:"%", min:0, max:100, default:2},
  ],
  calcular(v){ return {valor:+(v.leuco*(v.neu+v.band)/100).toFixed(0), unidad:"/µL"}; },
  interpretar(x){
    const t = band(x,[{max:500,label:"Neutropenia grave — alto riesgo de infección",severidad:"critico"},{max:1000,label:"Neutropenia moderada",severidad:"grave"},{max:1500,label:"Neutropenia leve",severidad:"moderado"},{label:"Normal",severidad:"normal"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"RAN = leucocitos × (%neutrófilos + %bandas) / 100."
},
{
  id:"eosabs", nombre:"Recuento absoluto de eosinófilos", categoria:"hemato",
  resumen:"Detecta eosinofilia.",
  campos:[
    {id:"leuco", label:"Leucocitos totales", tipo:"num", unidad:"/µL", min:1, default:6000},
    {id:"eos", label:"Eosinófilos", tipo:"num", unidad:"%", min:0, max:100, default:3},
  ],
  calcular(v){ return {valor:+(v.leuco*v.eos/100).toFixed(0), unidad:"/µL"}; },
  interpretar(x){ return {texto: x>500 ? "Eosinofilia" : "Normal", severidad: x>1500?"grave":(x>500?"moderado":"normal")}; },
  referencia:"Recuento absoluto = leucocitos × % eosinófilos / 100."
},
{
  id:"linfabs", nombre:"Recuento absoluto de linfocitos", categoria:"hemato",
  resumen:"Detecta linfopenia o linfocitosis.",
  campos:[
    {id:"leuco", label:"Leucocitos totales", tipo:"num", unidad:"/µL", min:1, default:6000},
    {id:"linf", label:"Linfocitos", tipo:"num", unidad:"%", min:0, max:100, default:30},
  ],
  calcular(v){ return {valor:+(v.leuco*v.linf/100).toFixed(0), unidad:"/µL"}; },
  interpretar(x){
    const t = band(x,[{max:1000,label:"Linfopenia",severidad:"moderado"},{max:4800,label:"Normal",severidad:"normal"},{label:"Linfocitosis",severidad:"moderado"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Recuento absoluto = leucocitos × % linfocitos / 100."
},
{
  id:"reticabs", nombre:"Recuento absoluto de reticulocitos", categoria:"hemato",
  resumen:"Evalúa la respuesta medular a la anemia.",
  campos:[
    {id:"rbc", label:"Eritrocitos", tipo:"num", unidad:"millones/µL", min:0.1, step:0.01, default:4.5},
    {id:"retic", label:"Reticulocitos", tipo:"num", unidad:"%", min:0, max:20, step:0.1, default:1.0},
  ],
  calcular(v){ return {valor:+(v.rbc*1e6*v.retic/100).toFixed(0), unidad:"/µL"}; },
  interpretar(x){ return {texto: x<25000?"Respuesta reticulocitaria baja (hipoproliferativa)":"Respuesta reticulocitaria adecuada", severidad: x<25000?"moderado":"normal"}; },
  referencia:"Recuento absoluto = eritrocitos/µL × % reticulocitos / 100."
},
{
  id:"reticcorr", nombre:"Recuento de reticulocitos corregido", categoria:"hemato",
  resumen:"Ajusta el % de reticulocitos por el grado de anemia.",
  campos:[
    {id:"retic", label:"Reticulocitos", tipo:"num", unidad:"%", min:0, max:20, step:0.1, default:5},
    {id:"htopac", label:"Hematocrito del paciente", tipo:"num", unidad:"%", min:5, default:25},
    {id:"htoref", label:"Hematocrito de referencia", tipo:"num", unidad:"%", min:5, default:45},
  ],
  calcular(v){ return {valor:+(v.retic*v.htopac/v.htoref).toFixed(2), unidad:"%"}; },
  interpretar(x){ return {texto: x<2 ? "Respuesta medular inadecuada para el grado de anemia" : "Respuesta medular adecuada", severidad: x<2?"moderado":"normal"}; },
  referencia:"% corregido = % reticulocitos observado × Hto paciente / Hto de referencia."
},
{
  id:"indiceshem", nombre:"Índices hematimétricos (VCM, HCM, CHCM)", categoria:"hemato",
  resumen:"Caracteriza el tipo de anemia a partir del hemograma.",
  campos:[
    {id:"hb", label:"Hemoglobina", tipo:"num", unidad:"g/dL", min:1, step:0.1, default:12},
    {id:"hto", label:"Hematocrito", tipo:"num", unidad:"%", min:1, step:0.1, default:36},
    {id:"rbc", label:"Eritrocitos", tipo:"num", unidad:"millones/µL", min:0.1, step:0.01, default:4.0},
  ],
  calcular(v){
    const vcm = v.hto*10/v.rbc, hcm = v.hb*10/v.rbc, chcm = v.hb*100/v.hto;
    return {valor:+vcm.toFixed(1), unidad:"fL (VCM)", detalle:`HCM: ${hcm.toFixed(1)} pg · CHCM: ${chcm.toFixed(1)} g/dL`};
  },
  interpretar(x){
    const t = band(x,[{max:80,label:"Anemia microcítica",severidad:"moderado"},{max:100,label:"Normocítica",severidad:"normal"},{label:"Macrocítica",severidad:"moderado"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"VCM = Hto×10/RBC. HCM = Hb×10/RBC. CHCM = Hb×100/Hto."
},
{
  id:"mentzer", nombre:"Índice de Mentzer", categoria:"hemato",
  resumen:"Cribado entre rasgo talasémico y ferropenia.",
  campos:[
    {id:"vcm", label:"VCM", tipo:"num", unidad:"fL", min:30, default:70},
    {id:"rbc", label:"Eritrocitos", tipo:"num", unidad:"millones/µL", min:0.1, step:0.01, default:5.5},
  ],
  calcular(v){ return {valor:+(v.vcm/v.rbc).toFixed(1), unidad:""}; },
  interpretar(x){
    return x<13
      ? {texto:"<13 — sugiere rasgo talasémico (screening; no confirma etiología)", severidad:"leve"}
      : {texto:"≥13 — sugiere anemia ferropénica", severidad:"leve"};
  },
  referencia:"Índice de Mentzer = VCM / recuento de eritrocitos (millones/µL)."
},
{
  id:"volsangdli", nombre:"Volumen de infusión de linfocitos del donante (DLI)", categoria:"hemato",
  resumen:"Calcula el volumen a infundir para una dosis celular objetivo.",
  campos:[
    {id:"dosis", label:"Dosis CD3⁺ objetivo", tipo:"num", unidad:"×10⁶ células/kg", min:0.01, step:0.01, default:1},
    {id:"peso", label:"Peso del receptor", tipo:"num", unidad:"kg", min:1, default:70},
    {id:"conc", label:"Concentración del producto", tipo:"num", unidad:"×10⁶ células/mL", min:0.1, default:50},
  ],
  calcular(v){ return {valor:+((v.dosis*v.peso)/v.conc).toFixed(1), unidad:"mL"}; },
  interpretar(){ return {texto:"Requiere validación por el equipo de terapia celular/hemoterapia", severidad:"info"}; },
  referencia:"Volumen = dosis objetivo × peso / concentración del producto."
},
// ---------- GASTROENTEROLOGÍA / HEPATOLOGÍA ADICIONAL ----------
{
  id:"apri", nombre:"Índice APRI (fibrosis hepática)", categoria:"gastro",
  resumen:"Cribado no invasivo de fibrosis hepática significativa.",
  campos:[
    {id:"ast", label:"AST", tipo:"num", unidad:"U/L", min:1, default:40},
    {id:"lsn", label:"Límite superior normal de AST", tipo:"num", unidad:"U/L", min:1, default:40},
    {id:"plaq", label:"Plaquetas", tipo:"num", unidad:"×10³/µL", min:1, default:200},
  ],
  calcular(v){ return {valor:+(((v.ast/v.lsn)*100)/v.plaq).toFixed(2), unidad:""}; },
  interpretar(x){
    const t = band(x,[{max:0.5,label:"Baja probabilidad de fibrosis significativa",severidad:"normal"},{max:1.5,label:"Zona indeterminada",severidad:"moderado"},{label:"Alta probabilidad de fibrosis significativa/cirrosis",severidad:"grave"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"APRI = (AST/LSN AST) × 100 / plaquetas. No usar de forma aislada para decisiones diagnósticas."
},
{
  id:"fib4", nombre:"Índice FIB-4 (fibrosis hepática)", categoria:"gastro",
  resumen:"Cribado no invasivo de fibrosis hepática avanzada.",
  campos:[
    {id:"edad", label:"Edad", tipo:"num", unidad:"años", min:1, max:120, default:50},
    {id:"ast", label:"AST", tipo:"num", unidad:"U/L", min:1, default:40},
    {id:"alt", label:"ALT", tipo:"num", unidad:"U/L", min:1, default:35},
    {id:"plaq", label:"Plaquetas", tipo:"num", unidad:"×10⁹/L", min:1, default:200},
  ],
  calcular(v){ return {valor:+((v.edad*v.ast)/(v.plaq*Math.sqrt(v.alt))).toFixed(2), unidad:""}; },
  interpretar(x){
    const t = band(x,[{max:1.45,label:"Baja probabilidad de fibrosis avanzada",severidad:"normal"},{max:3.25,label:"Zona indeterminada",severidad:"moderado"},{label:"Alta probabilidad de fibrosis avanzada",severidad:"grave"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"FIB-4 = (edad × AST) / (plaquetas × √ALT). Los puntos de corte varían con edad y etiología."
},
{
  id:"gasa", nombre:"Gradiente albúmina suero-ascitis (GASA)", categoria:"gastro",
  resumen:"Clasifica la causa de la ascitis.",
  campos:[
    {id:"alser", label:"Albúmina sérica", tipo:"num", unidad:"g/dL", min:0, step:0.1, default:3.0},
    {id:"alasc", label:"Albúmina ascítica", tipo:"num", unidad:"g/dL", min:0, step:0.1, default:1.0},
  ],
  calcular(v){ return {valor:+(v.alser-v.alasc).toFixed(2), unidad:"g/dL"}; },
  interpretar(x){
    return x>=1.1
      ? {texto:"≥1.1 g/dL — sugiere hipertensión portal (cirrosis, insuficiencia cardíaca)", severidad:"moderado"}
      : {texto:"<1.1 g/dL — sugiere causa no relacionada con hipertensión portal (carcinomatosis peritoneal, TBC, pancreatitis)", severidad:"moderado"};
  },
  referencia:"GASA = albúmina sérica − albúmina ascítica. Muestras idealmente el mismo día."
},
{
  id:"osmfecal", nombre:"Brecha osmolar fecal", categoria:"gastro",
  resumen:"Diferencia diarrea osmótica de secretora.",
  campos:[
    {id:"naf", label:"Sodio fecal", tipo:"num", unidad:"mmol/L", min:0, default:40},
    {id:"kf", label:"Potasio fecal", tipo:"num", unidad:"mmol/L", min:0, default:30},
  ],
  calcular(v){ return {valor:+(290-2*(v.naf+v.kf)).toFixed(0), unidad:"mOsm/kg"}; },
  interpretar(x){
    const t = band(x,[{max:50,label:"Sugiere diarrea secretora",severidad:"moderado"},{max:125,label:"Zona indeterminada",severidad:"leve"},{label:"Sugiere diarrea osmótica",severidad:"moderado"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Brecha = 290 − 2 × (Na fecal + K fecal)."
},
{
  id:"lcrwbc", nombre:"Corrección de leucocitos en LCR por hematíes", categoria:"neuro",
  resumen:"Corrige el recuento de leucocitos en LCR contaminado con sangre de punción traumática.",
  campos:[
    {id:"wbc", label:"Leucocitos observados en LCR", tipo:"num", unidad:"/µL", min:0, default:50},
    {id:"rbc", label:"Hematíes en LCR", tipo:"num", unidad:"/µL", min:0, default:5000},
    {id:"rel", label:"Relación hematíes/leucocito de referencia (sangre periférica)", tipo:"num", min:1, default:500},
  ],
  calcular(v){ return {valor:+(v.wbc-(v.rbc/v.rel)).toFixed(0), unidad:"/µL (corregido)"}; },
  interpretar(){ return {texto:"Corrección aproximada; la relación real depende del hemograma periférico del paciente", severidad:"info"}; },
  referencia:"WBC corregido = WBC observado − (RBC LCR / relación RBC:WBC)."
},
{
  id:"lcrprot", nombre:"Corrección de proteínas en LCR contaminado con sangre", categoria:"neuro",
  resumen:"Corrige la proteinorraquia cuando hubo punción traumática.",
  campos:[
    {id:"prot", label:"Proteína observada", tipo:"num", unidad:"mg/dL", min:0, default:60},
    {id:"rbc", label:"Hematíes en LCR", tipo:"num", unidad:"/µL", min:0, default:5000},
    {id:"factor", label:"Corrección por cada 1000 hematíes", tipo:"num", unidad:"mg/dL", min:0, step:0.1, default:1.0},
  ],
  calcular(v){ return {valor:+(v.prot-(v.rbc/1000*v.factor)).toFixed(1), unidad:"mg/dL (corregido)"}; },
  interpretar(){ return {texto:"Corrección aproximada, dependiente de la población y el protocolo local", severidad:"info"}; },
  referencia:"Proteína corregida = proteína observada − (RBC/1000 × factor)."
},
// ---------- ENDOCRINOLOGÍA ----------
{
  id:"eag", nombre:"Glucosa media estimada desde HbA1c (eAG)", categoria:"nutricion",
  resumen:"Traduce la HbA1c a una glucemia promedio equivalente.",
  campos:[{id:"a1c", label:"HbA1c", tipo:"num", unidad:"%", min:3, max:20, step:0.1, default:7}],
  calcular(v){ return {valor:+(28.7*v.a1c-46.7).toFixed(0), unidad:"mg/dL"}; },
  interpretar(){ return {texto:"Relación derivada del estudio ADAG; interpretar según el método de laboratorio", severidad:"info"}; },
  referencia:"eAG = 28.7 × HbA1c − 46.7."
},
{
  id:"a1cdesdeeag", nombre:"Estimación de HbA1c desde glucosa media", categoria:"nutricion",
  resumen:"Función inversa de la relación ADAG.",
  campos:[{id:"eag", label:"Glucosa media", tipo:"num", unidad:"mg/dL", min:40, default:154}],
  calcular(v){ return {valor:+((v.eag+46.7)/28.7).toFixed(1), unidad:"%"}; },
  interpretar(){ return {texto:"Relación ADAG invertida", severidad:"info"}; },
  referencia:"HbA1c = (eAG + 46.7) / 28.7."
},
// ---------- INFECTOLOGÍA / PEDIATRÍA (SCORES) ----------
{
  id:"alvarado", nombre:"Score de Alvarado (apendicitis)", categoria:"gastro",
  resumen:"Probabilidad clínica de apendicitis aguda en adultos.",
  campos:[
    {id:"migracion", label:"Migración del dolor a FID", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"anorexia", label:"Anorexia", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"nauseas", label:"Náuseas o vómitos", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"dolorfid", label:"Dolor a la palpación en FID", tipo:"bool", opciones:[{value:"2",label:"Sí"},{value:"0",label:"No"}]},
    {id:"rebote", label:"Dolor de rebote", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"temp", label:"Temperatura ≥37.3°C", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"leuco", label:"Leucocitosis >10.000/µL", tipo:"bool", opciones:[{value:"2",label:"Sí"},{value:"0",label:"No"}]},
    {id:"desviz", label:"Neutrofilia / desviación izquierda", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/10"}; },
  interpretar(x){
    const t = band(x,[{max:5,label:"≤4: baja probabilidad",severidad:"normal"},{max:7,label:"5–6: posible apendicitis — observación/imágenes",severidad:"moderado"},{max:9,label:"7–8: probable apendicitis — evaluación quirúrgica",severidad:"grave"},{label:"9–10: muy probable apendicitis",severidad:"critico"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Alvarado A. Ann Emerg Med 1986 (MANTRELS). Rendimiento variable según población."
},
{
  id:"pas", nombre:"Score pediátrico de apendicitis (PAS)", categoria:"pediatria",
  resumen:"Equivalente pediátrico del score de Alvarado.",
  campos:[
    {id:"migracion", label:"Migración del dolor a FID", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"anorexia", label:"Anorexia", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"nauseas", label:"Náuseas o vómitos", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"fiebre", label:"Fiebre ≥38°C", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"tos", label:"Dolor con la tos, percusión o al saltar", tipo:"bool", opciones:[{value:"2",label:"Sí"},{value:"0",label:"No"}]},
    {id:"dolorfid", label:"Dolor a la palpación en FID", tipo:"bool", opciones:[{value:"2",label:"Sí"},{value:"0",label:"No"}]},
    {id:"leuco", label:"Leucocitos >10.000/µL", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"neutro", label:"Neutrófilos >75%", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/10"}; },
  interpretar(x){
    const t = band(x,[{max:4,label:"≤3: baja probabilidad",severidad:"normal"},{max:7,label:"4–6: probabilidad indeterminada — observación/imágenes",severidad:"moderado"},{label:"≥7: alta probabilidad — evaluación quirúrgica",severidad:"grave"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Samuel M. J Pediatr Surg 2002 (Pediatric Appendicitis Score)."
},
{
  id:"air", nombre:"Score AIR (apendicitis)", categoria:"gastro",
  resumen:"Alternativa al Alvarado con mejor calibración en algunos estudios.",
  campos:[
    {id:"vomitos", label:"Vómitos", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"dolorfid", label:"Dolor en fosa ilíaca derecha", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"defensa", label:"Defensa muscular / dolor de rebote", tipo:"select", opciones:[{value:"0",label:"Ausente (0)"},{value:"1",label:"Leve (1)"},{value:"2",label:"Moderada (2)"},{value:"3",label:"Severa (3)"}]},
    {id:"temp", label:"Temperatura ≥38.5°C", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"neutro", label:"Neutrófilos", tipo:"select", opciones:[{value:"0",label:"<70% (0)"},{value:"1",label:"70–84% (1)"},{value:"2",label:"≥85% (2)"}]},
    {id:"leuco", label:"Leucocitos (×10⁹/L)", tipo:"select", opciones:[{value:"0",label:"<10.0 (0)"},{value:"1",label:"10.0–14.9 (1)"},{value:"2",label:"≥15.0 (2)"}]},
    {id:"pcr", label:"Proteína C reactiva (mg/L)", tipo:"select", opciones:[{value:"0",label:"<10 (0)"},{value:"1",label:"10–49 (1)"},{value:"2",label:"≥50 (2)"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/12"}; },
  interpretar(x){
    const t = band(x,[{max:5,label:"0–4: riesgo bajo",severidad:"normal"},{max:9,label:"5–8: riesgo indeterminado — observación/imágenes",severidad:"moderado"},{label:"9–12: riesgo alto de apendicitis",severidad:"grave"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Andersson M, Andersson RE. World J Surg 2008 (Appendicitis Inflammatory Response score)."
},
{
  id:"kocher", nombre:"Criterios de Kocher (artritis séptica de cadera, pediátrica)", categoria:"pediatria",
  resumen:"Diferencia artritis séptica de sinovitis transitoria.",
  campos:[
    {id:"apoyo", label:"Incapacidad para apoyar peso", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"temp", label:"Temperatura >38.5°C", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"vsg", label:"VSG ≥40 mm/h", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"leuco", label:"Leucocitos >12.000/µL", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/4 predictores"}; },
  interpretar(x){
    const t = band(x,[{max:1,label:"0 predictores: probabilidad de artritis séptica <0.2%",severidad:"normal"},{max:2,label:"1 predictor: probabilidad ~3%",severidad:"leve"},{max:3,label:"2 predictores: probabilidad ~40%",severidad:"moderado"},{max:4,label:"3 predictores: probabilidad ~93%",severidad:"grave"},{label:"4 predictores: probabilidad ~99%",severidad:"critico"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Kocher MS, et al. J Bone Joint Surg Am 1999."
},
{
  id:"feverpain", nombre:"Score FeverPAIN (faringoamigdalitis)", categoria:"infecto",
  resumen:"Alternativa a Centor/McIsaac para guiar el uso de antibióticos.",
  campos:[
    {id:"fiebre", label:"Fiebre en las últimas 24 horas", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"pus", label:"Exudado/pus amigdalino", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"consulta", label:"Consulta dentro de los primeros 3 días", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"inflamacion", label:"Amígdalas intensamente inflamadas", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"sintos", label:"Ausencia de tos o coriza", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/5"}; },
  interpretar(x){
    const t = band(x,[{max:2,label:"0–1: baja probabilidad de estreptococo (13-18%) — no antibiótico",severidad:"normal"},{max:4,label:"2–3: probabilidad moderada (34-40%)",severidad:"moderado"},{label:"4–5: alta probabilidad (62-65%) — considerar antibiótico",severidad:"grave"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Little P, et al. Health Technol Assess 2014 (estudio PRISM)."
},
{
  id:"westley", nombre:"Score de Westley (crup)", categoria:"pediatria",
  resumen:"Gravedad del crup laríngeo pediátrico.",
  campos:[
    {id:"conciencia", label:"Nivel de conciencia", tipo:"select", opciones:[{value:"0",label:"Normal, incluido el sueño (0)"},{value:"5",label:"Alterado / desorientado (5)"}]},
    {id:"cianosis", label:"Cianosis", tipo:"select", opciones:[{value:"0",label:"Ninguna (0)"},{value:"4",label:"Con agitación (4)"},{value:"5",label:"En reposo (5)"}]},
    {id:"estridor", label:"Estridor", tipo:"select", opciones:[{value:"0",label:"Ninguno (0)"},{value:"1",label:"Con agitación (1)"},{value:"2",label:"En reposo (2)"}]},
    {id:"entrada", label:"Entrada de aire", tipo:"select", opciones:[{value:"0",label:"Normal (0)"},{value:"1",label:"Disminuida (1)"},{value:"2",label:"Muy disminuida (2)"}]},
    {id:"retraccion", label:"Retracciones", tipo:"select", opciones:[{value:"0",label:"Ninguna (0)"},{value:"1",label:"Leve (1)"},{value:"2",label:"Moderada (2)"},{value:"3",label:"Severa (3)"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/17"}; },
  interpretar(x){
    const t = band(x,[{max:3,label:"≤2: crup leve",severidad:"normal"},{max:8,label:"3–7: crup moderado",severidad:"moderado"},{max:12,label:"8–11: crup severo",severidad:"grave"},{label:"≥12: falla respiratoria inminente",severidad:"critico"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Westley CR, et al. Am J Dis Child 1978."
},
{
  id:"flacc", nombre:"Escala FLACC (dolor pediátrico no verbal)", categoria:"pediatria",
  resumen:"Evalúa dolor en niños pequeños o no comunicativos.",
  campos:[
    {id:"cara", label:"Cara", tipo:"select", opciones:[{value:"0",label:"Sin expresión particular o sonriente (0)"},{value:"1",label:"Mueca ocasional, retraído (1)"},{value:"2",label:"Mentón tembloroso, mandíbula apretada (2)"}]},
    {id:"piernas", label:"Piernas", tipo:"select", opciones:[{value:"0",label:"Posición normal o relajada (0)"},{value:"1",label:"Inquietas, tensas (1)"},{value:"2",label:"Pataleo o piernas encogidas (2)"}]},
    {id:"actividad", label:"Actividad", tipo:"select", opciones:[{value:"0",label:"Acostado tranquilo, se mueve normal (0)"},{value:"1",label:"Retorciéndose, tenso (1)"},{value:"2",label:"Rígido o con sacudidas (2)"}]},
    {id:"llanto", label:"Llanto", tipo:"select", opciones:[{value:"0",label:"Sin llanto (0)"},{value:"1",label:"Quejidos, lloriqueo ocasional (1)"},{value:"2",label:"Llanto constante, gritos (2)"}]},
    {id:"consolabilidad", label:"Consolabilidad", tipo:"select", opciones:[{value:"0",label:"Contento, relajado (0)"},{value:"1",label:"Se tranquiliza al tocarlo/hablarle (1)"},{value:"2",label:"Difícil de consolar (2)"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/10"}; },
  interpretar(x){
    const t = band(x,[{max:1,label:"0: sin dolor",severidad:"normal"},{max:4,label:"1–3: dolor leve",severidad:"leve"},{max:7,label:"4–6: dolor moderado",severidad:"moderado"},{label:"7–10: dolor severo",severidad:"grave"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Merkel S, et al. Pediatr Nurs 1997 (FLACC scale)."
},
{
  id:"bms", nombre:"Bacterial Meningitis Score (Nigrovic)", categoria:"pediatria",
  resumen:"Riesgo de meningitis bacteriana en niños con pleocitosis en LCR.",
  campos:[
    {id:"gram", label:"Tinción de Gram de LCR positiva", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"prot", label:"Proteína de LCR ≥80 mg/dL", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"ranp", label:"RAN periférico ≥10.000/µL", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"ranlcr", label:"RAN en LCR ≥1.000/µL", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"convulsion", label:"Convulsión al inicio o antes de la presentación", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/5 predictores"}; },
  interpretar(x, v){
    if (v.gram==="1") return {texto:"Gram positivo por sí solo indica alto riesgo de meningitis bacteriana", severidad:"critico"};
    return x===0
      ? {texto:"Score 0 — riesgo muy bajo de meningitis bacteriana (<0.1%)", severidad:"normal"}
      : {texto:"Score ≥1 — no se puede excluir meningitis bacteriana; considerar hospitalización y tratamiento empírico", severidad:"grave"};
  },
  referencia:"Nigrovic LE, et al. Pediatrics 2002/2007 (derivación y validación)."
},
{
  id:"eckhardt", nombre:"Score de Eckhardt (acalasia)", categoria:"gastro",
  resumen:"Cuantifica la severidad sintomática de la acalasia.",
  campos:[
    {id:"disfagia", label:"Disfagia", tipo:"select", opciones:[{value:"0",label:"Ninguna (0)"},{value:"1",label:"Ocasional (1)"},{value:"2",label:"Diaria (2)"},{value:"3",label:"En cada comida (3)"}]},
    {id:"regurgitacion", label:"Regurgitación", tipo:"select", opciones:[{value:"0",label:"Ninguna (0)"},{value:"1",label:"Ocasional (1)"},{value:"2",label:"Diaria (2)"},{value:"3",label:"En cada comida (3)"}]},
    {id:"dolor", label:"Dolor retroesternal", tipo:"select", opciones:[{value:"0",label:"Ninguno (0)"},{value:"1",label:"Ocasional (1)"},{value:"2",label:"Diario (2)"},{value:"3",label:"Varias veces al día (3)"}]},
    {id:"peso", label:"Pérdida de peso", tipo:"select", opciones:[{value:"0",label:"Ninguna (0)"},{value:"1",label:"<5 kg (1)"},{value:"2",label:"5–10 kg (2)"},{value:"3",label:">10 kg (3)"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/12"}; },
  interpretar(x){
    const t = band(x,[{max:2,label:"0–1 (estadio 0): remisión",severidad:"normal"},{max:4,label:"2–3 (estadio I): síntomas leves",severidad:"leve"},{max:7,label:"4–6 (estadio II): síntomas moderados",severidad:"moderado"},{label:">6 (estadio III): síntomas graves — evaluar falla terapéutica",severidad:"grave"}]);
    return {texto:t.label, severidad:t.severidad};
  },
  referencia:"Eckardt VF, et al. Gastroenterology 1992."
},
// ---------- REUMATOLOGÍA ----------
{
  id:"basdai", nombre:"Índice BASDAI (espondilitis anquilosante)", categoria:"reumatologia",
  resumen:"Actividad de la enfermedad en espondiloartritis axial.",
  campos:[
    {id:"q1", label:"Fatiga", tipo:"num", unidad:"0-10", min:0, max:10, step:0.5, default:3},
    {id:"q2", label:"Dolor axial (columna/cadera)", tipo:"num", unidad:"0-10", min:0, max:10, step:0.5, default:3},
    {id:"q3", label:"Dolor/inflamación en articulaciones periféricas", tipo:"num", unidad:"0-10", min:0, max:10, step:0.5, default:2},
    {id:"q4", label:"Molestia por zonas sensibles al tacto/presión", tipo:"num", unidad:"0-10", min:0, max:10, step:0.5, default:2},
    {id:"q5", label:"Intensidad de la rigidez matinal", tipo:"num", unidad:"0-10", min:0, max:10, step:0.5, default:3},
    {id:"q6", label:"Duración de la rigidez matinal", tipo:"num", unidad:"0-10", min:0, max:10, step:0.5, default:3},
  ],
  calcular(v){ const s = (v.q1+v.q2+v.q3+v.q4+(v.q5+v.q6)/2)/5; return {valor:+s.toFixed(1), unidad:"/10"}; },
  interpretar(x){ return {texto: x>=4 ? "≥4 sugiere enfermedad activa" : "Enfermedad poco activa por este índice", severidad: x>=4?"moderado":"normal"}; },
  referencia:"Garrett S, et al. J Rheumatol 1994 (BASDAI original)."
},
{
  id:"basg", nombre:"Score global BAS-G", categoria:"reumatologia",
  resumen:"Percepción global de bienestar del paciente con espondiloartritis.",
  campos:[
    {id:"semana", label:"Bienestar durante la última semana", tipo:"num", unidad:"0-10", min:0, max:10, step:0.5, default:3},
    {id:"meses", label:"Bienestar durante los últimos 6 meses", tipo:"num", unidad:"0-10", min:0, max:10, step:0.5, default:3},
  ],
  calcular(v){ return {valor:+((v.semana+v.meses)/2).toFixed(1), unidad:"/10"}; },
  interpretar(){ return {texto:"Mayor puntaje indica peor percepción global de bienestar", severidad:"info"}; },
  referencia:"Jones SD, et al. Bath Ankylosing Spondylitis Global Score."
},
// ---------- ONCOLOGÍA (pediátrica) ----------
{
  id:"chips", nombre:"CHIPS (pronóstico de linfoma de Hodgkin pediátrico)", categoria:"pediatria",
  resumen:"Factores de riesgo asociados a menor supervivencia libre de eventos.",
  campos:[
    {id:"estadio4", label:"Estadio IV", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"bulky", label:"Adenopatía mediastínica voluminosa (bulky)", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"albumina", label:"Albúmina <3.5 g/dL", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
    {id:"fiebre", label:"Fiebre (síntoma B)", tipo:"bool", opciones:[{value:"1",label:"Sí"},{value:"0",label:"No"}]},
  ],
  calcular(v){ return {valor: sumaCampos(v), unidad:"/4 factores"}; },
  interpretar(x){
    return {texto: x===0 ? "Sin factores de riesgo CHIPS — mejor pronóstico relativo" : `${x} factor(es) de riesgo presentes — supervivencia libre de eventos progresivamente menor; consultar tabla del protocolo cooperativo`, severidad: x===0?"normal":"moderado"};
  },
  referencia:"Schwartz CL, et al. CHIPS score, modelo pronóstico pediátrico. Validar contra el protocolo del grupo cooperativo tratante."
},
];

if (typeof module !== "undefined") module.exports = { CALCS2 };
