import { useState } from 'react'
import Icon from '../atoms/Icon'
import FormField from './FormField'

export default function PasswordField({
  id,
  label,
  help,
  required = false,
  className = '',
  ...inputProps
}) {
  const [visible, setVisible] = useState(false)

  return (
    <FormField id={id} label={label} help={help} required={required}>
      <div className="password-control">
        <input
          id={id}
          className={`form-control password-input ${className}`.trim()}
          type={visible ? 'text' : 'password'}
          aria-describedby={help ? `${id}-help` : undefined}
          required={required}
          {...inputProps}
        />
        <button
          className="password-toggle"
          type="button"
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible(current => !current)}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} />
        </button>
      </div>
    </FormField>
  )
}
