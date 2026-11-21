# Alejandra Space

## Carpetas

- `src/css/`: estilos de la página.
- `src/js/`: módulos, navegación, formulario y almacenamiento local.
- `public/icons/`: iconos de la PWA; Vite los copia a la raíz de `dist/`.
- `PWA-IMPLEMENTACION.md` y `IMAGENES.md`: guías del proyecto y de recursos visuales.
- `data/`: mensajes locales y base SQLite, creados por el servidor y excluidos de Git por privacidad.
- `dist/`: compilación generada por Vite, excluida de Git para no subir archivos repetidos.
- `node_modules/`: dependencias instaladas, excluidas de Git.

## Ejecutar

En PowerShell, desde esta carpeta, usa `npm start` y abre `http://localhost:4173`. Después de compilar, también puedes abrir `index.html` con doble clic; se redirige a la versión de `dist/`.

Al subir el proyecto, Git incluirá `src/`, `public/icons/`, los archivos de configuración y las guías. Ejecuta `npm install` antes de `npm start` en una copia nueva.
