'use client'

import { SettingsSidebar } from '@/chat/settings-sidebar'
import { useChatSettings } from '@/chat/use-chat-settings'
import { DEFAULT_MODEL, INFERENCE_PROXY_REPO, INFERENCE_PROXY_URL } from '@/config'
import { ArrowUpIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TinfoilAI, type VerificationDocument } from 'tinfoil'

type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isVerifierOpen, setIsVerifierOpen] = useState(false)
  const [verificationDocument, setVerificationDocument] = useState<VerificationDocument | null>(null)
  const verificationCenterRef = useRef<any>(null)
  const badgeRef = useRef<any>(null)
  const badgeClickHandlerRef = useRef<(() => void) | null>(null)
  const isMountedRef = useRef(true)

  const { apiKey, setApiKey, systemPrompt, setSystemPrompt } = useChatSettings()

  const tinfoilClientRef = useRef<TinfoilAI | null>(null)

  const createTinfoilClient = useCallback(() => {
    if (!apiKey?.trim()) {
      return null
    }
    const client = new TinfoilAI({
      dangerouslyAllowBrowser: true,
      baseURL: INFERENCE_PROXY_URL,
      enclaveURL: INFERENCE_PROXY_URL,
      configRepo: INFERENCE_PROXY_REPO || undefined,
      apiKey: apiKey.trim(),
    })
    tinfoilClientRef.current = client
    return client
  }, [apiKey])

  const getTinfoilClient = useCallback(() => {
    if (!tinfoilClientRef.current) {
      return createTinfoilClient()
    }
    return tinfoilClientRef.current
  }, [createTinfoilClient])

  const [webComponentsLoaded, setWebComponentsLoaded] = useState(false)

  useEffect(() => {
    isMountedRef.current = true
    import('@tinfoilsh/verification-center-ui').then(() => {
      setWebComponentsLoaded(true)
    })
    return () => {
      isMountedRef.current = false
      tinfoilClientRef.current = null
    }
  }, [])

  const loadVerificationDocument = useCallback(
    async ({ reinitialize = false }: { reinitialize?: boolean } = {}) => {
      if (!isMountedRef.current) return null
      if (!apiKey?.trim()) {
        setVerificationDocument(null)
        return null
      }

      try {
        const client = reinitialize ? createTinfoilClient() : getTinfoilClient()
        if (!client) {
          return null
        }
        await client.ready()
        const document = await client.getVerificationDocument()
        if (!isMountedRef.current) return null
        setVerificationDocument(document)
        return document
      } catch (error) {
        if (!isMountedRef.current) return null
        console.error('Unable to load verification document', error, {
          component: 'ChatInterface',
          action: 'loadVerificationDocument',
        })
        setVerificationDocument(null)
        return null
      }
    },
    [apiKey, createTinfoilClient, getTinfoilClient],
  )

  useEffect(() => {
    void loadVerificationDocument({ reinitialize: true })
  }, [loadVerificationDocument])

  const setVerificationCenterRef = useCallback((el: any) => {
    if (verificationCenterRef.current) {
      verificationCenterRef.current.removeEventListener('close', () => setIsVerifierOpen(false))
    }
    verificationCenterRef.current = el
    if (el) {
      el.addEventListener('close', () => setIsVerifierOpen(false))
    }
  }, [])

  const setBadgeRef = useCallback((el: any) => {
    if (badgeRef.current && badgeClickHandlerRef.current) {
      badgeRef.current.removeEventListener('badge-click', badgeClickHandlerRef.current)
    }
    badgeRef.current = el
    if (el) {
      const handler = () => setIsVerifierOpen(true)
      badgeClickHandlerRef.current = handler
      el.addEventListener('badge-click', handler)
    }
  }, [])

  useEffect(() => {
    if (verificationCenterRef.current && webComponentsLoaded) {
      verificationCenterRef.current.verificationDocument = verificationDocument
      verificationCenterRef.current.onRequestVerificationDocument = async () => {
        return await loadVerificationDocument({ reinitialize: true })
      }
    }
  }, [verificationDocument, webComponentsLoaded, loadVerificationDocument])

  useEffect(() => {
    if (badgeRef.current && webComponentsLoaded) {
      badgeRef.current.verificationDocument = verificationDocument
    }
  }, [verificationDocument, webComponentsLoaded])

  const handleStream = useCallback(
    async (conversation: ChatMessage[], assistantId: string) => {
      if (!apiKey?.trim()) {
        setStreamError('Add an API key in settings before sending a message.')
        return
      }

      try {
        setIsStreaming(true)
        setStreamError(null)

        const client = getTinfoilClient()
        if (!client) {
          setStreamError('Unable to create client. Check your API key.')
          setIsStreaming(false)
          return
        }
        await client.ready()

        const completionStream = await client.chat.completions.create({
          model: DEFAULT_MODEL,
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

        const fullMessage = error instanceof Error ? error.stack || error.message : String(error)

        setStreamError(fullMessage)

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: 'Unable to complete the request. Check the settings and try again.',
                }
              : msg,
          ),
        )
      } finally {
        setIsStreaming(false)
      }
    },
    [apiKey, getTinfoilClient, systemPrompt],
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
        apiKey={apiKey}
        onChangeApiKey={setApiKey}
        systemPrompt={systemPrompt}
        onChangeSystemPrompt={setSystemPrompt}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="justify-left flex items-center gap-3 border-b border-border-subtle bg-surface-card px-4 py-3">
          <div className="hidden text-sm text-content-secondary md:block">{DEFAULT_MODEL}</div>
          {apiKey && <tinfoil-badge ref={setBadgeRef as any} />}
        </header>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {messages.length === 0 ? (
              <EmptyState />
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
                    isStreaming || !inputValue.trim() ? 'cursor-not-allowed opacity-60' : 'hover:bg-content-primary/80',
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

      <tinfoil-verification-center
        ref={setVerificationCenterRef as any}
        open={isVerifierOpen ? 'true' : undefined}
        is-dark-mode="false"
        mode="modal"
        show-verification-flow="true"
      />
    </div>
  )
}

type MessageBubbleProps = {
  message: ChatMessage
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  return (
    <div className={clsx('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[80%] rounded-lg px-4 py-3 text-sm shadow-sm',
          isUser ? 'bg-content-primary text-surface-card' : 'bg-surface-chat text-content-primary',
        )}
      >
        <pre className="whitespace-pre-wrap break-words font-sans text-sm">
          {message.content || (isUser ? '' : '...')}
        </pre>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-4 text-center text-content-muted">
      <h2 className="text-lg font-semibold text-content-primary">Tinfoil Browser Integration Demo</h2>
      <div className="rounded-md border border-border-subtle bg-surface-card px-4 py-2 text-xs text-content-secondary">
        {`Current model: ${DEFAULT_MODEL}`}
      </div>
    </div>
  )
}
