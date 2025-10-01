import { API_BASE_URL } from '@/config'

export type ChatModel = {
  modelName: string
  name: string
  nameShort?: string
  description?: string
  endpoint: string
  requiresApiKey?: boolean
  type?: string
  chat?: boolean
  paid?: boolean
}

const MODELS_PATH = '/api/app/models?paid=true'

export async function getAIModels(): Promise<ChatModel[]> {
  if (!API_BASE_URL) {
    console.warn('Missing NEXT_PUBLIC_API_BASE_URL environment variable', {
      component: 'ModelConfig',
    })
    return []
  }

  try {
    const response = await fetch(`${API_BASE_URL}${MODELS_PATH}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`)
    }

    const models = (await response.json()) as ChatModel[]
    return models.filter((model) => {
      const isChatType = model.type ? model.type === 'chat' : true
      const explicitlyChat = model.chat === undefined ? true : model.chat
      return Boolean(model.endpoint) && isChatType && explicitlyChat
    })
  } catch (error) {
    console.error('Unable to load model list', error, {
      component: 'ModelConfig',
      action: 'fetchModels',
    })
    return []
  }
}
