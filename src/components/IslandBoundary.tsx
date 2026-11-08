import { Component, type ComponentType, type ReactNode } from 'react';

// Error boundary for client islands: a runtime error in one island shows a
// calm fallback instead of a blank area, and never takes the page down.
class Boundary extends Component<{ fallback: ReactNode; name: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) {
    // No PII is logged; only which island failed and the error message.
    console.error(`[island:${this.props.name}]`, error instanceof Error ? error.message : error);
  }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function withBoundary<P extends object>(Inner: ComponentType<P>, name: string, fallback: ReactNode) {
  const Wrapped = (props: P) => <Boundary name={name} fallback={fallback}><Inner {...props} /></Boundary>;
  Wrapped.displayName = `withBoundary(${name})`;
  return Wrapped;
}
