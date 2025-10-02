import type React from 'react'
import type { VerificationDocument } from 'tinfoil'

declare global {
  interface TinfoilVerificationCenterElement extends HTMLElement {
    verificationDocument?: VerificationDocument
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
  'config-repo'?: string
  'base-url'?: string
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'tinfoil-verification-center': VerificationCenterProps
    }
  }
}

export {}
