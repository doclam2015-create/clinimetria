# Clinimetría

App web (PWA) instalable en iOS: calculadoras clínicas, valores normales, escalas y algoritmos de manejo.

## Contenido

- **41 calculadoras** de fórmulas fisiológicas y escalas/scores clínicos, organizadas en 13 categorías: fórmulas y fisiología, urgencias y triage, cardiología, neurología, respiratorio, nefrología, gastroenterología, endocrino y nutrición, obstetricia, pediatría, trauma, infectología/sepsis y anticoagulación/hemostasia.
  - Fórmulas: IMC, superficie corporal, Cockcroft-Gault, CKD-EPI 2021, anion gap corregido, osmolaridad plasmática, sodio corregido, calcio corregido, déficit de agua libre, Holliday-Segar, Parkland, QTc (Bazett/Fridericia), PaO₂/FiO₂, gradiente A-a, FeNa, FeUrea, índice de choque, PAM, fórmula de Winter, gasto energético basal.
  - Escalas: Glasgow (GCS), NEWS2, qSOFA, SOFA, CURB-65, CHA₂DS₂-VASc, HAS-BLED, Wells (TVP/TEP), PERC, Child-Pugh, MELD-Na, Ranson, Glasgow-Blatchford, ABCD2, Centor/McIsaac, APGAR, Bishop, Killip, TIMI, Charlson.
- **Valores normales de referencia**: hemograma, coagulación, bioquímica, electrolitos, gases arteriales, perfil hepático, perfil lipídico, función tiroidea, marcadores cardíacos, orina, LCR y signos vitales (adulto y pediátrico).
- **10 algoritmos clínicos** paso a paso: sepsis (bundle 1h), hiperkalemia, cetoacidosis diabética, SCA con elevación ST, ACV isquémico, anafilaxia, estatus epiléptico, RCP avanzada (ACLS), vía aérea difícil, transfusión masiva.

Cada calculadora muestra el resultado en vivo con un código de color según severidad, y cita su referencia bibliográfica.

## Uso

https://doclam2015-create.github.io/clinimetria/

Instalable desde Safari ("Compartir" → "Agregar a inicio"). Funciona sin conexión.

## Aviso

Herramienta de apoyo clínico. No reemplaza el juicio médico ni los protocolos institucionales vigentes.

## Estructura

- `calcs.js` — motor y definiciones de las 41 calculadoras (fórmulas + scores).
- `refs.js` — tablas de valores normales de referencia.
- `algos.js` — algoritmos de manejo paso a paso.
- `app.js` — renderizado, búsqueda global y lógica de la interfaz.
- `manifest.json`, `sw.js`, íconos — soporte PWA offline.
