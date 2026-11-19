# PWA Offline-First de Alejandra Space

## Mapa del código

La explicación de abajo señala **archivo, sección y función** para que puedas ubicar qué hace cada parte. Los comentarios dentro de los archivos también indican la responsabilidad de cada bloque.

## Dónde se ejecuta cada archivo

- `index.html` carga jQuery y el módulo `src/js/app.js`; este importa `src/js/main.js`, `src/js/pwa-store.js`, `src/js/pwa.js`, `src/js/navigation.js`, `src/js/categories.js`, `src/js/personal-cards.js`, `src/js/contact-form.js` y `src/js/admin.js` en el **hilo principal del navegador**.
- `src/js/pwa-store.js` se ejecuta en el navegador y también en el contexto del Service Worker: la página lo carga como script y `sw.js` lo importa mediante `importScripts()`.
- `sw.js` se ejecuta en el **contexto del Service Worker**, separado del DOM. El navegador lo inicia al registrar la PWA y lo activa por eventos como `install`, `fetch` y `sync`.
- `server.js` se ejecuta como un **proceso Node.js local** cuando se inicia con `node server.js`; recibe las solicitudes HTTP de `localhost:4173`.
- `manifest.json` es configuración que el navegador lee para instalar la PWA; `src/css/*.css` es interpretado por el motor de estilos del navegador.

