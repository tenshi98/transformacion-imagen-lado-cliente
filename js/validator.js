/**
 * @module validator
 * @description Módulo de validación de archivos de imagen del lado del cliente.
 *              Contiene funciones para verificar el tipo y el tamaño de los archivos
 *              seleccionados por el usuario antes de ser procesados.
 */

var Validator = (function () {

    /**
     * Lista de tipos MIME de imagen permitidos para la carga.
     * @type {string[]}
     */
    var TIPOS_PERMITIDOS = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp',
        'image/tiff',
        'image/svg+xml'
    ];

    /**
     * Extensiones de archivo permitidas (respaldo si el tipo MIME no está disponible).
     * @type {string[]}
     */
    var EXTENSIONES_PERMITIDAS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg'];

    /**
     * Tamaño máximo de archivo permitido en bytes (20 MB).
     * @type {number}
     */
    var TAMANO_MAXIMO_BYTES = 20 * 1024 * 1024; // 20 MB

    // ─── Funciones Privadas ─────────────────────────────────────────────────────

    /**
     * Extrae la extensión de un nombre de archivo.
     * @private
     * @param {string} nombreArchivo - El nombre del archivo.
     * @returns {string} La extensión del archivo en minúsculas (sin el punto).
     */
    function obtenerExtension(nombreArchivo) {
        var partes = nombreArchivo.split('.');
        return partes.length > 1 ? partes[partes.length - 1].toLowerCase() : '';
    }

    /**
     * Valida si el tipo MIME del archivo está en la lista de tipos permitidos.
     * @private
     * @param {File} archivo - El objeto File a validar.
     * @returns {boolean} `true` si el tipo MIME es válido, `false` en caso contrario.
     */
    function validarTipoMime(archivo) {
        return TIPOS_PERMITIDOS.indexOf(archivo.type) !== -1;
    }

    /**
     * Valida la extensión del archivo como método de respaldo.
     * @private
     * @param {File} archivo - El objeto File a validar.
     * @returns {boolean} `true` si la extensión es válida, `false` en caso contrario.
     */
    function validarExtension(archivo) {
        var extension = obtenerExtension(archivo.name);
        return EXTENSIONES_PERMITIDAS.indexOf(extension) !== -1;
    }

    /**
     * Valida que el archivo no supere el tamaño máximo permitido.
     * @private
     * @param {File} archivo - El objeto File a validar.
     * @returns {boolean} `true` si el tamaño es válido, `false` en caso contrario.
     */
    function validarTamano(archivo) {
        return archivo.size <= TAMANO_MAXIMO_BYTES;
    }

    return {

        /**
         * Valida si el archivo seleccionado es una imagen de tipo permitido.
         * Verifica primero por tipo MIME y luego por extensión como respaldo.
         * @public
         * @param {File} archivo - El objeto File proveniente del input de tipo file.
         * @returns {{valido: boolean, mensaje: string}} Objeto con el resultado de la validación.
         */
        validarTipoArchivo: function (archivo) {
            if (!archivo) {
                return { valido: false, mensaje: 'No se ha seleccionado ningún archivo.' };
            }

            // Validar por tipo MIME (método principal)
            var mimeValido = validarTipoMime(archivo);
            // Validar por extensión (método de respaldo)
            var extensionValida = validarExtension(archivo);

            if (!mimeValido && !extensionValida) {
                return {
                    valido: false,
                    mensaje: 'Tipo de archivo no permitido. Solo se aceptan imágenes (' +
                             EXTENSIONES_PERMITIDAS.join(', ').toUpperCase() + ').'
                };
            }

            return { valido: true, mensaje: 'Tipo de archivo válido.' };
        },

        /**
         * Valida que el archivo no supere el límite de tamaño establecido.
         * @public
         * @param {File} archivo - El objeto File a validar.
         * @returns {{valido: boolean, mensaje: string}} Objeto con el resultado de la validación.
         */
        validarTamanoArchivo: function (archivo) {
            if (!archivo) {
                return { valido: false, mensaje: 'No se ha seleccionado ningún archivo.' };
            }

            if (!validarTamano(archivo)) {
                var tamanoMB = (TAMANO_MAXIMO_BYTES / (1024 * 1024)).toFixed(0);
                return {
                    valido: false,
                    mensaje: 'El archivo supera el tamaño máximo permitido de ' + tamanoMB + ' MB.'
                };
            }

            return { valido: true, mensaje: 'Tamaño de archivo válido.' };
        },

        /**
         * Realiza todas las validaciones sobre el archivo seleccionado.
         * @public
         * @param {File} archivo - El objeto File a validar.
         * @returns {{valido: boolean, mensaje: string}} Objeto con el resultado de la validación.
         */
        validar: function (archivo) {
            var resultadoTipo = this.validarTipoArchivo(archivo);
            if (!resultadoTipo.valido) {
                return resultadoTipo;
            }

            var resultadoTamano = this.validarTamanoArchivo(archivo);
            if (!resultadoTamano.valido) {
                return resultadoTamano;
            }

            return { valido: true, mensaje: 'El archivo es válido.' };
        },

        /**
         * Retorna la lista de tipos MIME permitidos.
         * @public
         * @returns {string[]} Array con los tipos MIME permitidos.
         */
        getTiposPermitidos: function () {
            return TIPOS_PERMITIDOS.slice(); // Retorna copia para evitar mutación
        },

        /**
         * Retorna la lista de extensiones de archivo permitidas.
         * @public
         * @returns {string[]} Array con las extensiones permitidas.
         */
        getExtensionesPermitidas: function () {
            return EXTENSIONES_PERMITIDAS.slice(); // Retorna copia para evitar mutación
        }
    };

})();
