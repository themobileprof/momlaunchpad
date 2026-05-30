interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {action}
    </header>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>
}

export function Alert({ variant, children }: { variant: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  return <div className={`alert alert-${variant}`}>{children}</div>
}

export function Spinner() {
  return <div className="spinner" aria-label="Loading" />
}

export function EmptyState({ message }: { message: string }) {
  return <p className="empty-state">{message}</p>
}
