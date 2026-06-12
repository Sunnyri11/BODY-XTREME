document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById("form-login");
    const contenedorAlertas = document.getElementById("contenedor-alertas");
    const btnIngresar = document.getElementById("btn-ingresar");
    const btnTexto = document.getElementById("btn-texto");
    const btnSpinner = document.getElementById("btn-spinner");

    const API_BASE_URL = window.EnvConfig.ROUTES.LOGIN;

    // Función auxiliar para pintar alertas rápidamente
    function mostrarAlerta(mensaje, tipo = "danger") {
        contenedorAlertas.innerHTML = `
            <div class="alert alert-${tipo} border-0 bg-${tipo} text-white py-2 shadow-sm animate__animated animate__fadeIn">
                ${mensaje}
            </div>
        `;
    }

    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault(); // Detener el envío por defecto

        // 1. Limpiar alertas previas
        contenedorAlertas.innerHTML = "";

        // 2. Capturar y limpiar datos de los inputs
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        // Validación 1: Campos vacíos
        if (!email || !password) {
            mostrarAlerta("Por favor, completa todos los campos requeridos.");
            return;
        }

        // Validación 2: Formato de correo electrónico válido
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexEmail.test(email)) {
            mostrarAlerta("El formato del correo electrónico no es válido.");
            document.getElementById("email").focus();
            return;
        }

        // Validación 3: Largo mínimo de la contraseña (Ajusta según tu backend)
        if (password.length < 6) {
            mostrarAlerta("La contraseña debe tener al menos 6 caracteres.");
            document.getElementById("password").focus();
            return;
        }

        // ==========================================
        // SI PASA LAS VALIDACIONES -> PASAMOS A LA API
        // ==========================================

        // Estado visual de carga (Spinner activo)
        btnIngresar.disabled = true;
        btnTexto.textContent = "VERIFICANDO...";
        btnSpinner.classList.remove("d-none");

        try {
            const response = await fetch(`${API_BASE_URL}`, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            // Si el backend responde con un error de validación (Ej: error 422 o 401)
            if (!response.ok) {
                // Si Laravel devuelve errores específicos por campo (errors: { email: [...] })
                if (data.errors) {
                    const primerError = Object.values(data.errors)[0][0];
                    throw new Error(primerError);
                }
                throw new Error(data.message || "Credenciales incorrectas.");
            }

            // --- LOGIN EXITOSO ---
            mostrarAlerta("¡Acceso concedido! Redireccionando...", "success");

            // Guardar credenciales de sesión en el navegador
            if (data.access_token) {

                localStorage.setItem("toke_usuario", data.access_token);
            }
            if (data.user) {
                localStorage.setItem("usuario_nombre", `${data.user.name}`);
                localStorage.setItem("usuario_rol", `${data.user.role}`);
            }
            if (data.user.idpersonal !== undefined && data.user.idpersonal !== null) {
                localStorage.setItem('id_personal', data.user.idpersonal);
            } else {
                console.warn("⚠️ El backend no envió el 'idpersonal' en el login.");
            }

            // Redirección controlada
            setTimeout(() => {
                let ruta = "/index.html";
                switch (data.user.role) {
                    case 'cliente':
                        ruta = "/routes/cliente/indexCliente.html";
                        break;
                    case 'personal':
                        ruta = "/routes/personal/indexPersonal.html";
                        break;
                    case 'entrenador':
                        ruta = "/routes/entrenador/indexEntrenador.html";
                        break;

                    default:
                        ruta = "/index.html";
                        break;
                }
                window.location.href = ruta;
            }, 1500);

        } catch (error) {
            // --- MANEJO DE ERRORES DEL SERVIDOR ---
            console.error("Error devuelto:", error);
            mostrarAlerta(error.message);

            // Reestablecer el botón para reintentar
            btnIngresar.disabled = false;
            btnTexto.textContent = "INGRESAR";
            btnSpinner.classList.add("d-none");
        }
    });
});