# Alejandra Space

## Elementos de la carpeta principal

- `index.html`: página de entrada.
- `css/`: estilos base, adaptabilidad y animaciones.
- `js/`: módulos, categorías, iconos, manifiesto, documentación y configuración.
- `sw.js`: Service Worker en la raíz para conservar el alcance offline.

## Subir a GitHub sin dependencias generadas

`js/node_modules/`, `js/dist/` y `js/data/` están excluidos en el `.gitignore` de la raíz. No hace falta subir las dependencias ni los archivos compilados: el código fuente y `package-lock.json` bastan. Quedan 29 archivos de fuente y configuración para subir, debajo del límite de 100.

Usa GitHub Desktop o Git para subir la carpeta: el selector web de GitHub no aplica `.gitignore` y puede incluir archivos dentro de `node_modules`.

## Ejecutar localmente

En PowerShell, desde la carpeta principal, instala las dependencias con `npm --prefix js install` y luego inicia con `npm --prefix js start`. Abre `http://localhost:4173`. Para compilar sin iniciar el servidor, ejecuta `npm --prefix js run build`.
