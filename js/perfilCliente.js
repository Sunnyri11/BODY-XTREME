// Configuración base de la API
const API_BASE_URL = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();
    cargarDatosPerfil();

    const formActualizar = document.getElementById('form-actualizar-cliente');
    if (formActualizar) {
        formActualizar.addEventListener('submit', actualizarDatosPerfil);
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', cerrarSesion);
    }
});

function verificarSesion() {
    const token = localStorage.getItem('toke_usuario');
    if (!token) window.location.href = '/login.html';
}

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('toke_usuario')}`
    };
}

async function cargarDatosPerfil() {
    try {
        const response = await fetch(`${API_BASE_URL}/miperfil`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('No se pudieron obtener los datos del perfil.');

        const data = await response.json();
        const { pagos, inscripciones } = data;
        const nombreCompleto = `${data.usuario.Nombre} ${data.usuario.Paterno ?? ''} ${data.usuario.Materno ?? ''}`.trim();

        // --- PRECARGA DEL FORMULARIO EDITAR ---
        if (document.getElementById('edit-nombre')) {
            document.getElementById('edit-nombre').value = data.usuario.Nombre ?? '';
            document.getElementById('edit-paterno').value = data.usuario.Paterno ?? '';
            document.getElementById('edit-materno').value = data.usuario.Materno ?? '';
            document.getElementById('edit-telefono').value = data.usuario.Telefono ?? '';
            document.getElementById('edit-correo').value = data.usuario.Correo_Electronico ?? '';
            return; // Detiene la ejecución aquí si estamos en editCliente.html
        }

        // --- RENDERIZAR PANEL PRINCIPAL ---
        if (document.getElementById('sidebar-user-badge')) {
            document.getElementById('sidebar-user-badge').textContent = "CLIENTE";
        }
        if (document.getElementById('nombre-cliente-header')) {
            document.getElementById('nombre-cliente-header').textContent = nombreCompleto.toUpperCase();
        }
        // Estado
        const estadoElement = document.getElementById('estado-cliente');
        if (estadoElement) {
            const nombreEstado = data.estado?.Estado ?? 'Activo';
            estadoElement.textContent = nombreEstado;
            estadoElement.style.backgroundColor = nombreEstado === 'Activo' ? '#00ff88' : '#dc3545';
            estadoElement.style.color = nombreEstado === 'Activo' ? '#000' : '#fff';
        }

        // Tarjetas Resumen
        if (document.getElementById('telefono-cliente')) {
            document.getElementById('telefono-cliente').textContent = data.usuario.Telefono ?? 'N/A';
            document.getElementById('correo-cliente').textContent = data.usuario.Correo_Electronico;
            document.getElementById('ci-cliente').textContent = data.CI_Cliente;
            document.getElementById('fecha-registro').textContent = formatFecha(data.Fecha_Registro);

            // Calcular Total Invertido (Suma de Montos)
            let totalPagado = 0;
            if (pagos && pagos.length > 0) {
                totalPagado = pagos.reduce((suma, pago) => suma + parseFloat(pago.Monto || 0), 0);

                // Mostrar plan más reciente
                const ultimoPago = pagos[pagos.length - 1];
                let nombreUltimoPlan = ultimoPago.membresia?.Nombre_Plan || 'Plan Activo';
                document.getElementById('plan-actual').textContent = nombreUltimoPlan;
            } else {
                document.getElementById('plan-actual').textContent = 'Sin plan';
            }

            document.getElementById('total-pagado').textContent = `${totalPagado.toFixed(2)} Bs.`;
        }

        // Tabla de Pagos
        const tablaPagosBody = document.getElementById('tabla-pagos');
        if (tablaPagosBody) {
            tablaPagosBody.innerHTML = '';
            if (pagos && pagos.length > 0) {
                pagos.forEach(pago => {
                    let nombrePlan = pago.membresia?.Nombre_Plan || 'Plan Personalizado';

                    tablaPagosBody.innerHTML += `
                        <tr>
                            <td class="fw-bold text-white">${nombrePlan}</td>
                            <td class="text-neon-highlight fw-bold">${pago.Monto ?? 0} Bs.</td>
                            <td>${formatFecha(pago.Fecha_Inicio)}</td>
                            <td class="text-warning">${formatFecha(pago.Fecha_Final)}</td>
                            <td>${formatFecha(pago.Fecha_Pago)}</td>
                        </tr>
                    `;
                });
            } else {
                tablaPagosBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted p-4">No tienes pagos registrados</td></tr>`;
            }
        }

        // Tabla de Clases (Agrupadas para no repetir filas)
        const tablaClasesBody = document.getElementById('tabla-clases');
        if (tablaClasesBody) {
            tablaClasesBody.innerHTML = '';

            if (inscripciones && inscripciones.length > 0) {
                const clasesUnicas = {};

                inscripciones.forEach(ins => {
                    const clase = ins.clase;
                    if (!clase) return;

                    if (!clasesUnicas[clase.id_Clase]) {
                        clasesUnicas[clase.id_Clase] = {
                            id_Clase: clase.id_Clase,
                            Nombre: clase.Nombre,
                            Descripción: clase.Descripción,
                            todosLosHorarios: []
                        };
                    }
                    const horarios = clase.horarios ?? [];
                    clasesUnicas[clase.id_Clase].todosLosHorarios.push(...horarios);
                });

                Object.values(clasesUnicas).forEach(claseAgrupada => {
                    let infoEntrenadores = 'Sin instructor';
                    let infoHorariosCombinados = 'Por asignar';

                    if (claseAgrupada.todosLosHorarios.length > 0) {
                        const listaEntrenadores = claseAgrupada.todosLosHorarios.map(h => {
                            if (h.entrenador?.usuario) {
                                return `${h.entrenador.usuario.Nombre} ${h.entrenador.usuario.Paterno ?? ''}`.trim();
                            }
                            return 'Por asignar';
                        });
                        infoEntrenadores = [...new Set(listaEntrenadores)].join(', ');

                        const listaHorarios = claseAgrupada.todosLosHorarios.map(h => {
                            const nombreDia = h.dia?.Dia ?? 'N/A';
                            const inicio = h.hora?.Hora ? h.hora.Hora.substring(0, 5) : '00:00';
                            return `<span class="badge bg-secondary mb-1">${nombreDia} ${inicio}</span>`;
                        });
                        infoHorariosCombinados = [...new Set(listaHorarios)].join(' ');
                    }

                    tablaClasesBody.innerHTML += `
                        <tr>
                            <td class="text-neon-highlight fw-bold">#${claseAgrupada.id_Clase}</td>
                            <td class="fw-bold text-white">${claseAgrupada.Nombre}</td>
                            <td class="small text-white-50 text-start" style="max-width: 200px;">${claseAgrupada.Descripción ?? 'Sin descripción'}</td>
                            <td>${infoEntrenadores}</td>
                            <td>${infoHorariosCombinados}</td>
                        </tr>
                    `;
                });
            } else {
                tablaClasesBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted p-4">No tienes clases inscritas</td></tr>`;
            }
        }
    } catch (error) {
        console.error('Error detallado:', error);
    }
}

