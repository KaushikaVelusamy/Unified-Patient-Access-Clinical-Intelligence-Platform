export type FlagType = 'boolean' | 'string' | 'number';

export interface FlagDefinition {
  type: FlagType;
  default: boolean | string | number;
  description: string;
  category: 'ai_toggle' | 'ai_model' | 'ai_prompt' | 'segmentation';
}

export interface FlagConfig {
  name: string;
  value: boolean | string | number;
  type: FlagType;
  enabled: boolean;
  targeting: TargetingRule;
  updatedAt: string;
  updatedBy?: string;
}

export interface TargetingRule {
  type: 'all' | 'beta_testers' | 'department' | 'role' | 'percentage' | 'user';
  value?: string | number;
}

export interface FlagEvaluationContext {
  userId: number;
  role?: string;
  department?: string;
  isBetaTester?: boolean;
}

export const FLAG_DEFINITIONS: Record<string, FlagDefinition> = {
  ai_intake_enabled: {
    type: 'boolean',
    default: false,
    description: 'AI Conversational Intake',
    category: 'ai_toggle',
  },
  ai_extraction_enabled: {
    type: 'boolean',
    default: false,
    description: 'AI Document Extraction',
    category: 'ai_toggle',
  },
  ai_coding_enabled: {
    type: 'boolean',
    default: false,
    description: 'AI Medical Coding',
    category: 'ai_toggle',
  },
  ai_conflicts_enabled: {
    type: 'boolean',
    default: false,
    description: 'AI Conflict Detection',
    category: 'ai_toggle',
  },
  gpt_intake_model: {
    type: 'string',
    default: 'gpt-4-turbo',
    description: 'GPT Model for Intake',
    category: 'ai_model',
  },
  gpt_vision_model: {
    type: 'string',
    default: 'gpt-4-vision-preview',
    description: 'GPT Vision Model',
    category: 'ai_model',
  },
  medical_coding_prompt_version: {
    type: 'string',
    default: 'v1',
    description: 'Medical Coding Prompt Version',
    category: 'ai_prompt',
  },
};

export const FLAG_CACHE_TTL = 60;
export const FLAG_POLL_INTERVAL = 30000;
export const FLAG_REDIS_PREFIX = 'flag';
