import { Component, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return <div className="p-8 text-fog">Something went wrong. Reload the app.</div>
    return this.props.children
  }
}
