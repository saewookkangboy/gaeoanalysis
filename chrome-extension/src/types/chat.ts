export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatHistory {
  analysisId: string;
  url: string;
  messages: Message[];
  lastUpdated: number;
}

