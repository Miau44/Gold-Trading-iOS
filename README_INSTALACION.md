# Gold Trading PWA — versión 2 · calculadora individual + tabla completa

Aplicación web instalable (PWA) basada en la calculadora de tasación del programa Windows.

## Alcance
- Tasación de oro por onza USD, descuento, cotización USD/BOB, ley y peso en gramos.
- Precios por gramo y totales en USD y BOB.
- Segunda calculadora independiente con cotización, porcentaje, onza y ley, y tabla de 50 precios por gramo en bolivianos de ley 99 a 50. Reproduce las cifras de la captura de Windows para onza 2000, dólar 7,96 y porcentaje 0.
- Sin compras, ventas, registros, consultas en línea, historial ni base de datos.
- Sin dependencias externas, frameworks, fuentes web ni llamadas a servidores de cotizaciones.
- Valores iniciales de la app Windows: onza 2000 USD y cotización 6.96 Bs (NO son precios actuales).

## Fórmula principal
- USD/g = (onza USD / 31.1035) × (ley / 100) × ((100 - descuento) / 100).
- Bs/g = USD/g × cotización.
- Totales = valor por gramo × gramos.
- Ley válida: 50 a 99.99; descuento: 0 a 100.
- Los resultados se muestran con 2 decimales.
- Tabla de leyes: Bs/g = (onza USD / 31.1035) × (ley / 100) × ((100 - porcentaje) / 100) × cotización.
- La ley elegida en la segunda calculadora se destaca en la tabla, sin ocultar ninguna de las 50 filas.
- La segunda sección arranca con valores independientes: cotización 7,96, porcentaje 0, onza 2000, ley 99.

## Probar en Windows
No abras `index.html` mediante `file://` para probar el offline: los Service Workers requieren HTTPS o localhost.

Con Python instalado, desde esta carpeta ejecuta:

```sh
python -m http.server 8000
```

Abre http://localhost:8000 en Chrome/Edge. Los cálculos ya funcionan sin servidor: la conexión solo se usa para cargar el sitio inicialmente. Para verificar la caché, visita la app, espera a que su Service Worker esté activo, desactiva la red y recarga.

## Instalar en iPhone
1. Publica el **contenido** de esta carpeta (no el ZIP) en un alojamiento estático HTTPS propio. Es necesario un URL HTTPS accesible para la primera instalación y recuperaciones.
2. En iPhone, abre la dirección con Safari, toca Compartir → Añadir a pantalla de inicio, habilita **Abrir como app** y pulsa Añadir.
3. Abre Gold Trading **con conexión** para permitir guardar la caché completa (una vez).
4. Activa **Modo avión**, cierra completamente Gold Trading y vuelve a abrirla. Realiza algunos cálculos.
5. Reinicia el iPhone aún sin internet y repite la prueba. Este último paso debe ejecutarse en un iPhone real, no se puede validar desde el entorno de desarrollo.
6. Al pasar a otro iPhone, repite la instalación desde el mismo enlace; no se asume transferencia automática de caché offline.

## Almacenamiento persistente y advertencia
El código invoca `navigator.storage.persist()` cuando está disponible y verifica el resultado con `navigator.storage.persisted()`. WebKit puede negar esa solicitud por heurísticas. Incluso si se solicita persistencia, no puede garantizarse que el iPhone conserve eternamente archivos locales tras acciones del usuario o cambios del sistema. Si iOS borra el caché, Gold Trading necesitará conectarse al alojamiento HTTPS para recuperar los archivos.

## Entrega
**Versión 2:** fórmulas reconstruidas con base en los artefactos de Gold Trading Windows y revisión Swift de noviembre 2026. Antes de entregar al jefe, compara resultados y etiquetas en la app original, y valida en un iPhone real. No incluye servicios de alojamiento ni dominio. No recopila datos ni hace llamadas a API.

## Comprobación contra la captura de Windows
Para ONZA=2000, PORCENTAJE=0 y COT. DÓLAR=7,96, deben aparecer estos valores por ley:

| Ley | Precio Bs/g |
|---|---:|
|99|506,72|
|90|460,66|
|80|409,47|
|70|358,29|
|60|307,10|
|50|255,92|

El porcentaje se implementa como descuento sobre el precio de referencia. La captura proporcionada muestra 0%; si la versión de escritorio utiliza el campo "Porcentaje" con otra regla en la tabla, comprobar un caso distinto de cero antes de dar por validada esa particularidad.
