// Algoritmos clínicos resumidos, paso a paso (guía rápida, no reemplaza protocolos institucionales).
const ALGOS = [
{
  id:"sepsis", nombre:"Sepsis — Bundle de la primera hora", categoria:"Infectología",
  pasos:[
    "Medir lactato sérico; repetir si inicial >2 mmol/L.",
    "Obtener hemocultivos (2 sets) antes de iniciar antibióticos.",
    "Administrar antibióticos de amplio espectro dentro de la primera hora.",
    "Iniciar cristaloides 30 mL/kg si hipotensión o lactato ≥4 mmol/L.",
    "Iniciar vasopresores (noradrenalina de primera línea) si hipotensión persiste durante/después de la reanimación con fluidos, meta PAM ≥65 mmHg.",
    "Reevaluar volemia y perfusión tisular frecuentemente (examen clínico, lactato seriado, llene capilar).",
  ],
  nota:"Surviving Sepsis Campaign 2021 (Hour-1 Bundle)."
},
{
  id:"hiperk", nombre:"Hiperkalemia — manejo de urgencia", categoria:"Nefrología",
  pasos:[
    "Confirmar con ECG: ondas T picudas, ensanchamiento QRS, pérdida de onda P, patrón sinusoidal.",
    "Estabilizar membrana: gluconato de calcio 10% EV si hay cambios ECG (inicio en minutos, dura ~30-60 min).",
    "Redistribuir K⁺ intracelular: insulina cristalina EV + glucosa (evitar hipoglucemia), y/o salbutamol nebulizado en dosis altas.",
    "Considerar bicarbonato de sodio EV si acidosis metabólica concomitante.",
    "Eliminar K⁺ del organismo: diuréticos de asa si función renal preservada, resinas de intercambio (inicio más lento), o hemodiálisis si falla renal o hiperkalemia refractaria/grave.",
    "Buscar y tratar la causa (falla renal, fármacos IECA/ARA2/IAM, acidosis, lisis celular).",
    "Monitorización continua ECG y controles seriados de potasio.",
  ],
  nota:"Manejo estándar de urgencia; adaptar según severidad ECG y disponibilidad de diálisis."
},
{
  id:"cad", nombre:"Cetoacidosis diabética — manejo inicial", categoria:"Endocrinología",
  pasos:[
    "Confirmar diagnóstico: glucosa >250 mg/dL, pH <7.3 o HCO₃⁻ <18, cetonemia/cetonuria positiva.",
    "Fluidoterapia: SF 0.9% 15–20 mL/kg en la primera hora, luego ajustar según sodio corregido y estado hemodinámico.",
    "Potasio: si K⁺ <3.3 mEq/L, reponer ANTES de insulina; si K⁺ 3.3–5.3, agregar K⁺ a los fluidos; si >5.3, no reponer aún.",
    "Insulina: iniciar infusión EV continua 0.1 U/kg/h SOLO después de confirmar K⁺ ≥3.3 mEq/L.",
    "Cuando glucosa llegue a ~200-250 mg/dL, agregar dextrosa a los fluidos y continuar insulina hasta resolver la cetoacidosis (anion gap normal).",
    "Buscar el factor precipitante (infección, omisión de insulina, IAM, etc.).",
    "Transición a insulina subcutánea solo cuando el paciente tolere vía oral y la cetoacidosis esté resuelta (superponer 1-2 h con la infusión EV).",
  ],
  nota:"Adaptar metas según guías locales; vigilar edema cerebral en pediatría."
},
{
  id:"scacest", nombre:"SCA con elevación del ST — ventana de reperfusión", categoria:"Cardiología",
  pasos:[
    "ECG de 12 derivaciones dentro de los primeros 10 minutos del contacto médico.",
    "Doble antiagregación: AAS 300 mg + inhibidor P2Y12 (según protocolo local), salvo contraindicación.",
    "Angioplastia primaria (ICP): meta puerta-balón ≤90 min si el centro tiene hemodinamia disponible.",
    "Si no hay ICP disponible en <120 min desde el primer contacto: fibrinólisis, meta puerta-aguja ≤30 min (si no hay contraindicaciones).",
    "Anticoagulación concomitante según estrategia de reperfusión elegida.",
    "Traslado a centro con hemodinamia para angioplastia de rescate si la fibrinólisis falla (persistencia de elevación ST >50% a los 60-90 min).",
  ],
  nota:"Guías ESC/AHA de manejo del IAM con elevación del ST."
},
{
  id:"acv", nombre:"ACV isquémico — ventana terapéutica", categoria:"Neurología",
  pasos:[
    "Confirmar hora de inicio de síntomas (o última vez visto normal).",
    "TAC de cerebro sin contraste urgente para descartar hemorragia.",
    "Trombolisis EV (alteplasa/tenecteplasa): ventana hasta 4.5 h desde el inicio de síntomas, según criterios de inclusión/exclusión.",
    "Trombectomía mecánica: ventana hasta 6 h (y hasta 24 h en casos seleccionados con perfusión favorable) si oclusión de gran vaso.",
    "Control estricto de presión arterial: <185/110 mmHg antes de trombolisis; <180/105 mmHg las primeras 24 h post-trombolisis.",
    "NIHSS al ingreso y reevaluaciones seriadas; evitar hipotensión, hiperglucemia e hipertermia.",
  ],
  nota:"AHA/ASA Guidelines for Early Management of Acute Ischemic Stroke."
},
{
  id:"anafilaxia", nombre:"Anafilaxia — manejo inmediato", categoria:"Urgencias",
  pasos:[
    "Reconocer: inicio agudo con compromiso cutáneo/mucoso + compromiso respiratorio y/o cardiovascular (o exposición a alérgeno conocido + hipotensión).",
    "Adrenalina IM 0.01 mg/kg (máx. 0.5 mg adulto / 0.3 mg niño) en cara anterolateral del muslo — de PRIMERA línea, sin retrasar.",
    "Repetir adrenalina IM cada 5-15 min si no hay respuesta.",
    "Posición supina con elevación de EEII (o sentado si disnea predomina), oxígeno suplementario.",
    "Volumen: cristaloides EV en bolo si hipotensión.",
    "Terapias adyuvantes (no de primera línea): antihistamínicos y corticoides — no reemplazan la adrenalina.",
    "Observar mínimo 4-6 h por riesgo de reacción bifásica; considerar adrenalina EV en infusión si refractario.",
  ],
  nota:"WAO/AAAAI guidelines de anafilaxia."
},
{
  id:"statusep", nombre:"Estatus epiléptico — secuencia de fármacos", categoria:"Neurología",
  pasos:[
    "Minuto 0-5 (estabilización): ABC, oxígeno, glucemia capilar, vía EV, monitorización.",
    "Minuto 5-20 (terapia inicial): benzodiazepina — lorazepam 0.1 mg/kg EV, o diazepam EV, o midazolam IM si no hay vía EV.",
    "Minuto 20-40 (terapia de segunda línea) si persiste: fenitoína/fosfenitoína, ácido valproico o levetiracetam EV (dosis de carga).",
    "Minuto 40+ (estatus refractario): considerar anestesia general con infusión continua (midazolam, propofol o pentobarbital) e ingreso a UCI con monitorización EEG continua.",
    "Buscar y tratar la causa (hipoglucemia, tóxicos, infección de SNC, suspensión de fármacos antiepilépticos).",
  ],
  nota:"Guideline de la American Epilepsy Society 2016."
},
{
  id:"acls", nombre:"RCP avanzada — algoritmo de paro cardíaco (ACLS)", categoria:"Urgencias",
  pasos:[
    "Confirmar paro (no responde, no respira o gasping, sin pulso) e iniciar RCP de alta calidad (compresiones 100-120/min, profundidad 5-6 cm, permitir reexpansión completa).",
    "Conectar monitor/desfibrilador y analizar ritmo cada 2 minutos.",
    "Ritmo desfibrilable (FV/TVSP): desfibrilar de inmediato, reanudar RCP 2 min, luego adrenalina 1 mg EV cada 3-5 min y amiodarona/lidocaína tras la 3ª descarga sin respuesta.",
    "Ritmo no desfibrilable (asistolia/AESP): RCP continua, adrenalina 1 mg EV cada 3-5 min tan pronto como sea posible, buscar causas reversibles.",
    "Buscar y tratar las 'H y T': hipovolemia, hipoxia, hidrogeniones (acidosis), hipo/hiperkalemia, hipotermia — taponamiento, neumotórax a tensión, tóxicos, trombosis (coronaria/pulmonar).",
    "Considerar vía aérea avanzada y capnografía para verificar calidad de RCP y retorno de circulación espontánea (ROSC).",
    "Cuidados post-paro: control de temperatura objetivo, optimizar oxigenación/PA, ECG y estudio de la causa.",
  ],
  nota:"AHA Guidelines for CPR and ECC, actualización vigente."
},
{
  id:"viaAerea", nombre:"Vía aérea difícil — checklist previo a intubación", categoria:"Urgencias",
  pasos:[
    "Evaluar predictores de vía aérea difícil (Mallampati, distancia tiromentoniana, apertura bucal, movilidad cervical, LEMON).",
    "Preparar equipo: laringoscopio (directo y videolaringoscopio disponible), tubos de distinto calibre, dispositivo supraglótico de rescate, set de cricotiroidotomía.",
    "Preoxigenar 3-5 min con O₂ al 100% (considerar cánula nasal de alto flujo apneica).",
    "Preparar fármacos de secuencia rápida (inductor + relajante muscular) y drogas de rescate hemodinámico.",
    "Asignar roles del equipo y plan de rescate ante fallo (algoritmo de vía aérea difícil: hasta 2 intentos de laringoscopia, luego dispositivo supraglótico, luego vía aérea quirúrgica si 'no intubable, no oxigenable').",
    "Confirmar posición del tubo: capnografía continua, auscultación bilateral, radiografía de tórax.",
  ],
  nota:"Difficult Airway Society (DAS) Guidelines."
},
{
  id:"transfusion", nombre:"Transfusión masiva — protocolo", categoria:"Trauma",
  pasos:[
    "Activar protocolo ante hemorragia masiva (ej. requerimiento estimado >4 UGR en 1 h o inestabilidad hemodinámica persistente).",
    "Transfundir en proporción balanceada 1:1:1 (glóbulos rojos : plasma fresco congelado : plaquetas).",
    "Administrar ácido tranexámico precozmente (idealmente <3 h desde el trauma).",
    "Corregir hipocalcemia (citrato de las transfusiones) con gluconato/cloruro de calcio.",
    "Evitar la tríada letal: hipotermia, acidosis y coagulopatía — recalentar activamente al paciente.",
    "Monitorizar con pruebas de coagulación (incluyendo viscoelásticas si disponibles) y reevaluar necesidad de continuar el protocolo.",
    "Buscar control definitivo del sangrado (quirúrgico, endoscópico o angioembolización) en paralelo a la reanimación.",
  ],
  nota:"Basado en recomendaciones ATLS y protocolos de transfusión masiva en trauma."
},
];

if (typeof module !== "undefined") module.exports = { ALGOS };
