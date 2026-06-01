import axios from 'axios';
import type { AuthResponse, ChatHistoryMessage, PullProgressEvent } from '../types';

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('user');
  if (raw) {
    try {
      const user = JSON.parse(raw);
      if (user?.token) {
        config.headers.Authorization = `Token ${user.token}`;
      }
    } catch {
      // ignore invalid JSON
    }
  }
  return config;
});

const buildAuthHeaders = (): Record<string, string> => {
  const raw = localStorage.getItem('user');
  if (raw) {
    try {
      const user = JSON.parse(raw);
      if (user?.token) {
        return { Authorization: `Token ${user.token}` };
      }
    } catch {
      // ignore invalid JSON
    }
  }
  return {};
};

export const authService = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post<AuthResponse>('/api/login/', credentials),

  register: (userData: { username: string; email: string; password: string }) =>
    apiClient.post<AuthResponse>('/api/register/', userData),

  demoLogin: () =>
    apiClient.post<AuthResponse & { isDemo: boolean }>('/api/demo-login/'),
};

export const chatService = {
  sendMessage: (question: string, chatHistory: ChatHistoryMessage[] = []) =>
    apiClient.post<{ answer: string }>('/api/chat/', {
      question,
      chat_history: chatHistory,
    }),

  train: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<{ message: string }>('/api/train/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  pullModel: async (
    model: string,
    {
      signal,
      onProgress,
    }: { signal?: AbortSignal; onProgress?: (event: PullProgressEvent) => void } = {}
  ): Promise<PullProgressEvent | null> => {
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
    let lastEvent: PullProgressEvent | null = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        const event: PullProgressEvent = JSON.parse(trimmedLine);
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
      const event: PullProgressEvent = JSON.parse(finalLine);
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
