import type { ReactNode } from 'react';

export type AspectRatio = '16:9' | '9:16';
export type Resolution = '720p' | '1080p';

export interface GenerationOptions {
  prompt: string;
  image?: File;
  aspectRatio: AspectRatio;
  sound: boolean;
  resolution: Resolution;
}

export interface VideoResult {
  url: string;
  blob?: Blob;
}

export interface VideoMetadata {
  youtubeTitle: string;
  tiktokTitle: string;
  instagramTitle: string;
  facebookTitle: string;
  shopeeAffiliateTitle: string;
  tiktokAffiliateTitle: string;
  tags: string[];
}

// Opsi untuk fitur Auto-Generate
export type MetadataSelection = Partial<Record<keyof Omit<VideoMetadata, 'tags'>, boolean>> & { tags: boolean };

export interface AutoGenerateOptions {
  downloadType: 'zip' | 'mp4';
  metadataSelection: MetadataSelection;
}

export interface AutoGenPrompt {
  id: string;
  text: string;
  status: 'pending' | 'completed';
}

export interface Project {
  id: string;
  name: string;
  prompts: AutoGenPrompt[];
  options: AutoGenerateOptions;
}

export interface AutoGenResultItem {
  id: string;
  result: VideoResult;
  metadata: VideoMetadata;
  prompt: string;
}

// Types for AI Chat
export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    content: string;
}

export interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
}

// Types for AI Image Generator
export type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface ImageGenerationOptions {
  prompt: string;
  aspectRatio: ImageAspectRatio;
  numberOfImages: number;
  style?: string;
  referenceImage?: File | null;
}

export interface ImageResult {
    base64: string;
    url: string;
}

// FIX: Added missing types for PromptGenerator component.
export interface Character {
  id: string;
  name: string;
  ethnicity: string;
  gender: string;
  age: string;
  outfit: string;
  hair: string;
  voice: string;
  description: string;
  action: string;
  customEthnicity: string;
}

export interface Dialogue {
  id: string;
  characterId: string;
  conversation: string;
}

export interface EnvironmentState {
  setting: string;
  lighting: string;
  cameraAngle: string;
  cameraShot: string;
  style: string;
}
