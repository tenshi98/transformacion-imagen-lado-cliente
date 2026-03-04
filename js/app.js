/**
 * @module app
 * @description Módulo principal de la aplicación de transformación de imágenes.
 *              Coordina los módulos `Validator` y `Transformer`, gestiona la UI
 *              del formulario (interacción con el usuario, eventos, alertas) y
 *              persiste los datos del resultado en sessionStorage para la página
 *              de resultados.
 *
 * @requires Validator (js/validator.js)
 * @requires Transformer (js/transformer.js)
 * @requires jQuery
 */

$(function () {

    // ════════════════════════════════════════════════════════════════════════════
    // REFERENCIAS A ELEMENTOS DEL DOM
    // ════════════════════════════════════════════════════════════════════════════

    var $dropZone            = $('#dropZone');               /** @type {jQuery} Zona de arrastrar y soltar (drop zone) */
    var $inputImagen         = $('#inputImagen');            /** @type {jQuery} Input de tipo file oculto */
    var $contenedorPreview   = $('#contenedorPreview');      /** @type {jQuery} Contenedor de la vista previa de la imagen seleccionada */
    var $imagenPreview       = $('#imagenPreview');          /** @type {jQuery} Elemento img de la vista previa */
    var $previewNombre       = $('#previewNombre');          /** @type {jQuery} Texto de nombre de archivo en el overlay de la vista previa */
    var $contenedorInfo      = $('#contenedorInfoArchivo');  /** @type {jQuery} Contenedor de los datos informativos del archivo */
    var $contenedorAlertas   = $('#contenedorAlertas');      /** @type {jQuery} Contenedor de mensajes de alerta */
    var $contenedorProgreso  = $('#contenedorProgreso');     /** @type {jQuery} Contenedor de la barra de progreso */
    var $btnProcesar         = $('#btnProcesar');            /** @type {jQuery} Botón de procesar/transformar */
    var $btnSeleccionar      = $('#btnSeleccionar');         /** @type {jQuery} Botón de seleccionar imagen desde la drop zone */
    var $btnLimpiar          = $('#btnLimpiar');             /** @type {jQuery} Botón de limpiar/cancelar selección */

    // ════════════════════════════════════════════════════════════════════════════
    // ESTADO INTERNO
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Archivo actualmente seleccionado por el usuario.
     * @type {File|null}
     */
    var archivoSeleccionado = null;

    // ════════════════════════════════════════════════════════════════════════════
    // FUNCIONES DE UI / HELPERS
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Muestra un mensaje de alerta en el contenedor de alertas.
     * @param {string} tipo     - Tipo de alerta: 'error', 'exito', 'advertencia', 'info'.
     * @param {string} mensaje  - Texto a mostrar en la alerta.
     */
    function mostrarAlerta(tipo, mensaje) {
        var iconos = {
            error: '&#10060;',
            exito: '&#9989;',
            advertencia: '&#9888;&#65039;',
            info: '!'
        };

        var html = '<div class="alerta-custom alerta-' + tipo + '">' +
            '  <span class="alerta-icono">' + (iconos[tipo] || '!') + '</span>' +
            '  <span>' + mensaje + '</span>' +
            '</div>';

        $contenedorAlertas.html(html);
    }

    /**
     * Limpia todas las alertas mostradas actualmente.
     */
    function limpiarAlertas() {
        $contenedorAlertas.empty();
    }

    /**
     * Muestra u oculta la barra de progreso y actualiza su texto.
     * @param {boolean} visible - Si es `true`, muestra el progreso; si es `false`, lo oculta.
     * @param {string}  texto   - Texto informativo para mostrar junto a la barra.
     */
    function mostrarProgreso(visible, texto) {
        if (visible) {
            $('#progresoTexto').text(texto || 'Procesando...');
            $contenedorProgreso.show();
        } else {
            $contenedorProgreso.hide();
        }
    }

    /**
     * Habilita o deshabilita el botón de procesar.
     * @param {boolean} habilitado - Estado deseado del botón.
     */
    function habilitarBotonProcesar(habilitado) {
        $btnProcesar.prop('disabled', !habilitado);
        if (habilitado) {
            $btnProcesar.removeClass('disabled');
        } else {
            $btnProcesar.addClass('disabled');
        }
    }

    /**
     * Actualiza la visualización del panel de información del archivo seleccionado.
     * @param {File} archivo - El archivo del cual mostrar información.
     */
    function mostrarInfoArchivo(archivo) {
        var extension = archivo.name.split('.').pop().toUpperCase();
        var tipo      = archivo.type || ('.' + extension);

        $('#infoNombre').text(archivo.name);
        $('#infoTipo').text(tipo);
        $('#infoPeso').text(Transformer.formatearTamano(archivo.size));
        $('#infoDimension').text('Calculando...');

        $contenedorInfo.show();
    }

    /**
     * Actualiza el texto de dimensiones en el panel de información, una vez
     * que la imagen ha sido cargada y sus dimensiones son conocidas.
     * @param {number} ancho  - Ancho en píxeles.
     * @param {number} alto   - Alto en píxeles.
     */
    function actualizarDimensiones(ancho, alto) {
        $('#infoDimension').text(ancho + ' × ' + alto + ' px');
    }

    /**
     * Muestra la vista previa de la imagen seleccionada.
     * @param {File}   archivo - El archivo de imagen.
     * @param {string} dataURL - El Data URL de la imagen para mostrar en <img>.
     */
    function mostrarPreview(archivo, dataURL) {
        $imagenPreview.attr('src', dataURL);
        $previewNombre.text(archivo.name);
        $contenedorPreview.show();
    }

    /**
     * Restaura la UI al estado inicial (sin archivo seleccionado).
     */
    function limpiarUI() {
        archivoSeleccionado = null;
        $inputImagen.val('');
        $contenedorPreview.hide();
        $contenedorInfo.hide();
        $contenedorProgreso.hide();
        limpiarAlertas();
        habilitarBotonProcesar(false);
        $dropZone.show();
    }

    // ════════════════════════════════════════════════════════════════════════════
    // LÓGICA PRINCIPAL
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Procesa el archivo seleccionado:
     *   1. Muestra la vista previa.
     *   2. Valida el archivo con el módulo `Validator`.
     *   3. Si es válido, habilita el botón de procesar.
     * @param {File} archivo - El archivo de imagen seleccionado.
     */
    function procesarSeleccion(archivo) {
        limpiarAlertas();

        // Validar el archivo ANTES de mostrarlo
        var resultado = Validator.validar(archivo);

        if (!resultado.valido) {
            mostrarAlerta('error', resultado.mensaje);
            habilitarBotonProcesar(false);
            return;
        }

        archivoSeleccionado = archivo;

        // Leer y mostrar vista previa
        var reader = new FileReader();
        reader.onload = function (e) {
            var dataURL = e.target.result;
            mostrarPreview(archivo, dataURL);
            $dropZone.hide();

            // Calcular dimensiones reales de la imagen
            var imgTemp = new Image();
            imgTemp.onload = function () {
                actualizarDimensiones(
                    imgTemp.naturalWidth || imgTemp.width,
                    imgTemp.naturalHeight || imgTemp.height
                );
            };
            imgTemp.src = dataURL;
        };
        reader.readAsDataURL(archivo);

        mostrarInfoArchivo(archivo);
        habilitarBotonProcesar(true);
        mostrarAlerta('exito', 'Imagen válida seleccionada. Haz clic en "Transformar a JPG" para continuar.');
    }

    /**
     * Inicia el proceso de transformación de la imagen seleccionada.
     * Utiliza el módulo `Transformer` para convertir el archivo a JPG.
     * Al terminar, persiste los datos en sessionStorage y navega a la
     * página de resultados.
     */
    function transformarImagen() {
        if (!archivoSeleccionado) {
            mostrarAlerta('error', 'Por favor, selecciona una imagen primero.');
            return;
        }

        habilitarBotonProcesar(false);
        limpiarAlertas();
        mostrarProgreso(true, 'Transformando imagen a JPG...');

        // Pequeño timeout para que la UI actualice antes del procesamiento intensivo
        setTimeout(function () {
            Transformer.transformarAJPG(archivoSeleccionado, function (resultado) {
                mostrarProgreso(false);
                habilitarBotonProcesar(true);

                if (!resultado.exito) {
                    // Si la imagen no pudo reducirse pero sí se transformó, aún podemos mostrar resultados
                    if (resultado.transformado) {
                        mostrarAlerta('advertencia', resultado.mensaje + ' Se mostrará la imagen transformada de todos modos.');
                        guardarYRedirigir(resultado);
                    } else {
                        mostrarAlerta('error', resultado.mensaje);
                    }
                    return;
                }

                mostrarAlerta('exito', 'Imagen transformada correctamente. Redirigiendo a resultados...');
                guardarYRedirigir(resultado);
            });
        }, 100);
    }

    /**
     * Guarda los datos de resultado en sessionStorage y redirige a la página
     * de resultados (`resultado.html`).
     * @param {Object} resultado - El objeto de resultado devuelto por `Transformer.transformarAJPG`.
     */
    function guardarYRedirigir(resultado) {
        // Preparar los datos serializables para sessionStorage (sin el Blob)
        var datos = {
            exito: resultado.exito,
            mensaje: resultado.mensaje,
            original: resultado.original,
            transformado: {
                nombre: resultado.transformado.nombre,
                tipo: resultado.transformado.tipo,
                peso: resultado.transformado.peso,
                pesoFormateado: resultado.transformado.pesoFormateado,
                calidad: resultado.transformado.calidad,
                dataURL: resultado.transformado.dataURL   // Data URL para mostrar/descargar
            }
        };

        try {
            sessionStorage.setItem('resultadoTransformacion', JSON.stringify(datos));
        } catch (e) {
            // sessionStorage puede fallar si el dataURL es demasiado grande
            // En ese caso, guardamos todo excepto el dataURL y mostramos advertencia
            datos.transformado.dataURL = null;
            datos.dataURL_truncado = true;
            sessionStorage.setItem('resultadoTransformacion', JSON.stringify(datos));
        }

        // Redirigir después de un breve delay para que el usuario vea el mensaje de éxito
        setTimeout(function () {
            window.location.href = 'resultado.html';
        }, 1200);
    }

    // ════════════════════════════════════════════════════════════════════════════
    // EVENTOS
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Abre el selector de archivos al hacer clic en la drop zone o en el botón de selección.
     */
    $dropZone.on('click', function () {
        $inputImagen.trigger('click');
    });

    $btnSeleccionar.on('click', function (e) {
        e.stopPropagation(); // Evitar doble disparo con el click de la drop zone
        $inputImagen.trigger('click');
    });

    /**
     * Evento: usuario selecciona un archivo mediante el selector nativo.
     */
    $inputImagen.on('change', function () {
        var archivo = this.files && this.files[0];
        if (archivo) {
            procesarSeleccion(archivo);
        }
    });

    /**
     * Eventos de Drag & Drop sobre la drop zone.
     */
    $dropZone.on('dragover dragenter', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $dropZone.addClass('drag-over');
    });

    $dropZone.on('dragleave dragend drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $dropZone.removeClass('drag-over');
    });

    $dropZone.on('drop', function (e) {
        var archivos = e.originalEvent.dataTransfer.files;
        if (archivos && archivos.length > 0) {
            procesarSeleccion(archivos[0]);
        }
    });

    /**
     * Evento: clic en el botón "Transformar a JPG".
     */
    $btnProcesar.on('click', function () {
        transformarImagen();
    });

    /**
     * Evento: clic en el botón "Limpiar" (cancela la selección actual).
     */
    $btnLimpiar.on('click', function () {
        limpiarUI();
    });

    // ════════════════════════════════════════════════════════════════════════════
    // INICIALIZACIÓN
    // ════════════════════════════════════════════════════════════════════════════

    // Estado inicial: botón de procesar deshabilitado hasta que haya un archivo válido
    habilitarBotonProcesar(false);

    // Limpiar datos de sesión previos al cargar el formulario de nuevo
    sessionStorage.removeItem('resultadoTransformacion');

});
