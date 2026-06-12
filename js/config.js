// js/config.js

const DEVELOPER_MODE = true;

const API_BASE_URL = DEVELOPER_MODE 
    ? "http://127.0.0.1:8000/api"         
    : "https://tu-dominio-produccion.com/api";

const API_ROUTES = {
    LOGIN: `${API_BASE_URL}/login`,
    ENTRENADORES: `${API_BASE_URL}/personal/entrenadores`,
    CONTRATOS:    `${API_BASE_URL}/personal/contratos`,
    ESPECIALIDADES: `${API_BASE_URL}/especialidades`,
    STAFF: `${API_BASE_URL}/personal/staff`
    // Aquí puedes seguir agregando más rutas en el futuro:
    // CLIENTES:  `${API_BASE_URL}/clientes`,
};

window.EnvConfig = {
    ROUTES: API_ROUTES,
    TOKEN: () => localStorage.getItem('toke_usuario'),
    ROL: () => localStorage.getItem('usuario_rol')
};