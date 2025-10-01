'use client'

import { getAIModels, type ChatModel } from '@/app/config/models'
import { SettingsSidebar } from '@/chat/settings-sidebar'
import { useChatSettings } from '@/chat/use-chat-settings'
import { ArrowUpIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { TinfoilAI } from 'tinfoil'

type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [models, setModels] = useState<ChatModel[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const {
    apiKey,
    setApiKey: persistApiKey,
    systemPrompt,
    setSystemPrompt: persistSystemPrompt,
    selectedModelName,
    setSelectedModelName: persistModelName,
    isHydrated: settingsHydrated,
  } = useChatSettings()

  // initialize tinfoil client with custom baseURL and configRepo
  // that support encrypted-http body payloads that are encrypted
  // with the hpke key of the secure enclave
  const tinfoilClient = useMemo(() => {
    return new TinfoilAI({
      dangerouslyAllowBrowser: true,
      baseURL: 'https://ehbp.inf6.tinfoil.sh/v1/',
      configRepo: 'tinfoilsh/confidential-inference-proxy-hpke',
      apiKey: apiKey.trim() || 'placeholder-key-not-yet-configured',
    })
  }, [apiKey])

  useEffect(() => {
    let mounted = true

    const loadModels = async () => {
      const fetchedModels = await getAIModels()
      if (!mounted) return

      setModels(fetchedModels)

      if (fetchedModels.length === 0) return

      const storedModel =
        settingsHydrated && selectedModelName
          ? fetchedModels.find((model) => model.modelName === selectedModelName)
          : null

      const nextModelName = storedModel?.modelName || fetchedModels[0].modelName

      if (nextModelName !== selectedModelName) {
        persistModelName(nextModelName)
      }
    }

    void loadModels()

    return () => {
      mounted = false
    }
  }, [persistModelName, selectedModelName, settingsHydrated])

  const selectedModel = useMemo(
    () => models.find((model) => model.modelName === selectedModelName) || null,
    [models, selectedModelName],
  )

  const handleStream = useCallback(
    async (conversation: ChatMessage[], assistantId: string) => {
      if (!selectedModel) {
        setStreamError('Select a model before sending a message.')
        return
      }

      if (!apiKey.trim()) {
        setStreamError('Add an API key in settings before sending a message.')
        return
      }

      try {
        setIsStreaming(true)
        setStreamError(null)

        await tinfoilClient.ready()

        const completionStream = await tinfoilClient.chat.completions.create({
          model: selectedModel.modelName,
          messages: [
            { role: 'system' as const, content: systemPrompt },
            ...conversation
              .map(({ role, content }) => ({ role, content }))
              .filter(({ content }) => content.trim().length > 0),
          ],
          stream: true,
        })

        for await (const chunk of completionStream) {
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      content: message.content + content,
                    }
                  : message,
              ),
            )
          }
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return
        }

        console.error('Streaming error', error, {
          component: 'ChatInterface',
          action: 'stream',
        })

        const fullMessage =
          error instanceof Error ? error.stack || error.message : String(error)

        setStreamError(fullMessage)

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content:
                    'Unable to complete the request. Check the settings and try again.',
                }
              : msg,
          ),
        )
      } finally {
        setIsStreaming(false)
      }
    },
    [apiKey, selectedModel, systemPrompt, tinfoilClient],
  )

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || isStreaming) return

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
      }
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
      }

      const conversation = [...messages, userMessage]
      setMessages((prev) => [...prev, userMessage, assistantMessage])
      await handleStream(conversation, assistantMessage.id)
    },
    [handleStream, isStreaming, messages],
  )

  const handleSubmit = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault()
      if (!inputValue.trim() || isStreaming) return

      const trimmed = inputValue.trim()
      setInputValue('')
      await sendMessage(trimmed)
    },
    [inputValue, isStreaming, sendMessage],
  )

  return (
    <div className="bg-surface-app flex h-full min-h-screen w-full min-w-0 text-content-primary">
      <SettingsSidebar
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        models={models}
        selectedModelName={selectedModelName}
        onSelectModel={persistModelName}
        apiKey={apiKey}
        onChangeApiKey={persistApiKey}
        systemPrompt={systemPrompt}
        onChangeSystemPrompt={persistSystemPrompt}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border-subtle bg-surface-card px-4 py-3">
          <div className="hidden text-sm text-content-secondary md:block">
            {selectedModel
              ? (selectedModel.name ?? selectedModel.modelName)
              : 'Select a model'}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Open settings"
              className="rounded-md border border-border-subtle bg-surface-chat p-2 text-content-muted transition hover:text-content-primary md:hidden"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {messages.length === 0 ? (
              <EmptyState
                selectedModel={selectedModel}
                hasModels={models.length > 0}
              />
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col gap-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border-subtle bg-surface-card px-4 py-4">
            {streamError && (
              <div className="mb-3 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {streamError}
              </div>
            )}

            <form
              onSubmit={(event) => {
                void handleSubmit(event)
              }}
              className="mx-auto flex max-w-3xl flex-col gap-3"
            >
              <div className="relative">
                <textarea
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void handleSubmit()
                    }
                  }}
                  rows={3}
                  placeholder="Ask something..."
                  className="w-full resize-none rounded-md border border-border-subtle bg-surface-chat px-3 py-3 pr-12 text-sm text-content-primary shadow-sm outline-none focus:border-border-strong"
                  disabled={isStreaming}
                />
                <button
                  type="submit"
                  disabled={isStreaming || !inputValue.trim()}
                  aria-label="Send"
                  className={clsx(
                    'absolute bottom-3 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-content-primary text-surface-card transition',
                    isStreaming || !inputValue.trim()
                      ? 'cursor-not-allowed opacity-60'
                      : 'hover:bg-content-primary/80',
                  )}
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-content-muted">
                <span>Press Enter to send, Shift + Enter for a new line</span>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

type MessageBubbleProps = {
  message: ChatMessage
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  return (
    <div
      className={clsx(
        'flex w-full justify-start',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={clsx(
          'max-w-[80%] rounded-lg px-4 py-3 text-sm shadow-sm',
          isUser
            ? 'bg-content-primary text-surface-card'
            : 'bg-surface-chat text-content-primary',
        )}
      >
        <pre className="whitespace-pre-wrap break-words font-sans text-sm">
          {message.content || (isUser ? '' : '...')}
        </pre>
      </div>
    </div>
  )
}

type EmptyStateProps = {
  selectedModel: ChatModel | null
  hasModels: boolean
}

function EmptyState({ selectedModel, hasModels }: EmptyStateProps) {
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-4 text-center text-content-muted">
      <h2 className="text-lg font-semibold text-content-primary">
        Tinfoil Browser Integration Demo
      </h2>
      <div className="rounded-md border border-border-subtle bg-surface-card px-4 py-2 text-xs text-content-secondary">
        {hasModels
          ? selectedModel
            ? `Current model: ${selectedModel.name ?? selectedModel.modelName}`
            : 'Open settings to select a model.'
          : 'No models available. Ensure NEXT_PUBLIC_API_BASE_URL is set and the API is reachable.'}
      </div>
    </div>
  )
}
