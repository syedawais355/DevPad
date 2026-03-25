export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  encrypted: boolean;
  tags: string[];
}

export interface AppSettings {
  theme: 'dark' | 'light';
  fontSize: number;
  lineHeight: number;
}

export interface SharePayload {
  version: number;
  title: string;
  content: string;
  createdAt: number;
}
