import { callGemini, parseGeminiJson } from "./gemini"

// ── 타입 정의 ──────────────────────────────────────────────

export type ModelName = "claude-sonnet" | "gemini-flash"

export interface AIOptions {
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export interface AIProvider {
  generateText(prompt: string, options?: AIOptions): Promise<string>
  generateJSON<T>(prompt: string, options?: AIOptions): Promise<T>
}

// ── 기본 모델 설정 ──────────────────────────────────────────

export function getDefaultModel(): ModelName {
  const env = process.env.AI_DEFAULT_MODEL
  if (env === "claude-sonnet") return "claude-sonnet"
  return "gemini-flash" // 기본값: Gemini (빠르고 무료 티어)
}

// ── Claude Provider (키 사망 → Gemini 로 백킹) ──────────────
// Anthropic 키가 죽어 있어 "claude-sonnet" 선택 시에도 실제로는 Gemini 로
// 처리한다. 향후 Claude 키가 살아나면 이 provider 만 교체하면 된다.
class AnthropicProvider implements AIProvider {
  async generateText(prompt: string, options?: AIOptions): Promise<string> {
    return callGemini(prompt, options?.systemPrompt ?? TEACHER_SYSTEM, {
      maxOutputTokens: options?.maxTokens ?? 2048,
    })
  }

  async generateJSON<T>(prompt: string, options?: AIOptions): Promise<T> {
    const text = await callGemini(prompt, options?.systemPrompt ?? TEACHER_SYSTEM, {
      maxOutputTokens: options?.maxTokens ?? 2048,
      json: true,
    })
    return parseGeminiJson<T>(text)
  }
}

// ── Gemini Provider ─────────────────────────────────────────

class GeminiProvider implements AIProvider {
  async generateText(prompt: string, options?: AIOptions): Promise<string> {
    return callGemini(prompt, options?.systemPrompt ?? TEACHER_SYSTEM)
  }

  async generateJSON<T>(prompt: string, options?: AIOptions): Promise<T> {
    const text = await this.generateText(prompt, options)
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    return JSON.parse(cleaned) as T
  }
}

// ── 팩토리 ──────────────────────────────────────────────────

const providers: Record<ModelName, AIProvider> = {
  "claude-sonnet": new AnthropicProvider(),
  "gemini-flash": new GeminiProvider(),
}

export function getProvider(model?: ModelName): AIProvider {
  return providers[model ?? getDefaultModel()]
}

// ── 공통 시스템 프롬프트 ────────────────────────────────────

const TEACHER_SYSTEM = `당신은 대한민국 영어교사를 지원하는 AI 어시스턴트입니다.
모든 응답은 한국어로 작성하되, 영어 교육 자료 생성 시에는 영어를 사용합니다.
2022 개정 교육과정, CEFR, Lexile 프레임워크에 대한 전문 지식을 갖추고 있습니다.
수능 영어, 교수법, 평가 설계에 대한 전문가 수준의 조언을 제공합니다.`
