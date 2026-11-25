# Gold Trading PWA v7 - Cotización activa y alto contraste

Esta entrega actualiza la PWA existente sin cambiar `math.js` ni sus fórmulas comerciales. Gold-API se consulta cada 30 segundos; el último precio real se guarda localmente para operar sin conexión. El campo ONZA de cada calculadora alterna cada 2 segundos entre la cotización auténtica y una variación calculada desde esa base. No se muestra una tarjeta aparte para la cotización. Las dos calculadoras y sus resultados utilizan el mismo valor activo.

## Cambios visuales

- Amarillo intenso `#FFCC00` con texto negro, campos y botones delimitados, cifras grandes y una interfaz oscura de fondos grafito y texto claro.
- El tema se puede elegir como Sistema, Claro u Oscuro en Preferencias. Sistema sigue `prefers-color-scheme`; la selección se guarda localmente.
- Campos de las calculadoras con valores grandes y botones más fáciles de tocar.
- Resultados con un valor principal de ~44–50 px y el fondo local `images/results-gold.png`, que reemplaza los lingotes SVG anteriores y se adapta a la tarjeta con `background-size: cover`. Una capa oscura suave ayuda a mantener el contraste del texto.
- Tablas agrupadas en 99–90, 89–80, 79–70, 69–60 y 59–50, de dos en dos en pantallas móviles. Los precios se muestran a 18 px en el tamaño de referencia (440 CSS px), con 17 px en pantallas más estrechas; en pantallas excepcionalmente pequeñas se ajustan para evitar cortes.
- Se utilizan fuentes e imágenes locales. La única consulta externa obtiene la cotización XAU/USD; los cálculos siguen ejecutándose en el dispositivo.

## Archivos y funcionamiento

- `app.js`: una cotización activa compartida actualiza los campos de ONZA en ambas calculadoras y vuelve a ejecutar los cálculos cada vez que cambia. La etiqueta discreta `Simulado` aparece junto al campo principal solo en los intervalos artificiales. Sin internet conserva el último precio real, indica que está sin actualizar y deja la simulación suspendida.
- `math.js`: fórmulas, redondeo, rangos de ley y tabla con las 50 leyes.
- `sw.js`: caché `goldtrading-offline-v9`. La navegación revalida la página en red y usa la copia local sin conexión; los recursos se preparan antes de activar el Service Worker nuevo y se eliminan las cachés antiguas de Gold Trading.
- `manifest.webmanifest`: instalación PWA `standalone` con los iconos actualizados.
- `icons/`: iconos de la PWA creados desde el logo Banco de los Mineros.

El diseño se encuentra en `index.html` y `styles.css`; el fondo está en `images/`. No se añadieron ventas, historial, registros ni base de datos.

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

1. En Vercel, seguir la sección de publicación. En otro alojamiento, ejecutar `node scripts/build.js` y publicar el contenido de `public/` por HTTPS, manteniendo su estructura.
2. Abrir la URL desde Safari en el iPhone con internet.
3. Usar **Compartir → Añadir a pantalla de inicio → Abrir como app**.
4. Abrir Gold Trading desde su ícono con internet. En Preferencias comprobar que el estado `Uso sin conexión` indique que los archivos estén preparados y revisar el resultado real de `Almacenamiento persistente`. El permiso persistente depende de iOS.
5. Para la prueba física, activar modo avión, cerrar la app completamente y reabrirla. Confirmar acceso, ambas calculadoras y la tabla. Después, reiniciar el iPhone todavía en modo avión y repetir.

**ACTUALIZACIÓN DE UNA INSTALACIÓN EXISTENTE:** publica los archivos actualizados y abre la PWA con conexión. El navegador instala el Service Worker v9, que activa la caché nueva tras precargar los archivos. Vuelve a abrirla y comprueba el estado de uso sin conexión en Preferencias. La actualización no borra las preferencias ni el acceso local; conserva los datos del sitio.

## Validación realizada

- `node tests/test_math.js`: 124 validaciones matemáticas y de formato.
- `node tests/test_package.js`: estructura, instalación standalone, acceso y preferencias.
- `node tests/test_sw.js`: precarga de recursos, incluida la imagen, navegación y fallback offline.
- `node tests/test_status.js`: 17 escenarios simulados de caché y persistencia.

