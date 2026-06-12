document.addEventListener('DOMContentLoaded', () => {
    // URL de tu API local para el entrenador
    const API_URL = 'http://127.0.0.1:8000/api/entrenador/perfil';

    // Iniciamos la carga con seguridad
    cargarDatosEntrenador(API_URL);

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', cerrarSesion);
    }
});

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('toke_usuario')}`
    };
}

async function cargarDatosEntrenador(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            console.warn('Token inválido o expirado. Redirigiendo al login...');
            throw new Error('Sesión expirada o no autorizada.');
        }

        if (!response.ok) {
            throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // 1. Renderizar datos del encabezado y sidebar
        const nombreCompleto = `${data.usuario.Nombre} ${data.usuario.Paterno} ${data.usuario.Materno || ''}`.trim();

        document.getElementById('nombre-entrenador').textContent = nombreCompleto.toUpperCase();
        document.getElementById('especialidad-entrenador').textContent = data.especialidad?.nombre_Especialidad || 'Sin especialidad';
        document.getElementById('sidebar-user-badge').textContent = "ENTRENADOR";
        document.getElementById('nombre-entrenador').textContent = nombreCompleto.toUpperCase();

        // 2. Renderizar Tarjetas
        renderizarTarjetasContrato(data);

        // 3. Renderizar Tabla de Horarios y Clases Asignadas
        renderizarTablaHorarios(data.horarios);

    } catch (error) {
        console.error('Hubo un problema al obtener los datos del perfil:', error);
        mostrarMensajeError();
    }
}

function renderizarTarjetasContrato(data) {
    const sueldoFormateado = new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB'
    }).format(data.contrato.Sueldo);

    const fechaIngreso = data.contrato.Fecha_Contratacion.split(' ')[0];
    const fechaVigencia = data.contrato.Fecha_Vigencia.split(' ')[0];

    document.getElementById('sueldo-entrenador').textContent = sueldoFormateado;
    document.getElementById('fecha-ingreso').textContent = formatearFechaLatina(fechaIngreso);
    document.getElementById('fecha-vigencia').textContent = formatearFechaLatina(fechaVigencia);
    
    // Inyectamos solo el dato crudo para no borrar las etiquetas HTML
    document.getElementById('telefono-entrenador').textContent = data.usuario.Telefono;
    document.getElementById('correo-entrenador').textContent = data.usuario.Correo_Electronico;
}

function renderizarTablaHorarios(horarios) {
    const tbody = document.getElementById('tabla-clases-asignadas-body');
    tbody.innerHTML = '';

    if (!horarios || horarios.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-muted p-4">No tienes clases asignadas actualmente.</td></tr>`;
        return;
    }

    horarios.forEach(item => {
        const horaLimpia = item.hora?.Hora ? item.hora.Hora.substring(0, 5) : 'Sin hora';
        const horarioTexto = item.dia?.Dia ? `${item.dia.Dia} a las ${horaLimpia}` : horaLimpia;

        const fila = `
            <tr>
                <td class="text-neon-highlight fw-bold">#${item.clase.id_Clase}</td>
                <td class="fw-bold text-white">${item.clase.Nombre}</td>
                <td class="text-start text-white-50" style="font-size: 0.85rem; max-width: 250px;">
                    ${item.clase.Descripción}
                </td>
                <td><span class="badge bg-secondary px-2 py-1">${item.clase.Cupo_Maximo} pers.</span></td>
                <td class="text-neon-highlight fw-bold">${horarioTexto}</td>
                <td><span class="badge text-dark fw-bold px-3 py-1" style="background-color: #00ff88;">Activa</span></td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

function formatearFechaLatina(fechaString) {
    if (!fechaString) return '--';
    const partes = fechaString.split('-');
    if (partes.length !== 3) return fechaString;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function mostrarMensajeError() {
    document.getElementById('sueldo-entrenador').textContent = 'Error';
    document.getElementById('tabla-clases-asignadas-body').innerHTML = `
        <tr><td colspan="6" class="text-danger p-4 fw-bold"> Error al cargar la información del perfil. Verifica tu conexión o inicia sesión nuevamente.</td></tr>
    `;
}

async function cerrarSesion() {
    if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) return;

    try {
        await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
    } catch (error) {
        console.error('Error al revocar token en servidor:', error);
    } finally {
        localStorage.removeItem('toke_usuario');
        window.location.href = '/index.html';
    }
}