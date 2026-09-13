# Clinimetría

App web (PWA) instalable en iOS: calculadoras clínicas, valores normales, escalas y algoritmos de manejo.

## Contenido

- **103 calculadoras** de fórmulas fisiológicas y escalas/scores clínicos, en 15 categorías: fórmulas y fisiología, urgencias y triage, cardiología, neurología, respiratorio, nefrología, gastroenterología, endocrino y nutrición, obstetricia, pediatría, trauma, infectología/sepsis, anticoagulación/hemostasia, fármacos/conversiones y reumatología.
  - Entre otras: IMC, superficie corporal, peso ideal (Devine), talla diana, Cockcroft-Gault, CKD-EPI 2021, Schwartz pediátrico, anion gap, osmolaridad, correcciones de sodio/calcio, déficit de agua libre y de sodio, Parkland, QTc, PaO₂/FiO₂, índice SpO₂/FiO₂ (sustituto no invasivo con estimación de PaO₂ por curva de Severinghaus-Ellis y SOFA respiratorio), gradiente A-a, FeNa/FeUrea/FeMg, índice de choque, PAM, Winter, gasto energético basal, gasto cardíaco (Fick), reposición de potasio, insulina de corrección, velocidad de infusión de drogas EV, APACHE II, fechas obstétricas (FPP, concepción/ovulación), Ganzoni, conversión de corticoides y a unidades SI, índices hematimétricos, APRI, FIB-4, y las escalas Glasgow, NEWS2, qSOFA/SOFA, CURB-65, CHA₂DS₂-VASc, HAS-BLED, Wells (TVP/TEP), PERC, Child-Pugh, MELD-Na, Ranson, Glasgow-Blatchford, ABCD2, Centor/McIsaac, FeverPAIN, APGAR, Bishop, Killip, TIMI, Charlson, HEART, Alvarado, AIR, PAS, Kocher, Westley, FLACC, Bacterial Meningitis Score, Eckhardt, BASDAI, BAS-G y CHIPS.
- **Valores normales de referencia**: hemograma, coagulación, bioquímica, electrolitos, gases arteriales, perfil hepático, perfil lipídico, función tiroidea, marcadores cardíacos, orina, LCR, signos vitales (adulto y pediátrico), niveles terapéuticos de fármacos, fármacos a evitar en déficit de G6PD, requerimiento proteico por edad y categorías KDIGO de eGFR.
- **11 algoritmos clínicos** paso a paso: sepsis (bundle 1h), hiperkalemia, cetoacidosis diabética, SCA con elevación ST, ACV isquémico, código de ictus (activación), anafilaxia, estatus epiléptico, RCP avanzada (ACLS), vía aérea difícil, transfusión masiva.

Cada calculadora muestra el resultado en vivo con un código de color según severidad, y cita su referencia bibliográfica.

## Uso

https://doclam2015-create.github.io/clinimetria/

Instalable desde Safari ("Compartir" → "Agregar a inicio"). Funciona sin conexión.

## Aviso

Herramienta de apoyo clínico. No reemplaza el juicio médico ni los protocolos institucionales vigentes.

## Estructura

- `calcs.js` / `calcs2.js` — motor y definiciones de las 103 calculadoras (fórmulas + scores).
- `refs.js` — tablas de valores normales de referencia.
- `algos.js` — algoritmos de manejo paso a paso.
- `app.js` — renderizado, búsqueda global y lógica de la interfaz.
- `manifest.json`, `sw.js`, íconos — soporte PWA offline.