La prueba de navegador cubre cotización simulada mediante una respuesta Gold-API controlada, cálculos, tema, caché y reapertura sin conexión. Las pruebas automatizadas no sustituyen la comprobación visual en Safari/iPhone ni la prueba física en iPhone.

## Publicar en Vercel

1. Importar `Miau44/Gold-Trading-iOS` desde GitHub y usar la rama `main`.
2. Usar Framework Preset **Other**, Root Directory en la raíz del repositorio y no añadir variables de entorno ni servicios.
3. `vercel.json` configura Build Command `node scripts/build.js` y Output Directory `public`. No se necesita instalar dependencias para compilar ni ejecutar la aplicación.
4. Publicar y usar una URL HTTPS de producción estable. No usar como instalación definitiva una URL temporal de preview ni una URL que exija iniciar sesión en Vercel.
5. El build publica únicamente los 10 archivos de la PWA. Las pruebas, la documentación, los scripts de desarrollo y `.vscode` quedan fuera del directorio publicado.
6. Los encabezados permiten revalidar archivos al publicar; el Service Worker mantiene la ejecución offline desde la caché v9. En cada cambio futuro de recursos publicados, incrementar la versión de caché en `sw.js`, `app.js` y las pruebas correspondientes.

La imagen y los archivos de la aplicación se descargan durante la preparación inicial; las siguientes aperturas pueden usar la caché local. No hay librerías de ejecución ni analítica. La conexión externa se utiliza únicamente para consultar el precio del oro; los cálculos se ejecutan en el dispositivo y siguen disponibles sin internet.

## Comprobación obligatoria en el iPhone de destino

1. Anotar el modelo y la versión exacta de iOS. Abrir la URL HTTPS de producción en Safari con conexión, fuera de navegación privada.
2. Usar Compartir → Añadir a pantalla de inicio. Si aparece **Abrir como app**, dejarlo activado. Abrir Gold Trading desde ese icono; la instalación debe abrir sin la barra de Safari.
3. Entrar con `admin` / `admin123` en una instalación nueva. Cambiar la contraseña en Preferencias y configurar los valores que utilizará ese dispositivo.
4. Mantener la app abierta con conexión hasta que Preferencias muestre **Archivos preparados**. Revisar **Almacenamiento persistente**: solo **Concedido** confirma que iOS aceptó la solicitud; una denegación no se oculta ni se presenta como éxito.
5. Activar modo avión y apagar también Wi-Fi. Cerrar la app completamente, volver a abrirla desde su icono y entrar con la contraseña cambiada. Comprobar ambas calculadoras, CALCULAR, LIMPIAR, las 50 leyes y el fondo de resultados.
6. Reiniciar el iPhone manteniendo modo avión y Wi-Fi apagado. Después del primer desbloqueo, abrir la app sin reconectar. Repetir acceso y cálculos; confirmar los valores predeterminados y la contraseña guardados.
7. Repetir la instalación en cada iPhone nuevo. La primera descarga requiere conexión y no depende de otro teléfono. Las preferencias y la contraseña son locales a cada instalación; no existe sincronización ni transferencia mediante servidor.

El diseño usa tamaños adaptables y áreas seguras de pantalla, sin detectar modelos concretos. La compatibilidad depende de Safari/iOS y sus APIs; un modelo futuro debe verificarse cuando se disponga del dispositivo. El acceso existente es un bloqueo local, no una cuenta remota.

La aplicación solicita persistencia mediante `navigator.storage.persist()` y vuelve a comprobarla con `navigator.storage.persisted()`. WebKit decide la concesión según sus criterios, incluida la apertura como app de pantalla de inicio. No se puede garantizar conservación indefinida si se borran los datos del sitio, se elimina la instalación o el sistema retira almacenamiento no persistente. No borrar datos para actualizar la PWA.

