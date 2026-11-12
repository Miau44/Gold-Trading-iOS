# Gold Trading PWA v5 - Rediseño premium iPhone 17 Pro Max

Esta entrega parte **directamente de Gold Trading PWA v4**. El rediseño actualiza la presentación de la pantalla posterior al inicio de sesión: encabezado, navegación, tarjetas de calculadoras, tarjeta de resultados, tablas 99–50 y pie de página. La pantalla de inicio de sesión y el contenido de Preferencias no se modificaron.

## Cambios visuales

- Estilo premium azul medianoche, gris perla y dorado; tarjetas claras, sombras suaves y navegación segmentada.
- Campos de las calculadoras con valores grandes y botones más fáciles de tocar.
- Resultados con un valor principal de ~44–50 px y el fondo local `images/results-gold.png`, que reemplaza los lingotes SVG anteriores y se adapta a la tarjeta con `background-size: cover`. Una capa oscura suave ayuda a mantener el contraste del texto.
- Tablas agrupadas en 99–90, 89–80, 79–70, 69–60 y 59–50, de dos en dos en pantallas móviles. Los precios se muestran a 18 px en el tamaño de referencia (440 CSS px), con 17 px en pantallas más estrechas; en pantallas excepcionalmente pequeñas se ajustan para evitar cortes.
- Se utilizan fuentes del sistema: no hay dependencias de red para fuentes, gráficos o cálculos.

## Archivos y funcionamiento

- `app.js`: conserva cálculos, navegación y autenticación; comprueba la caché v5 e incluye la imagen entre los recursos necesarios para el estado offline.
- `math.js`: fórmulas, redondeo, rangos de ley y tabla con las 50 leyes.
- `sw.js`: caché `goldtrading-offline-v5`, con la nueva imagen precargada. Conserva la estrategia `cache-first` y elimina las cachés antiguas de Gold Trading al activarse.
- `manifest.webmanifest`: instalación PWA `standalone` **sin modificaciones**.
- `icons/`: iconos originales **sin modificaciones**.

El diseño se encuentra en `index.html` y `styles.css`; el fondo está en `images/`. También se actualizaron la caché, su diagnóstico y las pruebas correspondientes. No se añadieron ventas, historial, registros, consultas, base de datos ni campos nuevos.

## Credenciales iniciales (si es una instalación nueva)

- Usuario: `admin`
- Contraseña: `admin123`

Cámbiala en Preferencias después del primer inicio de sesión. El bloqueo es local y no equivale a autenticación con servidor. Las preferencias y el verificador PBKDF2 se conservan localmente mientras el usuario/sistema no elimine el almacenamiento de la PWA.

## Revisar en Windows

1. Extraer completamente el ZIP.
2. Abrir la carpeta de Gold Trading en un terminal.
3. Para desarrollo, iniciar un servidor local, por ejemplo `python -m http.server 8080` y abrir `http://localhost:8080`.
4. Iniciar sesión, comprobar las dos calculadoras, la tabla de 50 leyes, Preferencias y navegación.
5. Con Node.js instalado, ejecutar `node tests/test_math.js`, `node tests/test_package.js`, `node tests/test_sw.js` y `node tests/test_status.js`.

## Instalar en iPhone

1. Publicar el **contenido completo** de la carpeta en un sitio HTTPS, manteniendo la estructura de archivos.
2. Abrir la URL desde Safari en el iPhone con internet.
3. Usar **Compartir → Añadir a pantalla de inicio → Abrir como app**.
4. Abrir Gold Trading desde su ícono con internet. En Preferencias comprobar que el estado `Uso sin conexión` indique que los archivos estén preparados y revisar el resultado real de `Almacenamiento persistente`. El permiso persistente depende de iOS.
5. Para la prueba física, activar modo avión, cerrar la app completamente y reabrirla. Confirmar acceso, ambas calculadoras y la tabla. Después, reiniciar el iPhone todavía en modo avión y repetir.

**ACTUALIZACIÓN DE UNA INSTALACIÓN EXISTENTE:** publica también la carpeta `images/` y abre la aplicación con conexión para instalar el Service Worker con caché v5. Después vuelve a abrirla y comprueba el estado de uso sin conexión en Preferencias. La actualización no borra las preferencias ni el acceso local; evita borrar los datos del sitio si deseas conservarlos.

## Validación realizada

- `node tests/test_math.js`: 124 validaciones matemáticas y de formato.
- `node tests/test_package.js`: estructura, instalación standalone, acceso y preferencias.
- `node tests/test_sw.js`: precarga de recursos, incluida la imagen, navegación y fallback offline.
- `node tests/test_status.js`: 8 escenarios simulados de caché y persistencia.

Las pruebas automatizadas no sustituyen la comprobación visual en Safari/iPhone ni la prueba física de reapertura sin conexión.
