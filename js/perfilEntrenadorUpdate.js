
const API_URL = 'http://127.0.0.1:8000/api/entrenador/perfil';
const API_ESPECIALIDADES_URL = 'http://127.0.0.1:8000/api/especialidades';
const form = document.getElementById('form-actualizar-entrenador');
const btnGuardar = document.getElementById('btn-guardar');
const alertContainer = document.getElementById('alert-container');
const selectEspecialidad =
    document.getElementById('id_especialidad');

const formEspecialidad =
    document.getElementById('form-nueva-especialidad');

const btnGuardarEspecialidad =
    document.getElementById('btn-guardar-especialidad');

const especialidadAlertContainer =
    document.getElementById('especialidad-alert-container');

// Cabeceras de autenticación obligatorias
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('toke_usuario')}`
    };
}

// 1. CARGA INICIAL: Rellenar el formulario al cargar la página
// document.addEventListener('DOMContentLoaded', async () => {
//     try {
//         const response = await fetch(API_URL, {
//             method: 'GET',
//             headers: getAuthHeaders()
//         });

//         if (response.status === 401) {
//             mostrarAlerta('Tu sesión ha expirado o no estás autorizado. Redirigiendo...', 'danger');
//             setTimeout(() => window.location.href = 'login.html', 2000);
//             return;
//         }

//         if (!response.ok) throw new Error('No se pudo recuperar la información del perfil.');

//         const data = await response.json();

//         // Mapeo de datos a los inputs
//         document.getElementById('nombre').value = data.usuario.Nombre || '';
//         document.getElementById('paterno').value = data.usuario.Paterno || '';
//         document.getElementById('materno').value = data.usuario.Materno || '';
//         document.getElementById('telefono').value = data.usuario.Telefono || '';
//         // document.getElementById('especialidad').value = data.Especialidad || '';
//         document.getElementById('especialidad').value =
//             data.especialidad?.nombre_Especialidad || '';
//         document.getElementById('correo').value = data.usuario.Correo_Electronico || '';

//     } catch (error) {
//         console.error(error);
//         mostrarAlerta('⚠️ Error al conectar con el servidor para cargar los datos.', 'danger');
//         btnGuardar.disabled = true;
//     }
// });
document.addEventListener(
'DOMContentLoaded',
async () => {

    await cargarEspecialidades();

    try {

        const response =
            await fetch(
                API_URL,
                {
                    method: 'GET',
                    headers: getAuthHeaders()
                }
            );

        if (response.status === 401) {

            mostrarAlerta(
                'Sesión expirada.',
                'danger'
            );

            return;
        }

        const data =
            await response.json();

        document.getElementById('nombre').value =
            data.usuario.Nombre || '';

        document.getElementById('paterno').value =
            data.usuario.Paterno || '';

        document.getElementById('materno').value =
            data.usuario.Materno || '';

        document.getElementById('telefono').value =
            data.usuario.Telefono || '';

        document.getElementById('correo').value =
            data.usuario.Correo_Electronico || '';

        selectEspecialidad.value =
            data.id_Especialidad;

    } catch (error) {

        mostrarAlerta(
            'Error cargando información.',
            'danger'
        );

        btnGuardar.disabled = true;

    }

});

// 2. FUNCIÓN DE VALIDACIÓN (Lógica del lado del cliente)
function validarFormulario(datos) {
    // Expresiones regulares para control de formatos
    const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexTelefono = /^[0-9]+$/;

    // Validar Nombre
    if (!datos.Nombre || datos.Nombre.length < 2) {
        return 'El nombre debe tener al menos 2 caracteres.';
    }
    if (!regexLetras.test(datos.Nombre)) {
        return 'El nombre solo puede contener letras y espacios.';
    }

    // Validar Apellido Paterno
    if (!datos.Paterno || datos.Paterno.length < 2) {
        return 'El apellido paterno debe tener al menos 2 caracteres.';
    }
    if (!regexLetras.test(datos.Paterno)) {
        return 'El apellido paterno solo puede contener letras.';
    }

    // Validar Apellido Materno (Opcional, pero si se llena se valida)
    if (datos.Materno && !regexLetras.test(datos.Materno)) {
        return 'El apellido materno solo puede contener letras.';
    }

    // Validar Teléfono (Ajusta la longitud mínima/máxima según tu país, ej: Bolivia suele ser 8 dígitos)
    if (!datos.Telefono) {
        return 'El campo teléfono es obligatorio.';
    }
    if (!regexTelefono.test(datos.Telefono)) {
        return 'El teléfono debe contener únicamente números.';
    }
    if (datos.Telefono.length < 7 || datos.Telefono.length > 10) {
        return 'El teléfono debe tener un rango válido de entre 7 y 10 dígitos.';
    }

    // Validar Especialidad
    // if (!datos.Especialidad || datos.Especialidad.length < 3) {
    //     return 'La especialidad debe tener al menos 3 caracteres.';
    // }
    if (!datos.id_Especialidad) {
        return 'Debe seleccionar una especialidad.';
    }
    // Validar Correo Electrónico
    if (!datos.Correo_Electronico) {
        return 'El correo electrónico es obligatorio.';
    }
    if (!regexEmail.test(datos.Correo_Electronico)) {
        return 'Por favor, introduce una dirección de correo electrónico válida.';
    }

    return null; // Todo está correcto
}

// 3. ENVÍO DEL FORMULARIO Y CONSUMO DE LA API
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Recolección y limpieza de datos preliminar (.trim())
    const payload = {
        Nombre: document.getElementById('nombre').value.trim(),
        Paterno: document.getElementById('paterno').value.trim(),
        Materno: document.getElementById('materno').value.trim(),
        Telefono: document.getElementById('telefono').value.trim(),
        Correo_Electronico: document.getElementById('correo').value.trim(),
        // Especialidad: document.getElementById('especialidad').value.trim()
        id_Especialidad: parseInt(selectEspecialidad.value)
    };

    // Ejecutar las validaciones creadas
    const errorValidacion = validarFormulario(payload);

    if (errorValidacion) {
        // Si hay un error de formato, detenemos el flujo y avisamos al usuario
        mostrarAlerta(`${errorValidacion}`, 'warning');
        return;
    }

    // Si pasa las validaciones, preparamos la interfaz para el envío
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Procesando...';

    try {
        const response = await fetch(`${API_URL}/actualizar`, {
            method: 'PUT', // Cámbialo a 'PUT' si el Backend exige ese método en la ruta
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        // Manejo de errores específicos devueltos por el servidor (ej: Correo duplicado en BD)
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error del servidor al intentar actualizar.');
        }

        mostrarAlerta('¡Tus datos han sido actualizados con éxito! Redirigiendo...', 'success');

        // Retorno exitoso al panel de control
        setTimeout(() => {
            window.location.href = 'indexEntrenador.html';
        }, 2000);

    } catch (error) {
        console.error(error);
        mostrarAlerta(`No se pudo guardar: ${error.message}`, 'danger');

        // Reactivar el botón para que el usuario pueda corregir e intentar de nuevo
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar Cambios';
    }
});

// Función auxiliar para renderizar alertas de Bootstrap dinámicamente
function mostrarAlerta(mensaje, tipo) {
    alertContainer.innerHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    // Desplazar la pantalla automáticamente hacia arriba para ver la alerta si el formulario es largo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


async function cargarEspecialidades(
    idSeleccionado = null
) {

    try {

        const response =
            await fetch(
                API_ESPECIALIDADES_URL,
                {
                    method: 'GET',
                    headers: getAuthHeaders()
                }
            );

        if (!response.ok)
            throw new Error();

        const especialidades =
            await response.json();

        selectEspecialidad.innerHTML = `
            <option value="" disabled>
                Seleccione una especialidad
            </option>
        `;

        especialidades.forEach(e => {

            selectEspecialidad.innerHTML += `
                <option value="${e.id_Especialidad}">
                    ${e.nombre_Especialidad}
                </option>
            `;

        });

        if (idSeleccionado) {

            selectEspecialidad.value =
                idSeleccionado;

        }

    } catch {

        mostrarAlerta(
            'No se pudieron cargar las especialidades.',
            'danger'
        );

    }

}

formEspecialidad.addEventListener(
    'submit',
    async (e) => {

        e.preventDefault();

        const payload = {

            nombre_Especialidad:
                document
                    .getElementById(
                        'nombre_especialidad'
                    )
                    .value
                    .trim()

        };

        try {

            const response =
                await fetch(
                    API_ESPECIALIDADES_URL,
                    {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify(payload)
                    }
                );

            const data =
                await response.json();

            if (!response.ok)
                throw new Error(
                    data.message
                );

            bootstrap.Modal
                .getInstance(
                    document.getElementById(
                        'modalNuevaEspecialidad'
                    )
                )
                .hide();

            formEspecialidad.reset();

            await cargarEspecialidades(
                data.especialidad.id_Especialidad
            );

            mostrarAlerta(
                'Especialidad creada correctamente.',
                'success'
            );

        } catch (error) {

            especialidadAlertContainer.innerHTML =
                `
                <div class="alert alert-danger">
                    ${error.message}
                </div>
                `;
        }

    }
);