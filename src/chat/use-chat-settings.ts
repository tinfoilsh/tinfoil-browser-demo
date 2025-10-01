'use client'

import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SYSTEM_PROMPT } from './constants'

const STORAGE_KEYS = {
  apiKey: 'browser-integration-demo:api-key',
  systemPrompt: 'browser-integration-demo:system-prompt',
} as const

const readFromStorage = (key: string) => {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem(key)
}

export function useChatSettings() {
  const [apiKey, setApiKeyState] = useState('')
  const [systemPrompt, setSystemPromptState] = useState(DEFAULT_SYSTEM_PROMPT)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const storedApiKey = readFromStorage(STORAGE_KEYS.apiKey)
    const storedPrompt = readFromStorage(STORAGE_KEYS.systemPrompt)

    if (storedApiKey !== null) {
      setApiKeyState(storedApiKey)
    }
    if (storedPrompt !== null && storedPrompt.length > 0) {
      setSystemPromptState(storedPrompt)
    }

    setIsHydrated(true)
  }, [])

  const setApiKey = useCallback((value: string) => {
    setApiKeyState(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.apiKey, value)
    }
  }, [])

  const setSystemPrompt = useCallback((value: string) => {
    setSystemPromptState(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.systemPrompt, value)
    }
  }, [])

  return {
    apiKey,
    systemPrompt,
    setApiKey,
    setSystemPrompt,
    isHydrated,
  }
}
