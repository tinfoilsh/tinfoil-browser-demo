'use client'

import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SYSTEM_PROMPT } from './constants'

const STORAGE_KEYS = {
  apiKey: 'browser-integration-demo:api-key',
  systemPrompt: 'browser-integration-demo:system-prompt',
  modelName: 'browser-integration-demo:model-name',
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
  const [selectedModelName, setSelectedModelNameState] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const storedApiKey = readFromStorage(STORAGE_KEYS.apiKey)
    const storedPrompt = readFromStorage(STORAGE_KEYS.systemPrompt)
    const storedModelName = readFromStorage(STORAGE_KEYS.modelName)

    if (storedApiKey !== null) {
      setApiKeyState(storedApiKey)
    }
    if (storedPrompt !== null && storedPrompt.length > 0) {
      setSystemPromptState(storedPrompt)
    }
    if (storedModelName !== null) {
      setSelectedModelNameState(storedModelName)
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

  const setSelectedModelName = useCallback((value: string) => {
    setSelectedModelNameState(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.modelName, value)
    }
  }, [])

  return {
    apiKey,
    systemPrompt,
    selectedModelName,
    setApiKey,
    setSystemPrompt,
    setSelectedModelName,
    isHydrated,
  }
}
