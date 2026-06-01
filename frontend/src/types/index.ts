export interface User {
  username: string;
  token: string;
  isDemo?: boolean;
}

export interface AuthResponse {
  token: string;
  username: string;
  isDemo?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelPrompt?: ModelPrompt | null;
  modelPrompts?: ModelPrompt[] | null;
}

export interface ModelPrompt {
  model: string;
  purpose: string;
}

export interface Chat {
  id: string;
  title: string;
  isPinned: boolean;
  isHidden: boolean;
  updatedAt: number;
  messages: Message[];
}

export interface DownloadState {
  purpose: string;
  status: string;
  progress: number;
  indeterminate: boolean;
}

export interface CustomAlert {
  title: string;
  text: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface TrainingStatus {
  type: 'success' | 'error';
  message: string;
}

export interface PullProgressEvent {
  status?: string;
  error?: string;
  completed?: number;
  total?: number;
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}
