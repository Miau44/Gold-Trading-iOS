# Gold Trading PWA v5 - Rediseño premium iPhone 17 Pro Max

Esta entrega parte **directamente de Gold Trading PWA v4**. El rediseño actualiza la presentación de la pantalla posterior al inicio de sesión: encabezado, navegación, tarjetas de calculadoras, tarjeta de resultados, tablas 99–50 y pie de página. La pantalla de inicio de sesión y el contenido de Preferencias no se modificaron.

## Cambios visuales

- Estilo premium azul medianoche, gris perla y dorado; tarjetas claras, sombras suaves y navegación segmentada.
- Campos de las calculadoras con valores grandes y botones más fáciles de tocar.
- Resultados con un valor principal de ~44–50 px y el fondo local `images/results-gold.png`, que reemplaza los lingotes SVG anteriores y se adapta a la tarjeta con `background-size: cover`. Una capa oscura suave ayuda a mantener el contraste del texto.
- Tablas agrupadas en 99–90, 89–80, 79–70, 69–60 y 59–50, de dos en dos en pantallas móviles. Los precios se muestran a 18 px en el tamaño de referencia (440 CSS px), con 17 px en pantallas más estrechas; en pantallas excepcionalmente pequeñas se ajustan para evitar cortes.
- Se utilizan fuentes del sistema: no hay dependencias de red para fuentes, gráficos o cálculos.

## Archivos y funcionamiento

- `app.js`: conserva cálculos, navegación y autenticación; comprueba la caché v6, incluidos imagen, manifiesto e iconos, entre los recursos necesarios para el estado offline.
- `math.js`: fórmulas, redondeo, rangos de ley y tabla con las 50 leyes.
- `sw.js`: caché `goldtrading-offline-v6`, con la nueva imagen precargada. Conserva la estrategia `cache-first` y elimina las cachés antiguas de Gold Trading al activarse.
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

1. En Vercel, seguir la sección de publicación. En otro alojamiento, ejecutar `node scripts/build.js` y publicar el contenido de `public/` por HTTPS, manteniendo su estructura.
2. Abrir la URL desde Safari en el iPhone con internet.
3. Usar **Compartir → Añadir a pantalla de inicio → Abrir como app**.
4. Abrir Gold Trading desde su ícono con internet. En Preferencias comprobar que el estado `Uso sin conexión` indique que los archivos estén preparados y revisar el resultado real de `Almacenamiento persistente`. El permiso persistente depende de iOS.
5. Para la prueba física, activar modo avión, cerrar la app completamente y reabrirla. Confirmar acceso, ambas calculadoras y la tabla. Después, reiniciar el iPhone todavía en modo avión y repetir.

**ACTUALIZACIÓN DE UNA INSTALACIÓN EXISTENTE:** publica también la carpeta `images/` y abre la aplicación con conexión para instalar el Service Worker con caché v6. Después vuelve a abrirla y comprueba el estado de uso sin conexión en Preferencias. La actualización no borra las preferencias ni el acceso local; evita borrar los datos del sitio si deseas conservarlos.

## Validación realizada

- `node tests/test_math.js`: 124 validaciones matemáticas y de formato.
- `node tests/test_package.js`: estructura, instalación standalone, acceso y preferencias.
- `node tests/test_sw.js`: precarga de recursos, incluida la imagen, navegación y fallback offline.
- `node tests/test_status.js`: 17 escenarios simulados de caché y persistencia.

Las pruebas automatizadas no sustituyen la comprobación visual en Safari/iPhone ni la prueba física de reapertura sin conexión.

## Publicar en Vercel

1. Importar `Miau44/Gold-Trading-iOS` desde GitHub y usar la rama `main`.
2. Usar Framework Preset **Other**, Root Directory en la raíz del repositorio y no añadir variables de entorno ni servicios.
3. `vercel.json` configura Build Command `node scripts/build.js` y Output Directory `public`. No se necesita instalar dependencias para compilar ni ejecutar la aplicación.
4. Publicar y usar una URL HTTPS de producción estable. No usar como instalación definitiva una URL temporal de preview ni una URL que exija iniciar sesión en Vercel.
5. El build publica únicamente los 10 archivos de la PWA. Las pruebas, la documentación, los scripts de desarrollo y `.vscode` quedan fuera del directorio publicado.
6. Los encabezados permiten revalidar archivos al publicar; el Service Worker mantiene la ejecución offline desde la caché v6. En cada cambio futuro de recursos publicados, incrementar la versión de caché en `sw.js`, `app.js` y las pruebas correspondientes.

El paquete actual ocupa aproximadamente 2,15 MB sin compresión HTTP. La imagen se descarga durante la preparación inicial; las siguientes aperturas pueden usar la caché local. No hay fuentes remotas, librerías de ejecución, analítica ni consultas de cotizaciones. Las cotizaciones se introducen manualmente y los cálculos se ejecutan en el dispositivo.

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
