'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'

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
  if (!isOpen) return null

  return (
    <aside className="flex h-full w-80 flex-col border-r border-border-subtle bg-surface-card">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h2 className="text-lg font-semibold">Settings</h2>
        <button
          onClick={onClose}
          className="hover:bg-surface-hover rounded p-1 text-content-secondary transition hover:text-content-primary"
          aria-label="Close settings"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <div>
          <label htmlFor="api-key" className="mb-2 block text-sm font-medium">
            API Key
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => onChangeApiKey(e.target.value)}
            placeholder="Enter your API key"
            className="bg-surface-app w-full rounded-md border border-border-subtle px-3 py-2 text-sm outline-none focus:border-border-strong"
          />
        </div>

        <div>
          <label htmlFor="system-prompt" className="mb-2 block text-sm font-medium">
            System Prompt
          </label>
          <textarea
            id="system-prompt"
            value={systemPrompt}
            onChange={(e) => onChangeSystemPrompt(e.target.value)}
            rows={6}
            className="bg-surface-app w-full resize-none rounded-md border border-border-subtle px-3 py-2 text-sm outline-none focus:border-border-strong"
          />
        </div>
      </div>
    </aside>
  )
}
