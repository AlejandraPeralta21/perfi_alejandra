# KARAOKE TULUM — Karaoke Lounge VIP

Sitio de catálogo musical, salas privadas y reservas. Proyecto frontend: HTML5, CSS3, JavaScript ES6+, jQuery e iconos SVG. Sin backend ni base de datos: las cuentas y reservas se guardan en el navegador (LocalStorage).

## Cómo abrirlo

Para probar la PWA, sirve la carpeta desde `localhost` o HTTPS (el Service Worker no funciona al abrir el archivo directamente). Por ejemplo, desde la carpeta del proyecto ejecuta `py -m http.server 8000` y abre `http://localhost:8000`. La primera visita debe ser con conexión para instalar la caché; después, la aplicación puede abrirse sin internet. También puedes publicarla en GitHub Pages.

## Acceso (login de demostración)

- Acceso de usuario: **demo@tulum.com** / **demo1234**
- Acceso de administrador: **admin@tulum.com** / **admin1234** (selecciona «Administrador» en el login).
- También puedes crear una cuenta desde la pestaña **Crear cuenta**.
- La sesión se mantiene al recargar la página. Las vistas **Mi perfil**, **Mis reservas** e **Historial** piden iniciar sesión.
- Las reservas se guardan por usuario y se pueden cancelar desde **Mis reservas** o desde **Panel administrador**.
- El panel resume reservas e importes y permite consultar usuarios y la bitácora de actividad. Cada usuario puede consultar su propia bitácora.
- **Importante:** es un prototipo. Las contraseñas usan un hash simple en LocalStorage, **no es seguridad real**. Para producción se necesita un backend con contraseñas cifradas y sesiones del servidor.
- El rol y los permisos también son demostrativos y se controlan en el navegador; para uso real, la autorización de administrador debe validarse en un servidor.
- La PWA precarga archivos de la aplicación y conserva recursos visitados en Cache Storage; cuentas y reservas siguen guardándose en LocalStorage. El indicador muestra el estado de conexión. El proyecto aún no tiene servidor, así que no hay sincronización remota de datos pendientes.
- Al instalarse el Service Worker, la pestaña se recarga una vez al quedar bajo su control; así las solicitudes siguientes, incluidas las imágenes que se visiten, pueden guardarse en caché. Las fotos externas que nunca se cargaron requieren conexión y muestran sus placeholders si no están disponibles.
- El catálogo carga pistas desde `js/data/pistas.json` y muestra miniaturas con `loading="lazy"`. El contenedor de la app usa `min-height: 100dvh` con respaldo `100vh`; la lista dinámica emplea eventos delegados con `.off().on()` para evitar registros duplicados.
- Los títulos, artistas y datos de reservas se insertan en el DOM como texto (`.text()`/`textContent`), también al leer el JSON y LocalStorage, para que una cadena como `<script>...</script>` se muestre sin ejecutarse. Las miniaturas aceptan únicamente URLs HTTP/HTTPS y tienen una imagen de respaldo.
- Este proyecto sirve JavaScript y CSS directamente y no tiene un proceso de bundling; por eso no aplica tree shaking automático. jQuery se usa en los módulos y Google Fonts en los estilos; la revisión no encontró librerías externas sin uso.
- El HTML del menú se hidrata en el cliente sin recrearse: `data-hidratado` cambia de `false` a `true` cuando se conectan los eventos. Es una SPA frontend; no usa renderizado SSR.

## Diseño adaptable

| Dispositivo | Ancho | Comportamiento |
| --- | --- | --- |
| Escritorio | ≥ 1280 px | Menú superior y lateral abiertos, artistas en cuadrícula de 6 columnas |
| Laptop | 1024–1279 px | Menú superior compacto, salas en 2 columnas |
| Tablet | 768–1023 px | Menú lateral con ☰ y navegación inferior visible |
| Celular | ≤ 767 px | Navegación inferior, banner apilado, tarjetas a una columna, encabezado compacto y modales a pantalla completa |

Los puntos de ruptura están ordenados en `css/responsive.css` y los estilos de cuenta en `css/auth.css`.

## Estructura

La raíz queda simple para publicarla en GitHub Pages: `index.html`, `css/`, `js/` y el cargador mínimo `sw.js` que necesita el navegador para controlar la PWA. Recursos, datos, páginas auxiliares, configuración de Supabase y documentación están agrupados dentro de `js/`.

```text
index.html
sw.js                    Cargador mínimo que importa js/sw.js para mantener alcance raíz
css/                     Estilos
js/
  *.js                   Lógica de la aplicación
  assets/                Imágenes, logos e iconos
  data/pistas.json       Canciones del catálogo
  manifest.json          Identidad e instalación PWA
  pages/                 Enlaces directos a vistas
  supabase/              Migraciones y función Edge
  sw.js                  Caché offline de la aplicación
```
## Cómo reemplazar imágenes

- Artistas: pega cada enlace compartido de Dropbox en el campo vacío de su artista dentro de `ARTIST_IMAGES` en `js/catalogo.js`. El catálogo conserva `loading="lazy"` y adapta enlaces Dropbox `dl=0` para mostrarlos.
- Salas: pega cada enlace de imagen en `ROOM_IMAGES` dentro de `js/main.js` (`premium`, `vip`, `party` y `gold`). Si queda vacío, se usa `js/assets/salas/<id>.jpg`.
- Banner: `js/assets/banners/banner.jpg` detrás del degradado morado.

## Datos demostrativos

- Indicadores (`KT.STATS`), salas, precios y capacidades (`KT.ROOMS`) en `js/main.js`.
- Artistas y canciones en `js/catalogo.js`.
- Supabase Auth y perfiles en `js/auth.js`; reservas en `js/reservas.js`.
# Base de datos

La guía de configuración está en [SUPABASE_SETUP.md](SUPABASE_SETUP.md). Login, perfiles, salas, canciones, reservas y bitácoras se conectan con Supabase; una reserva iniciada sin conexión queda en cola local para sincronizarse al recuperar Internet. Los datos antiguos guardados en LocalStorage no se importan automáticamente.



