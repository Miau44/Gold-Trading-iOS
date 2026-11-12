# Gold Trading PWA v3 - Calculadora Windows adaptada para iPhone

La versión actual contiene exactamente las funciones necesarias para el cliente:
- Inicio de sesión con usuario y contraseña local.
- Calculadora principal de precio por gramo (onza, porcentaje, dólar, ley).
- Segunda calculadora independiente con los precios de todas las leyes 99-50, sin descuento en los importes de referencia como en Windows.
- Preferencias de valores predeterminados.
- Cambio de contraseña desde Preferencias y cierre de sesión.

**No incluye:** peso de piezas, cálculo de total por peso, registros de compras/ventas, historial, consultas por internet, servidor de cálculo ni base de datos.

## Credenciales de la primera instalación

- Usuario inicial: `admin`
- Contraseña inicial: `admin123`

Estas son las credenciales predeterminadas encontradas en el ejecutable original de Windows. **Se recomienda cambiar la contraseña** en Preferencias después del primer acceso. La contraseña se guarda como un verificador PBKDF2-SHA256 con sal aleatoria en el almacenamiento del navegador, no en texto plano. Esto es un bloqueo local de uso individual y **no equivale a seguridad de autenticación con servidor**. Si se borran los datos de la PWA, las credenciales y las preferencias vuelven a su estado inicial. La contraseña configurada en otra instalación, incluido Windows, no se importa automáticamente.

## Cómo probar en Windows (sin Mac)

1. Descomprimir todo el ZIP en una carpeta.
2. Para revisar solo la interfaz y los cálculos, abrir `index.html` en un navegador compatible.
3. Para probar instalación PWA y caché offline, servir la carpeta por HTTP en `localhost`, por ejemplo:
   `python -m http.server 8080`
4. Abrir `http://localhost:8080`, iniciar sesión y comprobar las dos calculadoras y Preferencias.

## Instalación en iPhone (requiere HTTPS una vez)

1. Publicar **todos** los archivos de esta carpeta (manteniendo rutas) en un alojamiento estático HTTPS.
2. En el iPhone, abrir la dirección HTTPS **en Safari** con internet.
3. Compartir -> **Añadir a pantalla de inicio** -> **Abrir como app** -> Añadir.
4. Abrir el icono Gold Trading. Ingresar `admin` / `admin123`; cambiar contraseña desde Preferencias.
5. Dejar que la app termine de descargar recursos. En Preferencias verificar `Uso sin conexión: Archivos preparados`. La persistencia puede aparecer como `No concedido`, según iOS.
6. Activar **modo avión**, cerrar completamente Gold Trading y volver a abrirla: comprobar login, cálculos, tabla y preferencias. Reiniciar el iPhone con modo avión y repetir las pruebas.

**Limitaciones importantes:** el almacenamiento en caché y la contraseña local pueden borrarse por acciones del usuario o del sistema. No se puede garantizar funcionamiento offline de por vida. La app no caduca por certificados de Apple, pero el sitio HTTPS debe mantenerse disponible para reinstalarla o descargar de nuevo la caché cuando sea necesario. La prueba real en modo avión y después del reinicio debe realizarse en el iPhone del cliente; no puede certificarse solo desde un simulador de escritorio.

## Estructura

- `index.html`: login, calculadora, tabla por leyes, preferencias.
- `styles.css`: estilos responsivos para iPhone.
- `math.js`: toda la aritmética local.
- `app.js`: lógica de navegación, acceso y ajustes.
- `sw.js`: caché offline versionada.
- `manifest.webmanifest`: instalación standalone.
- `icons/`: iconos locales incluidos.
- `tests/`: pruebas automáticas de cálculo y estructura (requieren Node.js solo para desarrollo).

Los cálculos no se envían a ningún servicio externo. Las preferencias y el verificador de la contraseña **sí requieren almacenamiento local mínimo**, indispensable para poder modificarlos y conservarlos al cerrar la aplicación. No es una base de datos de operaciones.
