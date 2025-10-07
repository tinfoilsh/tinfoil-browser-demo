'use client'

import { useCallback, useEffect, useState } from 'react'

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.'

const STORAGE_KEYS = {
  apiKey: 'browser-integration-demo:api-key',
  systemPrompt: 'browser-integration-demo:system-prompt',
  theme: 'browser-integration-demo:theme',
} as const

type Theme = 'light' | 'dark'

export function useSettings() {
  const [apiKey, setApiKeyState] = useState('')
  const [systemPrompt, setSystemPromptState] = useState(DEFAULT_SYSTEM_PROMPT)
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    const storedApiKey = localStorage.getItem(STORAGE_KEYS.apiKey)
    const storedPrompt = localStorage.getItem(STORAGE_KEYS.systemPrompt)
    const storedTheme = localStorage.getItem(STORAGE_KEYS.theme) as Theme | null

    if (storedApiKey !== null) {
      setApiKeyState(storedApiKey)
    }
    if (storedPrompt !== null && storedPrompt.length > 0) {
      setSystemPromptState(storedPrompt)
    }
    if (storedTheme !== null) {
      setThemeState(storedTheme)
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

  const setTheme = useCallback((value: Theme) => {
    setThemeState(value)
    localStorage.setItem(STORAGE_KEYS.theme, value)
  }, [])

  return {
    apiKey,
    systemPrompt,
    theme,
    setApiKey,
    setSystemPrompt,
    setTheme,
  }
}
