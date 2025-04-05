import { AiError, type AiResponse, DeepseekModel, KimiModel } from "@/types/ai";

const M = 1000000;
const priceMap = {
  [DeepseekModel["deepseek-chat"]]: {
    prompt_cache_hit_tokens: 0.5 / M,
    prompt_cache_miss_tokens: 2 / M,
    completion_tokens: 8 / M,
  },
  [DeepseekModel["deepseek-reasoner"]]: {
    prompt_cache_hit_tokens: 1 / M,
    prompt_cache_miss_tokens: 4 / M,
    completion_tokens: 16 / M,
  },
  [KimiModel["moonshot-v1-8k"]]: { total_tokens: 12 / M },
};
export const getPrice = <T extends Record<string, number>>(
  usage: T,
  model: keyof typeof priceMap,
) => {
  const price = Object.entries(priceMap[model]).reduce<number>(
    (pre, [key, price]) => {
      if (key in usage) {
        const token = usage[key];
        return pre + token * (price || 0);
      }
      return pre;
    },
    0,
  );
  const precision = 4;
  const factor = Math.pow(10, precision);
  return Math.floor(price * factor) / factor;
};

export class AI {
  url = "";
  key = "";
  constructor(public model: DeepseekModel | KimiModel) {
    switch (model) {
      case DeepseekModel["deepseek-chat"]:
      case DeepseekModel["deepseek-reasoner"]: {
        const url = process.env.DEEPSEEP_URL;
        if (!url) throw new Error("DeepseekModel requires a url");
        const key = process.env.DEEPSEEP_API;
        if (!key) throw new Error("DeepseekModel requires a key");
        this.url = url;
        this.key = key;
        return this;
      }
      case KimiModel["moonshot-v1-8k"]: {
        const url = process.env.MOONSHOT_URL;
        if (!url) throw new Error("KimiModel requires a url");
        const key = process.env.MOONSHOT_API;
        if (!key) throw new Error("KimiModel requires a key");
        this.url = url;
        this.key = key;
        return this;
      }
      default:
        throw new Error("Invalid model");
    }
  }

  async fetch<T>(prompt: string, content: string) {
    if (!prompt) throw new AiError("prompt missing");
    const res = await fetch(`${this.url}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.key}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content },
        ],
        stream: false,
      }),
    });
    if (!res.ok) throw new AiError(`${this.model} fetch fail`, res.clone());
    const body = (await res.clone().json()) as AiResponse;
    const output = body.choices.at(0)?.message.content;
    if (!output) throw new AiError("Content is empty", res.clone());
    let json:
      | T
      | {
          error: string;
          message: string;
        } = { error: "", message: "" };
    try {
      json = JSON.parse(output) as
        | T
        | {
            error: string;
            message: string;
          };
    } catch {
      throw new AiError(`output is not JSON: ${output}`, res.clone());
    }
    if (
      (
        json as {
          error: string;
          message: string;
        }
      ).error
    )
      throw new AiError(
        (
          json as {
            error: string;
            message: string;
          }
        ).error,
        res.clone(),
      );
    return {
      data: json as T,
      price: getPrice(body.usage, this.model),
      usage: body.usage,
    };
  }
}
