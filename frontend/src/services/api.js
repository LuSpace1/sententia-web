import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inyecta el token de autenticación en cada petición si existe
apiClient.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Token ${user.token}`;
  }
  return config;
});

export const authService = {
  login: (credentials) => apiClient.post('/api/login/', credentials),
  register: (userData) => apiClient.post('/api/register/', userData),
  demoLogin: () => apiClient.post('/api/demo-login/'),
};

export const chatService = {
  sendMessage: (question) => apiClient.post('/api/chat/', { question }),
  train: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/train/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
