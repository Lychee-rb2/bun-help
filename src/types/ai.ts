export enum DeepseekModel {
  "deepseek-chat" = "deepseek-chat",
  "deepseek-reasoner" = "deepseek-reasoner",
}
export enum KimiModel {
  "moonshot-v1-8k" = "moonshot-v1-8k",
}
export interface AiResponseBase {
  id: string;
  object: string;
  created: number;
  model: DeepseekModel | KimiModel;
  choices: {
    index: number;
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: "stop";
  }[];
}

export interface DeepseekResponse extends AiResponseBase {
  model: DeepseekModel;
  usage: {
    prompt_cache_hit_tokens: number;
    prompt_cache_miss_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface KimiResponse extends AiResponseBase {
  model: KimiModel;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
export type AiResponse = DeepseekResponse | KimiResponse;

export enum CookbookStepPhase {
  PREPARE = "PREPARE",
  PROGRESS = "PROGRESS",
  DONE = "DONE",
}
export interface Error {
  error: string;
  message: string;
}
export interface CookbookContent {
  steps: {
    content: string;
    phase: CookbookStepPhase;
    key: string;
  }[];
  foods: string[];
  tool: string[];
}

export class AiError extends Error {
  constructor(
    message: string,
    public res?: Response,
  ) {
    super(message);
  }
}

export type PriceMap<R extends AiResponse> = {
  [M in R["model"]]: Partial<{
    [T in keyof R["usage"]]: number;
  }>;
};
