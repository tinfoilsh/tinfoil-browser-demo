import 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'tinfoil-badge': any
      'tinfoil-verification-center': any
    }
  }
}
