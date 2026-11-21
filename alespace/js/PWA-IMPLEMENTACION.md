# PWA Offline-First de Alejandra Space

## Mapa del código

La explicación de abajo señala **archivo, sección y función** para que puedas ubicar qué hace cada parte. Los comentarios dentro de los archivos también indican la responsabilidad de cada bloque.

## Dónde se ejecuta cada archivo

- ``index.html` carga jQuery y el módulo `js/app.js`; este importa `js/main.js`, `js/pwa-store.js`, `js/pwa.js`, `js/navigation.js`, `js/categories.js`, `js/personal-cards.js`, `js/contact-form.js` y `js/admin.js` en el **hilo principal del navegador**.
- `js/pwa-store.js` se ejecuta en el navegador y también en el contexto del Service Worker: la página lo carga como script y `sw.js` lo importa mediante `importScripts()`.
- `sw.js` se ejecuta en el **contexto del Service Worker**, separado del DOM. El navegador lo inicia al registrar la PWA y lo activa por eventos como `install`, `fetch` y `sync`.
- `server.js` se ejecuta como un **proceso Node.js local** cuando se inicia con `node js/server.js`; recibe las solicitudes HTTP de `localhost:4173`.
- `js/manifest.json` es configuración que el navegador lee para instalar la PWA; `css/*.css` es interpretado por el motor de estilos del navegador.

| Pilar / función | Dónde está | Qué hace |
| --- | --- | --- |
| Identidad e instalación | `js/manifest.json` | Define nombre, nombre corto, inicio, modo de app, colores e iconos. |
| Enlace del manifiesto | `index.html`, dentro de `<head>` | El `<link rel="manifest">` le comunica el manifiesto al navegador; el meta `theme-color` pinta la barra del navegador. |
| Hidratación de navegación | `index.html`, atributo `data-hidratado="false"` del menú; `js/navigation.js`, función `hydrateNavigation` | El menú se entrega ya dibujado en HTML y jQuery añade sus interacciones una vez, cambia el atributo a `true` y no redibuja la interfaz. |
| Indicador de red e instalar | `index.html`, sección Contacto; estilos en `css/style.css` | Los elementos `#networkStatus` y `#installPwa` muestran el estado de conexión y el control de instalación. |
| Almacenamiento de la app | `sw.js`, constantes `SHELL_CACHE`, `RUNTIME_CACHE` y `APP_SHELL` | Define los archivos locales que se guardan para abrir la interfaz sin conexión y una caché runtime para recursos externos. |
| Guardado local de la cola | `js/pwa-store.js`, funciones `openDatabase`, `enqueue`, `list` y `remove` | Crea IndexedDB `alejandra-space-pwa`, guarda operaciones pendientes, las lee en orden y las elimina al confirmarse. Si IndexedDB falla, usa la cola de respaldo en LocalStorage. |
| Guardado optimista del formulario | `js/contact-form.js`, función `saveMessage` | Guarda el mensaje primero en LocalStorage, le asigna estado `pending`, muestra el aviso y emite `as:outbox-message`; la pantalla responde sin esperar al servidor. |
| Toast de confirmación | `index.html`, elemento `#contactToast`; `js/contact-form.js`, función `showToast`; estilos en `css/style.css`, clase `.toast-alert` | Al guardar el formulario confirmado, aparece arriba a la derecha con `slideDown`, permanece 3 segundos y se oculta con `fadeOut`. |
| Envío a la cola | `js/pwa.js`, función `enqueueMessage` | Recibe el mensaje del formulario y lo añade a IndexedDB; si hay conexión intenta sincronizarlo inmediatamente. |
| Indicador online/offline | `js/pwa.js`, funciones `updateNetworkBadge` y `refreshNetworkBadge` | Cambia texto, color y cantidad de pendientes; escucha los eventos `online` y `offline`. |
| Sincronización al recuperar red | `js/pwa.js`, funciones `syncFromPage`, `registerBackgroundSync` y `registerServiceWorker` | Envía pendientes a `POST /api/contact` al volver la conexión y al abrir la página; si el navegador soporta Background Sync, también registra la tarea para que el Service Worker la reintente. |
| Service Worker | `index.html` carga `js/pwa.js`; `js/pwa.js`, función `registerServiceWorker` registra `sw.js` | Activa el control offline en `localhost` o HTTPS. No se activa abriendo el HTML con `file://`. |
| Caché, navegación y sincronización en segundo plano | `sw.js`, eventos `install`, `activate`, `fetch` y `sync` | Precarga la app, limpia versiones viejas, sirve navegación desde la caché al no haber red y vacía la cola cuando el navegador ejecuta Background Sync. |
| Base de datos del formulario | `server.js`, apertura de `node:sqlite`, tabla `contact_messages` y sentencia preparada `insertMessage` | Guarda cada envío en `data/messages.sqlite`, evita duplicados con la clave primaria `id` y usa parámetros SQL. Requiere Node.js 24 o posterior, que incluye `node:sqlite`; no agrega paquetes npm. |
| Migración de mensajes anteriores | `server.js`, función `migrateLegacyMessages` | Importa una sola vez los registros de `data/messages.json` a SQLite con `INSERT OR IGNORE`, conservando mensajes previos sin duplicarlos. |
| Confirmación del servidor | `server.js`, función `handleContactPost` y ruta `/api/contact` | Valida los datos, conserva el mismo endpoint y devuelve confirmación después de guardar en SQLite. El servidor sólo escucha en el equipo local. |
| Estado del mensaje en administración | `js/admin.js`, función `renderMessages` | Identifica cada registro como pendiente o sincronizado y actualiza su representación al recibir `as:messages-updated`. |
| Prevención de listeners duplicados | `js/main.js`, `js/navigation.js`, `js/categories.js`, `js/personal-cards.js`, `js/contact-form.js`, `js/admin.js` y `js/pwa.js` | Los manejadores dinámicos/globales usan namespaces y llaman `.off()` antes de enlazar con `.on()`; los botones que se regeneran se manejan por delegación desde un contenedor estable. |
| Validación y foco del formulario | `js/contact-form.js`, arreglo `fields`, función `validateField` y eventos `input/change/blur`; estilos en `css/style.css` | Valida al escribir y al salir del campo, anuncia errores con `aria-invalid`, enfoca el primer campo inválido y destaca con color el foco y los errores. |
| Viewport móvil y altura adaptable | `index.html`, `<meta name="viewport">`; `css/style.css`, regla base de `html, body` | Usa el ancho real del dispositivo, `viewport-fit=cover` y fallbacks `100vh`/`100dvh` para la altura visible en móviles. |
| Carga diferida de imágenes | `index.html` y `js/main.js` (galería), `js/categories.js` (contenido de intereses) | Las imágenes no visibles usan `loading="lazy"`; la foto principal queda en carga inmediata para mostrarse al entrar. |
| Especificidad y organización CSS | `css/style.css`, encabezado y bloque `.cascade-filter__*` | La especificidad se compara como ID > clase/atributo/pseudoclase > elemento; si empata, gana la regla posterior. El filtro usa clases BEM (`bloque__elemento--modificador`) para mantener selectores planos y evitar depender de `!important`. Las reglas de `[hidden]`, vistas inactivas y movimiento reducido conservan `!important` para respetar estados funcionales/accesibles frente a estilos de layout/animación. |
| Sanitización HTML con DOMPurify | `js/security.js`, `sanitizeHtml`; uso en `js/cascade-filter.js`, cambio de la tercera capa | Antes de insertar una descripción como HTML, `sanitizeHtml` permite solo etiquetas y atributos de una lista explícita. Si la CDN aún no cargó o no hay red, el filtro usa `.text()` y muestra el contenido literalmente; nunca interpreta la entrada sin sanitizar. El resto de los datos dinámicos se crea con `.text()`, `textContent` o nodos DOM. La etiqueta de carga está en `index.html` y el Service Worker conserva la dependencia para sesiones posteriores offline. |

## Qué ocurre con un mensaje

1. Al confirmar el formulario, `saveMessage` guarda una copia local con estado **Pendiente de sincronización**.
2. `enqueueMessage` coloca esa copia en IndexedDB para que sobreviva al cierre o recarga de la página.
3. Con conexión, `syncFromPage` hace el envío al servidor. Sin conexión, la cola queda guardada y el Service Worker puede reintentar con Background Sync cuando el navegador lo permita.
4. Sólo después de recibir una respuesta correcta se borra de la cola y el mensaje local pasa a **Sincronización completada**.

## Cómo abrir la PWA

1. Para compilar con Tree Shaking la primera vez, abre una terminal en la carpeta del proyecto y ejecuta `npm --prefix js install`.
2. Ejecuta `npm --prefix js run build` para generar la versión de producción en `js/dist/`. También puedes usar `npm --prefix js start`, que compila y luego inicia el servidor.
3. Si ya tenías `node js/server.js` abierto, deténlo con `Ctrl+C` y vuelve a iniciarlo con `node js/server.js` para que publique `js/dist/`.
4. Entra a `http://localhost:4173`. Para publicar la app, el sitio debe usar HTTPS.
5. Carga la página una vez con conexión para que el Service Worker guarde los archivos locales. En Contacto aparecerá la instalación cuando el navegador la ofrezca.
6. Para una prueba manual offline, desconecta la red desde el dispositivo o las herramientas de desarrollo, envía un mensaje y revisa el rótulo de estado. Al volver online, el envío se reintentará.

## Abrir desde la carpeta con doble clic

Después de compilar una vez con `npm --prefix js run build`, puedes abrir el `index.html` de la carpeta raíz del proyecto. Si lo abres con doble clic, te redirige al paquete `js/dist/index.html`, cuyo JavaScript está compilado como script clásico para que el navegador permita ejecutarlo desde `file://`. Así funcionan las interacciones del lado del navegador.

Desde `file://` el navegador no permite iniciar el Service Worker ni conectar con la ruta local `/api/contact`; los mensajes quedan en el almacenamiento local del navegador. Para sincronizarlos con SQLite y activar la PWA, inicia `npm --prefix js start` y abre `http://localhost:4173`.

## Base de datos local de mensajes

`server.js` brinda un endpoint local funcional para el formulario. Al ejecutarlo con Node.js 24 o posterior, crea automáticamente `data/messages.sqlite` y la tabla `contact_messages`; no hace falta instalar dependencias. Los mensajes que ya existían en `data/messages.json` se importan al iniciar. El archivo SQLite y sus archivos auxiliares están excluidos de Git porque contienen datos privados.

El servidor de demostración sólo acepta conexiones de este equipo. Al publicar en un hosting, habrá que desplegar también una ruta segura `POST /api/contact` con persistencia en una base de datos del servidor; GitHub Pages por sí solo no ejecuta Node ni recibe el formulario.

## Prueba manual de XSS y peso de descarga

### XSS en el formulario

1. Ejecuta `node js/server.js` y abre `http://localhost:4173`.
2. En Contacto, escribe `<script>alert('XSS')</script>` como nombre. Completa los demás campos con datos de prueba válidos y confirma el formulario dentro de los 30 segundos.
3. Revisa el panel de administración. El texto debe aparecer literalmente y no debe abrirse una alerta. `js/admin.js` escribe los mensajes con `textContent`; `js/categories.js` usa `.text()` para los textos de contenido. No insertes texto del formulario mediante `.html(valor)` o `innerHTML`.

### Medir los recursos transferidos

1. Abre DevTools con `F12` y selecciona **Network/Red**.
2. Marca **Disable cache/Deshabilitar caché**. Para medir una descarga de red ignorando el Service Worker, abre **Application → Service Workers** y activa **Bypass for network**.
3. Limpia la lista de solicitudes y recarga. Anota el total **Transferred/Transferido** que aparece al pie de Network; ese valor puede variar según las imágenes que se hayan solicitado.
4. Filtra por **JS** y **CSS** y revisa el nombre y el iniciador de cada archivo antes de quitar una referencia.

### Sobre Tree Shaking en este proyecto

`js/app.js` es el punto de entrada ES Modules y enlaza los módulos de la interfaz con `import`. Vite crea el grafo de dependencias y aplica Tree Shaking/minificación al generar `js/dist/assets/index.js`, convertido a IIFE clásico para funcionar también desde `file://`. En esta salida, el HTML compilado carga los estilos desde `js/dist/css/`. Las funciones y características que usa la página permanecen en el paquete.

La revisión manual de `<script>` y `<link>` en `index.html` muestra dependencias externas que sí se usan: jQuery para los módulos de interfaz, Bootstrap Icons para los iconos, DOMPurify para sanitizar el único bloque que admite HTML y Google Fonts para Poppins, Outfit y Dancing Script. No conviene quitarlas sin reemplazar esos usos. Las imágenes Dropbox son solicitudes de imágenes, no código JS/CSS que pueda eliminar Tree Shaking. La minificación CSS compacta las hojas, pero no elimina selectores CSS que no se usan.

## Especificidad CSS y DOMPurify

- **Especificidad:** CSS compara primero el origen/capa y la importancia; dentro de las reglas de autor normales, los selectores se comparan por ID, clases/atributos/pseudoclases y elementos. Si tienen el mismo peso, gana el último declarado. La hoja `css/style.css` deja este criterio documentado al inicio. El filtro usa nombres BEM (`cascade-filter__field`, `cascade-filter__select`, `cascade-filter__result`) con selectores de clase de baja especificidad para que los estilos sean fáciles de mantener.
- **Excepciones justificadas:** hay reglas `!important` para que `hidden`, las vistas inactivas y la preferencia de movimiento reducido no sean anuladas por reglas de presentación o animación. El proyecto no afirma haber eliminado todo `!important`.
- **DOMPurify:** `js/security.js` envuelve `DOMPurify.sanitize()` con etiquetas y atributos permitidos. `js/cascade-filter.js` usa el resultado sanitizado antes de `.html()`. Si la librería no está disponible, muestra la descripción con `.text()` como texto plano. Para contenido que no necesita formato HTML, se prefiere `.text()`/`textContent` directamente.
- **Carga externa:** `index.html` carga DOMPurify desde jsDelivr y `sw.js` incluye la dependencia en su caché para usos posteriores offline. Como esa carga puede tardar o fallar en una primera visita sin red, el fallback de texto plano conserva la seguridad.