| Pilar / función | Dónde está | Qué hace |
| --- | --- | --- |
| Identidad e instalación | `manifest.json` | Define nombre, nombre corto, inicio, modo de app, colores e iconos. |
| Enlace del manifiesto | `index.html`, dentro de `<head>` | El `<link rel="manifest">` le comunica el manifiesto al navegador; el meta `theme-color` pinta la barra del navegador. |
| Hidratación de navegación | `index.html`, atributo `data-hidratado="false"` del menú; `src/js/navigation.js`, función `hydrateNavigation` | El menú se entrega ya dibujado en HTML y jQuery añade sus interacciones una vez, cambia el atributo a `true` y no redibuja la interfaz. |
| Indicador de red e instalar | `index.html`, sección Contacto; estilos en `src/css/style.css` | Los elementos `#networkStatus` y `#installPwa` muestran el estado de conexión y el control de instalación. |
| Almacenamiento de la app | `sw.js`, constantes `SHELL_CACHE`, `RUNTIME_CACHE` y `APP_SHELL` | Define los archivos locales que se guardan para abrir la interfaz sin conexión y una caché runtime para recursos externos. |
| Guardado local de la cola | `src/js/pwa-store.js`, funciones `openDatabase`, `enqueue`, `list` y `remove` | Crea IndexedDB `alejandra-space-pwa`, guarda operaciones pendientes, las lee en orden y las elimina al confirmarse. Si IndexedDB falla, usa la cola de respaldo en LocalStorage. |
| Guardado optimista del formulario | `src/js/contact-form.js`, función `saveMessage` | Guarda el mensaje primero en LocalStorage, le asigna estado `pending`, muestra el aviso y emite `as:outbox-message`; la pantalla responde sin esperar al servidor. |
| Toast de confirmación | `index.html`, elemento `#contactToast`; `src/js/contact-form.js`, función `showToast`; estilos en `src/css/style.css`, clase `.toast-alert` | Al guardar el formulario confirmado, aparece arriba a la derecha con `slideDown`, permanece 3 segundos y se oculta con `fadeOut`. |
| Envío a la cola | `src/js/pwa.js`, función `enqueueMessage` | Recibe el mensaje del formulario y lo añade a IndexedDB; si hay conexión intenta sincronizarlo inmediatamente. |
| Indicador online/offline | `src/js/pwa.js`, funciones `updateNetworkBadge` y `refreshNetworkBadge` | Cambia texto, color y cantidad de pendientes; escucha los eventos `online` y `offline`. |
| Sincronización al recuperar red | `src/js/pwa.js`, funciones `syncFromPage`, `registerBackgroundSync` y `registerServiceWorker` | Envía pendientes a `POST /api/contact` al volver la conexión y al abrir la página; si el navegador soporta Background Sync, también registra la tarea para que el Service Worker la reintente. |
| Service Worker | `index.html` carga `src/js/pwa.js`; `src/js/pwa.js`, función `registerServiceWorker` registra `sw.js` | Activa el control offline en `localhost` o HTTPS. No se activa abriendo el HTML con `file://`. |
| Caché, navegación y sincronización en segundo plano | `sw.js`, eventos `install`, `activate`, `fetch` y `sync` | Precarga la app, limpia versiones viejas, sirve navegación desde la caché al no haber red y vacía la cola cuando el navegador ejecuta Background Sync. |
| Base de datos del formulario | `server.js`, apertura de `node:sqlite`, tabla `contact_messages` y sentencia preparada `insertMessage` | Guarda cada envío en `data/messages.sqlite`, evita duplicados con la clave primaria `id` y usa parámetros SQL. Requiere Node.js 24 o posterior, que incluye `node:sqlite`; no agrega paquetes npm. |
| Migración de mensajes anteriores | `server.js`, función `migrateLegacyMessages` | Importa una sola vez los registros de `data/messages.json` a SQLite con `INSERT OR IGNORE`, conservando mensajes previos sin duplicarlos. |
| Confirmación del servidor | `server.js`, función `handleContactPost` y ruta `/api/contact` | Valida los datos, conserva el mismo endpoint y devuelve confirmación después de guardar en SQLite. El servidor sólo escucha en el equipo local. |
| Estado del mensaje en administración | `src/js/admin.js`, función `renderMessages` | Identifica cada registro como pendiente o sincronizado y actualiza su representación al recibir `as:messages-updated`. |
| Prevención de listeners duplicados | `src/js/main.js`, `src/js/navigation.js`, `src/js/categories.js`, `src/js/personal-cards.js`, `src/js/contact-form.js`, `src/js/admin.js` y `src/js/pwa.js` | Los manejadores dinámicos/globales usan namespaces y llaman `.off()` antes de enlazar con `.on()`; los botones que se regeneran se manejan por delegación desde un contenedor estable. |
| Validación y foco del formulario | `src/js/contact-form.js`, arreglo `fields`, función `validateField` y eventos `input/change/blur`; estilos en `src/css/style.css` | Valida al escribir y al salir del campo, anuncia errores con `aria-invalid`, enfoca el primer campo inválido y destaca con color el foco y los errores. |
| Viewport móvil y altura adaptable | `index.html`, `<meta name="viewport">`; `src/css/style.css`, regla base de `html, body` | Usa el ancho real del dispositivo, `viewport-fit=cover` y fallbacks `100vh`/`100dvh` para la altura visible en móviles. |
| Carga diferida de imágenes | `index.html` y `src/js/main.js` (galería), `src/js/categories.js` (contenido de intereses) | Las imágenes no visibles usan `loading="lazy"`; la foto principal queda en carga inmediata para mostrarse al entrar. |

## Qué ocurre con un mensaje

1. Al confirmar el formulario, `saveMessage` guarda una copia local con estado **Pendiente de sincronización**.
2. `enqueueMessage` coloca esa copia en IndexedDB para que sobreviva al cierre o recarga de la página.
3. Con conexión, `syncFromPage` hace el envío al servidor. Sin conexión, la cola queda guardada y el Service Worker puede reintentar con Background Sync cuando el navegador lo permita.
4. Sólo después de recibir una respuesta correcta se borra de la cola y el mensaje local pasa a **Sincronización completada**.

## Cómo abrir la PWA

