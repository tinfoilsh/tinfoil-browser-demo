import type React from 'react'
import type { VerificationDocument } from 'tinfoil'

declare global {
  interface TinfoilVerificationCenterElement extends HTMLElement {
    verificationDocument?: VerificationDocument
    onRequestVerificationDocument?: () =>
      | VerificationDocument
      | null
      | undefined
      | Promise<VerificationDocument | null | undefined>
  }
}

type HTMLProps = React.DetailedHTMLProps<
  React.HTMLAttributes<TinfoilVerificationCenterElement>,
  TinfoilVerificationCenterElement
>

type VerificationCenterProps = HTMLProps & {
  mode?: 'embedded' | 'sidebar' | 'modal'
  open?: boolean | ''
  'sidebar-width'?: number | string
  'is-dark-mode'?: string | boolean
  'show-verification-flow'?: string | boolean
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'tinfoil-verification-center': VerificationCenterProps
    }
  }
}

export {}
