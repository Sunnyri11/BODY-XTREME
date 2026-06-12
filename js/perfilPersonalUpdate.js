document.addEventListener('DOMContentLoaded', () => {
    const formUpdate = document.getElementById('form-actualizar-staff');
    if (formUpdate) {
        formUpdate.addEventListener('submit', actualizarDatosPersonal);
    }
});

async function actualizarDatosPersonal(e) {
    e.preventDefault();
    
    const alertError = document.getElementById('alert-error-edit');
    const alertSuccess = document.getElementById('alert-success-edit');
    
    alertError.classList.add('d-none');
    alertSuccess.classList.add('d-none');

    // 1. Armamos el JSON 
    const datosEnvio = {
        "Nombre": document.getElementById('edit-nombre').value.trim(),
        "Paterno": document.getElementById('edit-paterno').value.trim(),
        "Materno": document.getElementById('edit-materno').value.trim(),
        "Telefono": parseInt(document.getElementById('edit-telefono').value),
        "Correo_Electronico": document.getElementById('edit-correo').value.trim(),
        "Contraseña": document.getElementById('edit-password').value || "", 
        "Sueldo": parseFloat(document.getElementById('edit-sueldo').value)
    };

    // Obtenemos tu ID del localStorage
    const miId = localStorage.getItem('id_personal');
    const URL_UPDATE = `http://127.0.0.1:8000/api/personal/staff/${miId}`; 

    try {
        const response = await fetch(URL_UPDATE, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(datosEnvio)
        });

        const jsonRespuesta = await response.json();

        if (!response.ok) {
            let errorDetallado = jsonRespuesta.message || "Error al actualizar.";
            if (response.status === 422 && jsonRespuesta.errors) {
                errorDetallado = Object.values(jsonRespuesta.errors).map(err => err[0]).join("<br>");
            }
            throw new Error(errorDetallado);
        }

        alertSuccess.innerHTML = "¡Datos del personal actualizados con éxito!";
        alertSuccess.classList.remove('d-none');

        setTimeout(() => {
            window.location.href = 'indexPersonal.html';
        }, 2000);

    } catch (error) {
        alertError.innerHTML = error.message;
        alertError.classList.remove('d-none');
    }
}