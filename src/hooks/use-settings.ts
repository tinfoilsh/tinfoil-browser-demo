'use client'

import { useCallback, useEffect, useState } from 'react'

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.'

const STORAGE_KEYS = {
  apiKey: 'browser-integration-demo:api-key',
  systemPrompt: 'browser-integration-demo:system-prompt',
} as const

export function useSettings() {
  const [apiKey, setApiKeyState] = useState('')
  const [systemPrompt, setSystemPromptState] = useState(DEFAULT_SYSTEM_PROMPT)

  useEffect(() => {
    const storedApiKey = localStorage.getItem(STORAGE_KEYS.apiKey)
    const storedPrompt = localStorage.getItem(STORAGE_KEYS.systemPrompt)

    if (storedApiKey !== null) {
      setApiKeyState(storedApiKey)
    }
    if (storedPrompt !== null && storedPrompt.length > 0) {
      setSystemPromptState(storedPrompt)
    }
  }, [])

  const setApiKey = useCallback((value: string) => {
    setApiKeyState(value)
    localStorage.setItem(STORAGE_KEYS.apiKey, value)
  }, [])

  const setSystemPrompt = useCallback((value: string) => {
    setSystemPromptState(value)
    localStorage.setItem(STORAGE_KEYS.systemPrompt, value)
  }, [])

  return {
    apiKey,
    systemPrompt,
    setApiKey,
    setSystemPrompt,
  }
}
