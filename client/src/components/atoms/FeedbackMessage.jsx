export default function FeedbackMessage({ type = 'error', children, id }) {
  if (!children) return null

  return (
    <div
      id={id}
      className={`feedback feedback-${type}`}
      role={type === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}
