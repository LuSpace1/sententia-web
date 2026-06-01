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

export type MessageRole = 'user' | 'assistant';

export type MessageStatus = 'sending' | 'streaming' | 'completed' | 'error';

export type ChatStatus = 'active' | 'archived';

export interface Citation {
  id: string;
  sourceId: string;
  text: string;
  relevance?: number;
  title?: string;
  url?: string;
  page?: number;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  status?: MessageStatus;
  createdAt?: number;
  citations?: Citation[];
  modelPrompt?: ModelPrompt | null;
  modelPrompts?: ModelPrompt[] | null;
  metadata?: Record<string, unknown>;
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
  createdAt: number;
  updatedAt: number;
  status?: ChatStatus;
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

export interface UserPreferences {
  defaultPracticeArea?: string;
  maxHistoryTurns?: number;
  citationsEnabled?: boolean;
}

export interface PullProgressEvent {
  status?: string;
  error?: string;
  completed?: number;
  total?: number;
}

export type ChatHistoryMessage = Pick<Message, 'role' | 'content'>;
