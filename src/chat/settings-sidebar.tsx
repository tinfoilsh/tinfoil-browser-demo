'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

import clsx from 'clsx'

type SettingsSidebarProps = {
  isOpen: boolean
  onClose: () => void
  apiKey: string
  onChangeApiKey: (value: string) => void
  systemPrompt: string
  onChangeSystemPrompt: (value: string) => void
}

export function SettingsSidebar({
  isOpen,
  onClose,
  apiKey,
  onChangeApiKey,
  systemPrompt,
  onChangeSystemPrompt,
}: SettingsSidebarProps) {
  return (
    <>
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-[85vw] transform border-r border-border-subtle bg-surface-card px-0 py-6 shadow-lg transition md:static md:w-[320px] md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="flex items-start justify-between px-6 pb-6">
          <div className="flex flex-col gap-3">
            <Image
              src="/logo-green.svg"
              width={120}
              height={32}
              alt="Tinfoil"
              priority
              className="h-7 w-auto self-start"
            />
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-content-primary">
                Browser Integration Demo
              </h2>
              <a
                href="https://github.com/tinfoilsh/tinfoil-browser-demo"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-content-muted underline-offset-2 hover:text-content-secondary hover:underline"
              >
                View source code on GitHub
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            title="Close"
            className="rounded-md border border-border-subtle bg-surface-chat p-2 text-content-muted transition hover:text-content-primary md:hidden"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100dvh-8rem)] space-y-6 overflow-y-auto px-6 text-sm">
          <div className="space-y-2">
            <label
              htmlFor="api-key"
              className="block text-xs font-medium text-content-secondary"
            >
              API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(event) => onChangeApiKey(event.target.value)}
              placeholder="Enter API key"
              className="w-full rounded-md border border-border-subtle bg-surface-chat px-3 py-2 text-sm text-content-primary focus:border-border-strong focus:outline-none"
            />
            <p className="text-xs text-content-muted">
              Stored locally in your browser. Required for remote inference
              endpoints.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="system-prompt"
              className="block text-xs font-medium text-content-secondary"
            >
              System Prompt
            </label>
            <textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(event) => onChangeSystemPrompt(event.target.value)}
              rows={6}
              className="w-full resize-none rounded-md border border-border-subtle bg-surface-chat px-3 py-2 text-sm text-content-primary focus:border-border-strong focus:outline-none"
            />
          </div>
        </div>
      </aside>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  )
}