async function actualizarDatosPerfil(e) {
    e.preventDefault();
    const alertError = document.getElementById('alert-error-edit');
    const alertSuccess = document.getElementById('alert-success-edit');

    if (alertError) alertError.classList.add('d-none');
    if (alertSuccess) alertSuccess.classList.add('d-none');

    const datosActualizados = {
        Nombre: document.getElementById('edit-nombre').value,
        Paterno: document.getElementById('edit-paterno').value,
        Materno: document.getElementById('edit-materno').value,
        Telefono: document.getElementById('edit-telefono').value,
        Correo_Electronico: document.getElementById('edit-correo').value
    };

    const passwordInput = document.getElementById('edit-password').value;
    if (passwordInput.trim() !== "") {
        datosActualizados.Contraseña = passwordInput;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/miperfil/actualizar`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(datosActualizados)
        });

        const respuesta = await response.json();

        if (response.ok) {
            if (alertSuccess) {
                alertSuccess.textContent = "¡Perfil actualizado con éxito! Redireccionando...";
                alertSuccess.classList.remove('d-none');
            }
            setTimeout(() => window.location.href = '/routes/cliente/indexCliente.html', 2000);
        } else {
            if (alertError) {
                alertError.textContent = `Error: ${respuesta.message || 'No se pudieron guardar los cambios.'}`;
                alertError.classList.remove('d-none');
            }
        }
    } catch (error) {
        if (alertError) {
            alertError.textContent = 'Error de red. No se pudo conectar con el servidor.';
            alertError.classList.remove('d-none');
        }
    }
}

async function cerrarSesion() {
    if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) return;
    try {
        await fetch(`${API_BASE_URL}/logout`, { method: 'POST', headers: getAuthHeaders() });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        localStorage.removeItem('toke_usuario');
        window.location.href = '/index.html';
    }
}

function formatFecha(fechaString) {
    if (!fechaString) return '--';
    const fecha = new Date(fechaString);
    const offset = fecha.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(fecha.getTime() + offset);
    if (isNaN(fechaLocal.getTime())) return fechaString;
    return fechaLocal.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}