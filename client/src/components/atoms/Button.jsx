export default function Button({
  variant = 'primary',
  size = 'medium',
  className = '',
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`crm-button crm-button-${variant} crm-button-${size} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
