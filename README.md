# 🖼️ ImagenTransform — Transformación de Imagen en el Cliente

Proyecto web que permite transformar imágenes a formato **JPG** directamente en el navegador, **sin necesidad de subirlas a un servidor**. Utiliza la **Canvas API** de HTML5 para la conversión y optimización del peso del archivo.

---

## 📋 Tabla de Contenidos

- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Cómo ejecutar el proyecto](#cómo-ejecutar-el-proyecto)
- [Ejemplos de uso](#ejemplos-de-uso)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Explicación de módulos](#explicación-de-módulos)
- [Flujo de la aplicación](#flujo-de-la-aplicación)

---

## 🛠 Tecnologías utilizadas

| Tecnología | Versión | Propósito |
|---|---|---|
| HTML5 | — | Estructura semántica de las páginas |
| CSS3 | — | Estilos personalizados y animaciones |
| Bootstrap | **3.4.1** | Componentes UI y sistema de grillas |
| jQuery | **3.7.1** | Manipulación del DOM y eventos |
| Canvas API | (nativa) | Conversión y optimización de imágenes |
| SessionStorage | (nativa) | Comunicación entre páginas |

> Todas las dependencias se cargan desde CDN. **No requiere instalación de paquetes npm.**

---

## ✨ Características

- ✅ **Validación de tipo de archivo** mediante tipo MIME y extensión (doble verificación).
- ✅ **Transformación a JPG** manteniendo las dimensiones originales.
- ✅ **Optimización de peso**: bucle de reducción de calidad hasta lograr menor peso que la imagen original.
- ✅ **Vista previa** de la imagen antes de transformar.
- ✅ **Drag & Drop** para selección de imágenes.
- ✅ **Página de resultados** con comparación de parámetros y botón de descarga.
- ✅ **100% del lado del cliente**: ningún dato sale del navegador.
- ✅ **Diseño responsive** con Bootstrap 3.4.

---

## 📦 Requisitos

- Cualquier **navegador moderno** con soporte de:
  - `FileReader API`
  - `Canvas API` con `toDataURL('image/jpeg')`
  - `SessionStorage API`
- **Conexión a internet** (solo para cargar Bootstrap y jQuery desde CDN la primera vez).
- No requiere instalación de software adicional.

### Navegadores compatibles

| Navegador | Versión mínima |
|---|---|
| Google Chrome | 49+ |
| Mozilla Firefox | 45+ |
| Microsoft Edge | 14+ |
| Safari | 10+ |
| Opera | 36+ |

---

## ⚙️ Instalación

1. **Clona el repositorio** o descarga el ZIP del proyecto:

   ```bash
   git clone https://github.com/tenshi98/transformacion-imagen-lado-cliente.git
   ```

2. **Navega al directorio del proyecto:**

   ```bash
   cd transformacion-imagen-lado-cliente
   ```

No se requiere instalación de dependencias. El proyecto es estático.

---

## 🔧 Configuración

El proyecto no requiere configuración de entorno (`.env`, bases de datos, etc.).

Sin embargo, puedes ajustar los siguientes parámetros editando directamente los módulos JavaScript:

### `js/validator.js`

| Constante | Valor predeterminado | Descripción |
|---|---|---|
| `TIPOS_PERMITIDOS` | JPG, PNG, GIF, BMP, WebP, TIFF, SVG | Tipos MIME aceptados |
| `EXTENSIONES_PERMITIDAS` | jpg, jpeg, png, gif, bmp, webp, tiff, svg | Extensiones de respaldo |
| `TAMANO_MAXIMO_BYTES` | `20 * 1024 * 1024` (20 MB) | Tamaño máximo del archivo |

### `js/transformer.js`

| Constante | Valor predeterminado | Descripción |
|---|---|---|
| `CALIDAD_JPG` | `0.88` (88%) | Calidad inicial de compresión JPEG |
| `CALIDAD_MINIMA` | `0.50` (50%) | Calidad mínima antes de detener el bucle |
| `PASO_REDUCCION` | `0.05` (5%) | Paso de reducción en cada iteración |

---

## 🚀 Cómo ejecutar el proyecto

### Abrir directamente el archivo index.html (recomendado)

Abrir el archivo directamente con el navegador de tu preferencia y realizar las pruebas

## 💡 Ejemplos de uso

### Flujo básico

1. Abre `index.html` en tu navegador.
2. En la zona de carga (drop zone), **arrastra una imagen PNG** o haz clic en **"Examinar archivos"**.
3. La app valida el tipo de archivo en tiempo real.
4. Si la imagen es válida, verás una **vista previa** y la información del archivo.
5. Haz clic en **"Transformar a JPG"**.
6. Espera brevemente mientras el navegador procesa la imagen.
7. Serás redirigido automáticamente a la **página de resultados**.
8. En la página de resultados verás:
   - Comparación visual (placeholder original vs. JPG transformada).
   - Tabla con nombre, formato, peso y calidad de compresión.
   - Badge indicando el % de ahorro conseguido.
   - Botón **"Descargar imagen JPG"**.

### Probar con diferentes formatos

| Formato de entrada | Resultado esperado |
|---|---|
| PNG con transparencia | Fondo blanco en el JPG resultante |
| GIF animado | Se convierte solo el primer frame |
| WebP | Conversión directa a JPG |
| JPEG ya optimizado | Calidad reducida hasta encontrar menor peso |

---

## 📁 Estructura del proyecto

```
transformacion-imagen-lado-cliente/
│
├── index.html          # Página principal: formulario de subida de imagen
├── resultado.html      # Página de resultados: comparación y descarga
│
├── css/
│   └── styles.css      # Estilos personalizados (complementa Bootstrap 3.4)
│
├── js/
│   ├── validator.js    # Módulo de validación de archivos
│   ├── transformer.js  # Módulo de transformación de imágenes a JPG
│   ├── app.js          # Módulo principal (lógica del formulario)
│   └── resultado.js    # Módulo de la página de resultados
│
└── README.md           # Este archivo
```

---

## 🧩 Explicación de módulos

### `js/validator.js`

**Patrón:** IIFE (Immediately Invoked Function Expression) con API pública.

Valida el archivo de imagen seleccionado por el usuario **antes** de procesarlo:

- `validarTipoArchivo(archivo)` — Verifica el tipo MIME y la extensión.
- `validarTamanoArchivo(archivo)` — Verifica que no supere el tamaño máximo.
- `validar(archivo)` — Combina las dos validaciones anteriores (método de entrada principal).
- `getTiposPermitidos()` / `getExtensionesPermitidas()` — Retornan las listas configuradas (copias, no referencias).

Todas las funciones retornan un objeto `{ valido: boolean, mensaje: string }`.

---

### `js/transformer.js`

**Patrón:** IIFE con API pública.

Realiza la conversión de imagen a JPG usando la Canvas API del navegador:

1. Lee el archivo con `FileReader.readAsDataURL()`.
2. Carga la imagen en un `<img>` en memoria.
3. Dibuja la imagen en un `<canvas>` con fondo blanco (para imágenes con alpha).
4. Exporta con `canvas.toDataURL('image/jpeg', calidad)`.
5. **Bucle de optimización**: si el JPG resultante pesa más que el original, reduce la calidad en un 5% y repite hasta alcanzar la calidad mínima o un menor peso.

Método principal:
- `transformarAJPG(archivoOriginal, callback)` — Procesa la imagen y llama al callback con el resultado.

---

### `js/app.js`

**Patrón:** jQuery `$(function(){})` (Document Ready).

Módulo principal que orquesta la experiencia del formulario de subida:

- Gestiona eventos de la **drop zone** (clic, drag & drop, selección de archivo).
- Llama a `Validator.validar()` al seleccionar un archivo.
- Muestra vista previa, información del archivo y mensajes de alerta.
- Al hacer clic en "Transformar", llama a `Transformer.transformarAJPG()`.
- Serializa el resultado y lo persiste en **`sessionStorage`**.
- Redirige a `resultado.html` tras el procesamiento.

---

### `js/resultado.js`

**Patrón:** jQuery `$(function(){})` (Document Ready).

Módulo de la página de resultados:

- Lee y parsea los datos desde `sessionStorage`.
- Si no hay datos (acceso directo), muestra el panel de error.
- Renderiza dinámicamente:
  - La imagen transformada (desde Data URL).
  - El **badge de ahorro** (verde si se redujo, rojo si no).
  - La **tabla comparativa** de parámetros.
- Configura el botón de descarga con el `href` y `download` correctos.
- Limpia `sessionStorage` al volver al formulario.

---

### `css/styles.css`

Estilos personalizados que complementan Bootstrap 3.4, incluyendo:

- Tipografía `Inter` desde Google Fonts.
- Componentes: navbar, hero, drop zone, tarjetas, badges, botones.
- Animaciones CSS: entrada de alertas, barra de progreso animada, hover effects.
- **Responsive**: adaptación de la grilla de comparación para móviles.

---

## 🔄 Flujo de la aplicación

```
[index.html] →  Usuario selecciona imagen
                      ↓
              Validator.validar(archivo)
                      ↓
              [inválido] → Muestra alerta error
              [válido]   → Muestra preview + info
                      ↓
        Usuario clic "Transformar a JPG"
                      ↓
       Transformer.transformarAJPG(archivo)
                      ↓
           Canvas API → data:image/jpeg
                      ↓
        Bucle optimización peso (calidad -5%)
                      ↓
       sessionStorage.setItem(resultado)
                      ↓
  window.location.href = 'resultado.html'
                      ↓
[resultado.html] → sessionStorage.getItem(resultado)
                      ↓
            Renderizar tabla + imágenes
                      ↓
          Botón "Descargar imagen JPG"
```

---

## 📄 Licencia

Este proyecto es de uso libre con fines educativos y de demostración.