1. Para compilar con Tree Shaking la primera vez, abre una terminal en la carpeta del proyecto y ejecuta `npm install`.
2. Ejecuta `npm run build` para generar la versión de producción en `dist/`. También puedes usar `npm start`, que compila y luego inicia el servidor.
3. Si ya tenías `node server.js` abierto, deténlo con `Ctrl+C` y vuelve a iniciarlo con `node server.js` para que publique `dist/`.
4. Entra a `http://localhost:4173`. Para publicar la app, el sitio debe usar HTTPS.
5. Carga la página una vez con conexión para que el Service Worker guarde los archivos locales. En Contacto aparecerá la instalación cuando el navegador la ofrezca.
6. Para una prueba manual offline, desconecta la red desde el dispositivo o las herramientas de desarrollo, envía un mensaje y revisa el rótulo de estado. Al volver online, el envío se reintentará.

## Abrir desde la carpeta con doble clic

Después de compilar una vez con `npm run build`, puedes abrir el `index.html` de la carpeta del proyecto. Si lo abres con doble clic, te redirige al paquete `dist/index.html`, cuyo JavaScript está compilado como script clásico para que el navegador permita ejecutarlo desde `file://`. Así funcionan las interacciones del lado del navegador.

Desde `file://` el navegador no permite iniciar el Service Worker ni conectar con la ruta local `/api/contact`; los mensajes quedan en el almacenamiento local del navegador. Para sincronizarlos con SQLite y activar la PWA, inicia `npm start` y abre `http://localhost:4173`.

## Base de datos local de mensajes

`server.js` brinda un endpoint local funcional para el formulario. Al ejecutarlo con Node.js 24 o posterior, crea automáticamente `data/messages.sqlite` y la tabla `contact_messages`; no hace falta instalar dependencias. Los mensajes que ya existían en `data/messages.json` se importan al iniciar. El archivo SQLite y sus archivos auxiliares están excluidos de Git porque contienen datos privados.

El servidor de demostración sólo acepta conexiones de este equipo. Al publicar en un hosting, habrá que desplegar también una ruta segura `POST /api/contact` con persistencia en una base de datos del servidor; GitHub Pages por sí solo no ejecuta Node ni recibe el formulario.

## Prueba manual de XSS y peso de descarga

### XSS en el formulario

1. Ejecuta `node server.js` y abre `http://localhost:4173`.
2. En Contacto, escribe `<script>alert('XSS')</script>` como nombre. Completa los demás campos con datos de prueba válidos y confirma el formulario dentro de los 30 segundos.
3. Revisa el panel de administración. El texto debe aparecer literalmente y no debe abrirse una alerta. `src/js/admin.js` escribe los mensajes con `textContent`; `src/js/categories.js` usa `.text()` para los textos de contenido. No insertes texto del formulario mediante `.html(valor)` o `innerHTML`.

### Medir los recursos transferidos

1. Abre DevTools con `F12` y selecciona **Network/Red**.
2. Marca **Disable cache/Deshabilitar caché**. Para medir una descarga de red ignorando el Service Worker, abre **Application → Service Workers** y activa **Bypass for network**.
3. Limpia la lista de solicitudes y recarga. Anota el total **Transferred/Transferido** que aparece al pie de Network; ese valor puede variar según las imágenes que se hayan solicitado.
4. Filtra por **JS** y **CSS** y revisa el nombre y el iniciador de cada archivo antes de quitar una referencia.

### Sobre Tree Shaking en este proyecto

`src/js/app.js` es el punto de entrada ES Modules y enlaza los módulos de la interfaz con `import`. Vite crea el grafo de dependencias y aplica Tree Shaking/minificación al generar `dist/assets/index.js`, convertido a IIFE clásico para funcionar también desde `file://`. En esta salida, el CSS minificado se inyecta desde el paquete JS. Las funciones y características que usa la página permanecen en el paquete.

La revisión manual de `<script>` y `<link>` en `index.html` muestra dependencias externas que sí se usan: jQuery para los módulos de interfaz, Bootstrap Icons para los iconos y Google Fonts para Poppins, Outfit y Dancing Script. No conviene quitarlas sin reemplazar esos usos. Las imágenes Dropbox son solicitudes de imágenes, no código JS/CSS que pueda eliminar Tree Shaking. La minificación CSS compacta las hojas, pero no elimina selectores CSS que no se usan.
