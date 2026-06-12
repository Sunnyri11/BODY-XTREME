document.addEventListener("DOMContentLoaded", () => {
    console.log("Body Xtreme Frontend Iniciado Correctamente.");

    // URL base de tu API de Laravel
    const API_BASE_URL = "http://127.0.0.1:8000/api";

    // Función principal para traer y renderizar los horarios
    async function cargarHorariosPublicos() {
        const loadingDiv = document.getElementById('loading-horarios');
        const tabla = document.getElementById('tabla-horarios');
        const tbody = document.getElementById('tbody-horarios');

        try {
            const response = await fetch(`${API_BASE_URL}/calendariogimnasio`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error en el servidor: ${response.status}`);
            }

            const horarios = await response.json();

            // Limpiar el cuerpo de la tabla
            tbody.innerHTML = "";

            // Filtrar defensivamente: Solo mostrar horarios cuyo estado sea "Activo"
            const horariosActivos = horarios.filter(item => item.estado?.Estado === "Activo");

            if (horariosActivos.length === 0) {
                loadingDiv.innerHTML = `<p class="text-warning mb-0">No hay clases activas programadas por el momento.</p>`;
                return;
            }

            // Recorrer los datos del JSON e inyectar las filas estructuradas
            horariosActivos.forEach(item => {
                // 1. Extraer datos de la Clase
                const nombreClase = item.clase?.Nombre || 'Disciplina General';
                
                // 2. Extraer datos del Día
                const diaSemana = item.dia?.Dia || 'No asignado';
                
                // 3. Extraer y formatear la Hora (tu JSON devuelve "16:00:00", lo dejamos más limpio como "16:00")
                let horaFormateada = 'Por definir';
                if (item.hora?.Hora) {
                    const partesHora = item.hora.Hora.split(':');
                    if (partesHora.length >= 2) {
                        horaFormateada = `${partesHora[0]}:${partesHora[1]}`;
                    } else {
                        horaFormateada = item.hora.Hora;
                    }
                }
                
                // 4. Extraer datos del Entrenador y su Usuario anidado
                let nombreEntrenador = 'Instructor Staff';
                if (item.entrenador?.usuario) {
                    const u = item.entrenador.usuario;
                    nombreEntrenador = `${u.Nombre} ${u.Paterno}`;
                }
                const especialidad = item.entrenador?.Especialidad || 'Fitness';

                // Crear elemento de fila de Bootstrap
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td><span class="badge rounded-pill badge-clase">${nombreClase}</span></td>
                    <td class="text-white fw-semibold">${diaSemana}</td>
                    <td class="text-info fw-bold">${horaFormateada} Hrs</td>
                    <td>${nombreEntrenador}</td>
                    <td class="text-white"><em>${especialidad}</em></td>
                `;
                tbody.appendChild(fila);
            });

            // Ocultar el cargador de carga y revelar la tabla estructurada
            loadingDiv.classList.add('d-none');
            tabla.classList.remove('d-none');

        } catch (error) {
            console.error("Error conectando con la API de Laravel:", error);
            loadingDiv.innerHTML = `
                <p class="text-danger mb-0"> No se pudieron sincronizar los horarios.</p>
                <small class="text-muted">Verifica que tu servidor de Laravel esté corriendo en ${API_BASE_URL}</small>
            `;
        }
    }

    // Inicializar la consulta inmediatamente al cargar el árbol DOM
    cargarHorariosPublicos();
});