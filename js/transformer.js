/**
 * @module transformer
 * @description Módulo de transformación de imágenes del lado del cliente.
 *              Convierte imágenes de cualquier formato soportado a JPG, manteniendo
 *              las dimensiones originales y optimizando el peso del archivo resultante.
 *              Utiliza la API Canvas de HTML5 para la conversión.
 */

var Transformer = (function () {

    var CALIDAD_JPG    = 0.88;         //Calidad de compresión para las imágenes JPG de salida.Valor entre 0 (menor calidad, menor peso) y 1 (mayor calidad, mayor peso).
    var CALIDAD_MINIMA = 0.50;         //Calidad mínima de compresión antes de declarar que no es posible reducir el peso.
    var PASO_REDUCCION = 0.05;         //Paso de decremento de calidad en cada intento de reducción de peso.
    var TIPO_SALIDA    = 'image/jpeg'; //Tipo MIME de salida para todas las conversiones.

    // ─── Funciones Privadas ─────────────────────────────────────────────────────

    /**
     * Convierte un Data URL Base64 a un objeto Blob binario.
     * @private
     * @param {string} dataURL - El Data URL de la imagen (e.g., "data:image/jpeg;base64,...").
     * @returns {Blob} El objeto Blob resultante.
     */
    function dataURLABlob(dataURL) {
        var partes   = dataURL.split(',');
        var tipoMime = partes[0].match(/:(.*?);/)[1];
        var datos    = atob(partes[1]);
        var arreglo  = new Uint8Array(datos.length);

        for (var i = 0; i < datos.length; i++) {
            arreglo[i] = datos.charCodeAt(i);
        }

        return new Blob([arreglo], { type: tipoMime });
    }

    /**
     * Formatea un tamaño en bytes a una cadena legible (Bytes, KB, o MB).
     * @private
     * @param {number} bytes - El tamaño en bytes.
     * @returns {string} Cadena formateada con la unidad adecuada.
     */
    function formatearTamano(bytes) {
        if (bytes < 1024) {
            return bytes + ' Bytes';
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(2) + ' KB';
        } else {
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }
    }

    /**
     * Dibuja la imagen en un canvas y exporta el resultado como Data URL JPEG.
     * @private
     * @param {HTMLImageElement} imgElement - El elemento de imagen ya cargado.
     * @param {number} calidad - La calidad de compresión JPEG (0 a 1).
     * @returns {string} El Data URL de la imagen convertida.
     */
    function dibujarEnCanvas(imgElement, calidad) {
        var canvas   = document.createElement('canvas');
        var contexto = canvas.getContext('2d');

        // Mantener las dimensiones originales de la imagen
        canvas.width  = imgElement.naturalWidth || imgElement.width;
        canvas.height = imgElement.naturalHeight || imgElement.height;

        // Para imágenes con transparencia (PNG, GIF, WebP), se pinta un fondo blanco
        // antes de convertir a JPG (que no soporta transparencia).
        contexto.fillStyle = '#FFFFFF';
        contexto.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar la imagen sobre el canvas
        contexto.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

        return canvas.toDataURL(TIPO_SALIDA, calidad);
    }

    // ─── API Pública ────────────────────────────────────────────────────────────

    return {

        /**
         * Transforma un archivo de imagen al formato JPG.
         * El proceso:
         *   1. Lee el archivo original como Data URL.
         *   2. Carga la imagen en un elemento `<img>` en memoria.
         *   3. Dibuja la imagen en un canvas HTML5.
         *   4. Exporta el canvas como JPEG con la calidad configurada.
         *   5. Si el archivo resultante es mayor que el original, reduce la calidad
         *      iterativamente hasta que pese menos o se alcance la calidad mínima.
         *
         * @public
         * @param {File} archivoOriginal - El objeto File de la imagen a transformar.
         * @param {function} callback - Función de retorno que recibe el objeto de resultado.
         *        El objeto de resultado tiene la forma:
         *        {
         *          exito: {boolean},
         *          mensaje: {string},
         *          original: { nombre, tipo, peso, pesoFormateado },
         *          transformado: { nombre, tipo, peso, pesoFormateado, calidad, blob, dataURL }
         *        }
         */
        transformarAJPG: function (archivoOriginal, callback) {
            var reader = new FileReader();

            // Captura de metadatos del archivo original
            var infoOriginal = {
                nombre: archivoOriginal.name,
                tipo: archivoOriginal.type || 'desconocido',
                peso: archivoOriginal.size,
                pesoFormateado: formatearTamano(archivoOriginal.size)
            };

            reader.onload = function (eventoReader) {
                var dataURLOriginal = eventoReader.target.result;
                var imgElement      = new Image();

                imgElement.onload = function () {
                    var calidad = CALIDAD_JPG;
                    var dataURLConvertida;
                    var blobConvertido;
                    var pesoConvertido;

                    // ── Bucle de optimización de peso ──────────────────────────
                    // Se convierte con calidad inicial y se reduce si el peso
                    // resultante es mayor que el original.
                    do {
                        dataURLConvertida = dibujarEnCanvas(imgElement, calidad);
                        blobConvertido = dataURLABlob(dataURLConvertida);
                        pesoConvertido = blobConvertido.size;

                        // Si la imagen ya pesa menos o llegamos a la calidad mínima, detenemos
                        if (pesoConvertido < infoOriginal.peso || calidad <= CALIDAD_MINIMA) {
                            break;
                        }

                        // Reducir calidad para el siguiente intento
                        calidad = parseFloat((calidad - PASO_REDUCCION).toFixed(2));

                    } while (calidad >= CALIDAD_MINIMA);

                    // Generar el nombre de archivo de salida cambiando la extensión a .jpg
                    var nombreBase = infoOriginal.nombre.replace(/\.[^/.]+$/, '');
                    var nombreSalida = nombreBase + '.jpg';

                    var infoTransformada = {
                        nombre: nombreSalida,
                        tipo: TIPO_SALIDA,
                        peso: pesoConvertido,
                        pesoFormateado: formatearTamano(pesoConvertido),
                        calidad: Math.round(calidad * 100),
                        blob: blobConvertido,
                        dataURL: dataURLConvertida
                    };

                    // Verificar que la imagen transformada pesa menos que la original
                    if (pesoConvertido >= infoOriginal.peso) {
                        callback({
                            exito: false,
                            mensaje: 'No fue posible reducir el peso de la imagen transformada por debajo del original. ' +
                                'La imagen ya estaba optimizada o es muy pequeña.',
                            original: infoOriginal,
                            transformado: infoTransformada
                        });
                        return;
                    }

                    callback({
                        exito: true,
                        mensaje: 'Imagen transformada exitosamente a JPG.',
                        original: infoOriginal,
                        transformado: infoTransformada
                    });
                };

                imgElement.onerror = function () {
                    callback({
                        exito: false,
                        mensaje: 'No se pudo cargar la imagen para procesarla. El archivo podría estar dañado.',
                        original: infoOriginal
                    });
                };

                // Iniciar la carga de la imagen
                imgElement.src = dataURLOriginal;
            };

            reader.onerror = function () {
                callback({
                    exito: false,
                    mensaje: 'Error al leer el archivo. Por favor, intenta de nuevo.'
                });
            };

            // Iniciar la lectura del archivo
            reader.readAsDataURL(archivoOriginal);
        },

        /**
         * Retorna la calidad de compresión JPG configurada (en porcentaje).
         * @public
         * @returns {number} Porcentaje de calidad (0-100).
         */
        getCalidadJPG: function () {
            return Math.round(CALIDAD_JPG * 100);
        },

        /**
         * Retorna el tipo MIME de salida de la conversión.
         * @public
         * @returns {string} El tipo MIME de salida.
         */
        getTipoSalida: function () {
            return TIPO_SALIDA;
        },

        /**
         * Formatea un número de bytes a una cadena legible.
         * Expone la función privada para uso externo si se necesita.
         * @public
         * @param {number} bytes - El tamaño en bytes.
         * @returns {string} Cadena formateada.
         */
        formatearTamano: function (bytes) {
            return formatearTamano(bytes);
        }
    };

})();