Referencias: [almacenamiento en WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/), [instalación en iPhone](https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios), [configuración de Vercel](https://vercel.com/docs/project-configuration/vercel-json).

## Prueba de navegador realizada el 12 de noviembre de 2026

Se verificó el paquete `public/` en Chromium y WebKit de escritorio automatizados: recarga sin red, cierre completo del navegador y nueva apertura con el mismo perfil sin red, contraseña cambiada y preferencias conservadas, ambas calculadoras y fondo offline, instalación independiente en otro perfil y 10 recursos precargados. No se observaron peticiones externas ni errores JavaScript. Se comprobaron anchos de 320, 375, 393, 440, 480, 768 y 956 CSS px sin desbordamiento horizontal, incluido formato horizontal.

La actualización de la tabla de 50 leyes tuvo una mediana inferior a 1 ms en el equipo de pruebas. Esta medición no incluye el repintado ni representa el rendimiento medido en un iPhone. Reiniciar un navegador no equivale a reiniciar iOS: la prueba física anterior sigue pendiente, al igual que la comprobación de la URL publicada y sus encabezados HTTPS.

## Cambios de esta actualización

- El precio activo alterna de forma determinista: base en el segundo 0, variación de ±USD 0,01–1,00 en el segundo 2, base exacta en el segundo 4. Cada variación usa el último precio auténtico como base, nunca la artificial anterior. La etiqueta `Simulado` desaparece al regresar a la base.
- Tanto el campo ONZA de la calculadora como el de la tabla comparten el precio activo y son de solo lectura cuando hay cotización real. Sus fórmulas recalculan en cada alternancia. El temporizador se detiene en segundo plano, sin internet o cuando la última cotización ya tiene más de un minuto; Gold-API mantiene su intervalo de 30 segundos.
- La apariencia ofrece Sistema/Claro/Oscuro y guarda la elección. Los temas usan fondo claro con texto negro o grafito `#171C24`, tarjetas `#252D38` y texto claro, con controles amarillos `#FFCC00` de texto negro. El Service Worker sube a v9 para instalar el HTML, CSS y código nuevos y eliminar cachés anteriores.

En la validación de esta actualización, `node tests/test_math.js`, `node tests/test_package.js`, `node tests/test_sw.js` y `node tests/test_status.js` pasaron. La prueba de Chromium fija la cotización base en USD 3.552,90 y comprueba el ciclo USD 3.552,90 → 3.553,28 → 3.552,90 → 3.551,90 → 3.552,90. Después simula una nueva respuesta auténtica de USD 3.600,50 y comprueba que la siguiente variación es USD 3.600,88. En cada paso ambas calculadoras recalculan con los campos de descuento, cotización del dólar y ley especificados. También verifica que no existe tarjeta de cotización separada ni línea de fuente/fecha, ambos temas, los anchos móviles/escritorio, la suspensión offline y la purga de v8 al activar v9. La sesión completa hizo cuatro consultas controladas: inicio, actualización auténtica solicitada por el test y apertura de dos perfiles nuevos; los ticks de 2 segundos no generaron solicitudes. Playwright WebKit no completó el recorrido automatizado; Safari en iPhone y la URL de Vercel deben comprobarse en sus dispositivos/entorno publicados.

Para repetir la prueba de navegador en Windows, instalar Playwright fuera del proyecto y ejecutar con el servidor local de `public/` activo:

```powershell
node scripts/build.js
# En otra terminal: python -m http.server 8080 --bind 127.0.0.1 --directory public
$testTools = Join-Path $env:TEMP 'gold-trading-browser-tools'
npm install --prefix $testTools playwright --no-audit --no-fund
node "$testTools/node_modules/playwright/cli.js" install chromium webkit
$env:PWA_PLAYWRIGHT_MODULE = "$testTools/node_modules/playwright"
$env:PWA_BROWSER = 'chromium'
node tests/test_browser.cjs
$env:PWA_BROWSER = 'webkit'
node tests/test_browser.cjs
```

Opcionalmente, configurar `PWA_TEST_URL` con la URL de producción para verificar el despliegue. La prueba utiliza perfiles temporales propios y no necesita datos reales del jefe. Playwright se usa únicamente en desarrollo y no se publica con la aplicación.
