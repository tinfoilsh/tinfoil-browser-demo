export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.tinfoil.sh'

export const INFERENCE_PROXY_URL = (
  process.env.NEXT_PUBLIC_INFERENCE_PROXY_URL ?? 'https://ehbp.inf6.tinfoil.sh/v1/'
).replace(/\/$/, '')

export const INFERENCE_PROXY_REPO =
  process.env.NEXT_PUBLIC_INFERENCE_PROXY_REPO ?? 'tinfoilsh/confidential-inference-proxy-hpke'

export const DEFAULT_MODEL = 'gpt-oss-120b'
