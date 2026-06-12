const API_BASE_URL = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosStaff();
});

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('toke_usuario')}`
    };
}

async function cargarDatosStaff() {
    try {
        // 1. Descargamos la lista completa de todo el personal
        // 1. Descargamos la lista completa de todo el personal
        const response = await fetch(`${API_BASE_URL}/personal/staff`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        // --- NUEVAS LUPAS PARA VER QUÉ DICE LARAVEL ---
        console.log("👉 STATUS DE LARAVEL:", response.status);
        
        if (!response.ok) {
            const errorDelBackend = await response.text();
            console.error("👉 MENSAJE SECRETO DE LARAVEL:", errorDelBackend);
            throw new Error(`Laravel rechazó la petición con status: ${response.status}`);
        }
        // ----------------------------------------------

        const listaStaff = await response.json();

        // 2. Obtenemos tu ID guardado en el login
        const miId = localStorage.getItem('id_personal');
        console.log("👉 Mi ID en localStorage es:", miId);
        console.log("👉 La lista de staff que llegó del servidor es:", listaStaff);

        // 3. Buscamos tu perfil exacto en la lista
        const miPerfil = listaStaff.find(persona => persona.id_Personal == miId);

        if (!miPerfil) {
            console.error("No te encontraste en la lista de staff.");
            return;
        }

        // --- LÓGICA PARA: verPerfilPersonal.html (Tarjetas de Lectura) ---
        if (document.getElementById('info-nombre')) {
            document.getElementById('info-nombre').textContent = `${miPerfil.usuario.Nombre} ${miPerfil.usuario.Paterno} ${miPerfil.usuario.Materno || ''}`.trim();
            document.getElementById('info-correo').textContent = miPerfil.usuario.Correo_Electronico;
            document.getElementById('info-telefono').textContent = miPerfil.usuario.Telefono || 'No registrado';

            // Formatear el sueldo
            const sueldoBOB = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(miPerfil.Sueldo);
            document.getElementById('info-sueldo').textContent = sueldoBOB;

            // Extraer Cargos y Turnos de los arrays (como nos lo pasó Wilder)
            const nombreCargos = miPerfil.cargos && miPerfil.cargos.length > 0
                ? miPerfil.cargos.map(c => c.Nombre_Cargo).join(', ')
                : 'Sin cargo asignado';
            document.getElementById('info-cargos').textContent = nombreCargos;

            const nombreTurnos = miPerfil.turnos && miPerfil.turnos.length > 0
                ? miPerfil.turnos.map(t => t.Turno).join(', ')
                : 'Sin turno asignado';
            document.getElementById('info-turnos').textContent = nombreTurnos;
        }

        // --- LÓGICA PARA: editPersonal.html (Llenado de Formulario) ---
        if (document.getElementById('edit-nombre')) {
            document.getElementById('edit-nombre').value = miPerfil.usuario.Nombre || '';
            document.getElementById('edit-paterno').value = miPerfil.usuario.Paterno || '';
            document.getElementById('edit-materno').value = miPerfil.usuario.Materno || '';
            document.getElementById('edit-telefono').value = miPerfil.usuario.Telefono || '';
            document.getElementById('edit-correo').value = miPerfil.usuario.Correo_Electronico || '';
            document.getElementById('edit-sueldo').value = miPerfil.Sueldo || '';
        }

    } catch (error) {
        console.error('Error al cargar datos del perfil personal:', error);
    }
}