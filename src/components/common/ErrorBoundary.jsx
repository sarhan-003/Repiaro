import { Component } from 'react'
import Button from './Button'
import { ErrorState } from './States'

/** Catches render errors so one broken page never blanks the whole app. */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ErrorState
          title="This page could not be displayed"
          description="An unexpected error occurred. Reloading usually fixes it. If it keeps happening, reset the demo data from My Bookings."
        >
          <Button onClick={() => window.location.reload()}>Reload page</Button>
          <Button variant="secondary" onClick={() => window.location.assign('/')}>
            Go to Home
          </Button>
        </ErrorState>
      </div>
    )
  }
}
