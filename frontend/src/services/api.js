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

const buildAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return user?.token ? { Authorization: `Token ${user.token}` } : {};
};

export const authService = {
  login: (credentials) => apiClient.post('/api/login/', credentials),
  register: (userData) => apiClient.post('/api/register/', userData),
  demoLogin: () => apiClient.post('/api/demo-login/'),
};

export const chatService = {
  sendMessage: (question, chatHistory = []) => apiClient.post('/api/chat/', { question, chat_history: chatHistory }),
  train: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/train/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  pullModel: async (model, { signal, onProgress } = {}) => {
    const response = await fetch(`${API_BASE_URL}/api/models/pull/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify({ model }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'No se pudo iniciar la descarga del modelo.');
    }

    if (!response.body) {
      throw new Error('No se pudo leer el progreso de descarga.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let lastEvent = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        const event = JSON.parse(trimmedLine);
        lastEvent = event;

        if (typeof onProgress === 'function') {
          onProgress(event);
        }

        if (event.status === 'error') {
          throw new Error(event.error || 'No se pudo descargar el modelo.');
        }
      }
    }

    const finalLine = buffer.trim();
    if (finalLine) {
      const event = JSON.parse(finalLine);
      lastEvent = event;
      if (typeof onProgress === 'function') {
        onProgress(event);
      }
      if (event.status === 'error') {
        throw new Error(event.error || 'No se pudo descargar el modelo.');
      }
    }

    return lastEvent;
  },
};
