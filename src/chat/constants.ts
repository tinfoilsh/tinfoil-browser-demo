import { DEFAULT_MODEL, INFERENCE_PROXY_URL } from '@/config'

export const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.'

export const CONSTANTS = {
  INFERENCE_PROXY_URL,
  INFERENCE_PROXY_REPO:
    process.env.NEXT_PUBLIC_INFERENCE_PROXY_REPO ??
    'tinfoilsh/confidential-inference-proxy',
  DEFAULT_MODEL,
  SETTINGS_SIDEBAR_WIDTH_PX: 320,
  VERIFIER_SIDEBAR_WIDTH_PX: 345,
} as const
