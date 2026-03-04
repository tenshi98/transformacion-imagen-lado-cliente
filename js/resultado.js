/**
 * @module resultado
 * @description Módulo de la página de resultados. Lee los datos del resultado de
 *              la transformación desde sessionStorage (guardados por app.js) y los
 *              renderiza en la interfaz de usuario. También habilita la descarga
 *              de la imagen transformada.
 *
 * @requires jQuery
 * @requires Transformer (solo para formatearTamano)
 */

$(function () {

    // ════════════════════════════════════════════════════════════════════════════
    // REFERENCIAS A ELEMENTOS DEL DOM
    // ════════════════════════════════════════════════════════════════════════════

    var $contenedorResultado = $('#contenedorResultado');
    var $contenedorError     = $('#contenedorError');
    var $imagenOriginal      = $('#imagenOriginal');
    var $imagenTransformada  = $('#imagenTransformada');
    var $btnDescargar        = $('#btnDescargar');
    var $badgeEstado         = $('#badgeEstado');

    // ════════════════════════════════════════════════════════════════════════════
    // FUNCIONES DE UI
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Calcula el porcentaje de ahorro entre el peso original y el transformado.
     * @param {number} pesoOriginal     - Peso del archivo original en bytes.
     * @param {number} pesoTransformado - Peso del archivo transformado en bytes.
     * @returns {number} Porcentaje de reducción (puede ser negativo si aumentó).
     */
    function calcularAhorro(pesoOriginal, pesoTransformado) {
        if (pesoOriginal === 0) return 0;
        return (((pesoOriginal - pesoTransformado) / pesoOriginal) * 100);
    }

    /**
     * Obtiene el nombre legible de un tipo MIME de imagen.
     * @param {string} tipoMime - El tipo MIME (e.g. "image/jpeg").
     * @returns {string} Nombre legible del formato.
     */
    function obtenerNombreFormato(tipoMime) {
        var formatos = {
            'image/jpeg': 'JPEG / JPG',
            'image/jpg': 'JPEG / JPG',
            'image/png': 'PNG',
            'image/gif': 'GIF',
            'image/bmp': 'BMP',
            'image/webp': 'WebP',
            'image/tiff': 'TIFF',
            'image/svg+xml': 'SVG'
        };
        return formatos[tipoMime] || tipoMime || 'Desconocido';
    }

    /**
     * Renderiza la página de resultados con los datos de la transformación.
     * @param {Object} datos - El objeto de resultado guardado en sessionStorage.
     */
    function renderizarResultados(datos) {
        var original       = datos.original;
        var transformada   = datos.transformado;
        var ahorro         = calcularAhorro(original.peso, transformada.peso);
        var ahorroAbs      = Math.abs(ahorro).toFixed(1);
        var ahorroPositivo = ahorro > 0;

        // ── Imágenes de comparación ──────────────────────────────────────────
        // La imagen original no se puede mostrar directamente (no hay Data URL guardada
        // ya que sería duplicar el espacio en sessionStorage). Se usa un placeholder
        // indicativo. La imagen transformada sí tiene Data URL.
        if (transformada.dataURL) {
            $imagenTransformada.attr('src', transformada.dataURL);
            // Intentar recuperar la imagen original desde el formulario si está en el mismo contexto
            // Si no hay, se muestra el placeholder.
            $imagenOriginal.attr('src', transformada.dataURL); // Fallback: muestra misma imagen
            $imagenOriginal.addClass('imagen-placeholder');
            $('#placeholderOriginal').show();
        }

        // ── Badge de estado ──────────────────────────────────────────────────
        if (ahorroPositivo) {
            $badgeEstado.html(
                '<span class="badge-ahorro"> Optimización exitosa · Ahorro del ' + ahorroAbs + '%</span>'
            );
        } else {
            $badgeEstado.html(
                '<span class="badge-ahorro badge-ahorro-negativo"> Sin reducción de peso (' + ahorroAbs + '% mayor)</span>'
            );
        }

        // ── Tabla de estadísticas detalladas ──────────────────────────────────
        var filasDatos = [
            {
                etiqueta: 'Nombre del archivo',
                original: original.nombre,
                transformado: transformada.nombre
            },
            {
                etiqueta: 'Formato',
                original: obtenerNombreFormato(original.tipo),
                transformado: obtenerNombreFormato(transformada.tipo)
            },
            {
                etiqueta: 'Peso del archivo',
                original: original.pesoFormateado,
                transformado: transformada.pesoFormateado
            },
            {
                etiqueta: 'Calidad de compresión',
                original: '—',
                transformado: transformada.calidad + '%'
            }
        ];

        var htmlFilas = '';
        $.each(filasDatos, function (i, fila) {
            htmlFilas += '<tr>' +
                '  <td><strong>' + fila.etiqueta + '</strong></td>' +
                '  <td class="valor-original">' + fila.original + '</td>' +
                '  <td class="valor-transformado">' + fila.transformado + '</td>' +
                '</tr>';
        });

        // Fila de ahorro con estilo condicional
        var claseAhorro = ahorroPositivo ? 'valor-transformado' : 'text-danger';
        var textAhorro = ahorroPositivo
            ? '↓ ' + ahorroAbs + '% menos peso'
            : '↑ ' + ahorroAbs + '% más peso';

        htmlFilas += '<tr style="background:#f0f4f8;">' +
            '  <td><strong>Diferencia de peso</strong></td>' +
            '  <td colspan="2" class="' + claseAhorro + ' text-center"><strong>' + textAhorro + '</strong></td>' +
            '</tr>';

        $('#tablaEstadisticas tbody').html(htmlFilas);

        // ── Botón de descarga ─────────────────────────────────────────────────
        if (transformada.dataURL) {
            $btnDescargar
                .attr('href', transformada.dataURL)
                .attr('download', transformada.nombre)
                .show();
        } else {
            $('#avisoDescargaNoDisponible').show();
            $btnDescargar.hide();
        }

        // Mostrar el contenedor principal de resultados
        $contenedorResultado.show();
    }

    // ════════════════════════════════════════════════════════════════════════════
    // INICIALIZACIÓN
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Al cargar la página, se intenta leer los datos de sessionStorage.
     * Si no existen (acceso directo a la URL), se muestra un error.
     */
    var datosRaw = sessionStorage.getItem('resultadoTransformacion');

    if (!datosRaw) {
        // No hay datos: el usuario accedió directamente sin pasar por el formulario
        $contenedorError.show();
        $contenedorResultado.hide();
        return;
    }

    try {
        var datos = JSON.parse(datosRaw);
        renderizarResultados(datos);
    } catch (e) {
        // Error al parsear los datos almacenados
        $contenedorError.show();
        $contenedorResultado.hide();
    }

    /**
     * Evento: clic en el botón "Procesar otra imagen".
     * Limpia sessionStorage y redirige al formulario.
     */
    $('#btnNuevaImagen').on('click', function () {
        sessionStorage.removeItem('resultadoTransformacion');
        window.location.href = 'index.html';
    });

});
