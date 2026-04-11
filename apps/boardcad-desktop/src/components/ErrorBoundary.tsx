import { Component, type ErrorInfo, type ReactNode } from "react";
import { APP_DISPLAY_NAME } from "../constants/brand";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

/**
 * Catches render errors so a blank webview is avoided; offers reload for recovery.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`${APP_DISPLAY_NAME} UI error:`, error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <h1 className="error-boundary__title">Something went wrong</h1>
          <p className="error-boundary__text">
            {APP_DISPLAY_NAME} hit an unexpected error. You can try reloading the window.
          </p>
          <pre className="error-boundary__detail">{this.state.error.message}</pre>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
