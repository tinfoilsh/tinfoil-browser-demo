'use client'

import { SettingsSidebar } from '@/chat/settings-sidebar'
import { useChatSettings } from '@/chat/use-chat-settings'
import {
  DEFAULT_MODEL,
  INFERENCE_PROXY_REPO,
  INFERENCE_PROXY_URL,
} from '@/config'
import {
  ArrowUpIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isVerifierOpen, setIsVerifierOpen] = useState(false)
  const [verificationDocument, setVerificationDocument] =
    useState<VerificationDocument | null>(null)
  const [verificationState, setVerificationState] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  )
  const verificationCenterRef = useRef<TinfoilVerificationCenterElement | null>(
    null,
  )
  const isMountedRef = useRef(true)

  const {
    apiKey,
    setApiKey: persistApiKey,
    systemPrompt,
    setSystemPrompt: persistSystemPrompt,
  } = useChatSettings()

  const modelName = DEFAULT_MODEL

  // initialize tinfoil client with custom baseURL and configRepo
  // that support encrypted-http body payloads that are encrypted
  // with the hpke key of the secure enclave
  const tinfoilClient = useMemo(() => {
    return new TinfoilAI({
      dangerouslyAllowBrowser: true,
      baseURL: INFERENCE_PROXY_URL,
      configRepo: INFERENCE_PROXY_REPO || undefined,
      apiKey: apiKey.trim() || 'placeholder-key-not-yet-configured',
    })
  }, [apiKey])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    void import('@tinfoilsh/verification-center-ui').catch((error) => {
      if (isCancelled) return
      console.error('Unable to load verification center UI', error, {
        component: 'ChatInterface',
        action: 'importVerificationCenter',
      })
    })

    return () => {
      isCancelled = true
    }
  }, [])

  const loadVerificationDocument = useCallback(async () => {
    if (!isMountedRef.current) return

    setVerificationState('loading')
    setVerificationError(null)

    try {
      await tinfoilClient.ready()
      const document = await tinfoilClient.getVerificationDocument()
      if (!isMountedRef.current) return
      setVerificationDocument(document)
      setVerificationState('success')
    } catch (error) {
      if (!isMountedRef.current) return
      console.error('Unable to load verification document', error, {
        component: 'ChatInterface',
        action: 'loadVerificationDocument',
      })
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to verify the enclave. Try again.'
      setVerificationError(message)
      setVerificationState('error')
    }
  }, [tinfoilClient])

  useEffect(() => {
    void loadVerificationDocument()
  }, [loadVerificationDocument])

  useEffect(() => {
    const element = verificationCenterRef.current
    if (!element) return

    if (isVerifierOpen) {
      element.setAttribute('open', '')
    } else {
      element.removeAttribute('open')
    }
  }, [isVerifierOpen])

  useEffect(() => {
    const element = verificationCenterRef.current
    if (!element) return

    if (verificationDocument) {
      element.verificationDocument = verificationDocument
    } else {
      element.verificationDocument = undefined
    }
  }, [verificationDocument])

  useEffect(() => {
    const element = verificationCenterRef.current
    if (!element) return

    const handleClose = () => {
      setIsVerifierOpen(false)
    }

    element.addEventListener('close', handleClose)
    return () => {
      element.removeEventListener('close', handleClose)
    }
  }, [])

  const verificationLabel = useMemo(() => {
    if (verificationState === 'success') return 'Enclave verified'
    if (verificationState === 'loading') return 'Verifying enclave...'
    if (verificationState === 'error') {
      return 'Verification failed'
    }
    return 'Verification center'
  }, [verificationState])

  const verificationTooltip = useMemo(() => {
    if (verificationState === 'error') {
      return verificationError ?? 'Verification unavailable'
    }
    return verificationLabel
  }, [verificationError, verificationLabel, verificationState])

  const handleStream = useCallback(
    async (conversation: ChatMessage[], assistantId: string) => {
      if (!apiKey) {
        setStreamError('Add an API key in settings before sending a message.')
        return
      }

      try {
        setIsStreaming(true)
        setStreamError(null)

        await tinfoilClient.ready()

        const completionStream = await tinfoilClient.chat.completions.create({
          model: modelName,
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
    [apiKey, modelName, systemPrompt, tinfoilClient],
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

  const verificationStatusIconClass = clsx('h-5 w-5', {
    'text-emerald-400': verificationState === 'success',
    'text-destructive': verificationState === 'error',
    'text-content-muted':
      verificationState === 'idle' || verificationState === 'loading',
  })
  const verificationDesktopIconClass = clsx('h-4 w-4', {
    'text-emerald-400': verificationState === 'success',
    'text-destructive': verificationState === 'error',
    'text-content-muted':
      verificationState === 'idle' || verificationState === 'loading',
  })
  const verificationButtonClass = clsx(
    'hidden items-center gap-2 rounded-md border border-border-subtle bg-surface-chat px-3 py-2 text-xs font-medium text-content-secondary transition hover:text-content-primary md:flex',
    verificationState === 'error' && 'text-destructive hover:text-destructive',
  )

  return (
    <>
      <div className="bg-surface-app flex h-full min-h-screen w-full min-w-0 text-content-primary">
        <SettingsSidebar
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          apiKey={apiKey}
          onChangeApiKey={persistApiKey}
          systemPrompt={systemPrompt}
          onChangeSystemPrompt={persistSystemPrompt}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border-subtle bg-surface-card px-4 py-3">
            <div className="hidden text-sm text-content-secondary md:block">
              {modelName}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label="Toggle verification center"
                aria-pressed={isVerifierOpen}
                onClick={() => {
                  if (!isVerifierOpen && verificationState === 'error') {
                    void loadVerificationDocument()
                  }
                  setIsVerifierOpen((prev) => !prev)
                }}
                className="rounded-md border border-border-subtle bg-surface-chat p-2 text-content-muted transition hover:text-content-primary md:hidden"
                title={verificationTooltip}
              >
                <ShieldCheckIcon className={verificationStatusIconClass} />
              </button>

              <button
                type="button"
                aria-haspopup="dialog"
                aria-pressed={isVerifierOpen}
                onClick={() => {
                  if (!isVerifierOpen && verificationState === 'error') {
                    void loadVerificationDocument()
                  }
                  setIsVerifierOpen((prev) => !prev)
                }}
                className={verificationButtonClass}
                title={verificationTooltip}
              >
                <ShieldCheckIcon className={verificationDesktopIconClass} />
                <span className="whitespace-nowrap">{verificationLabel}</span>
              </button>

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
                <EmptyState modelName={modelName} />
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
      <tinfoil-verification-center
        ref={verificationCenterRef}
        mode="modal"
        is-dark-mode="false"
        show-verification-flow="false"
        config-repo={INFERENCE_PROXY_REPO}
        base-url={INFERENCE_PROXY_URL}
      />
    </>
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
  modelName: string
}

function EmptyState({ modelName }: EmptyStateProps) {
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-4 text-center text-content-muted">
      <h2 className="text-lg font-semibold text-content-primary">
        Tinfoil Browser Integration Demo
      </h2>
      <div className="rounded-md border border-border-subtle bg-surface-card px-4 py-2 text-xs text-content-secondary">
        {`Current model: ${modelName}`}
      </div>
    </div>
  )
}
