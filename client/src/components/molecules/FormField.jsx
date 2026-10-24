export default function FormField({ id, label, help, required = false, children }) {
  return (
    <div className="form-field">
      <label className="form-label" htmlFor={id}>
        {label}{required ? ' *' : ''}
      </label>
      {children}
      {help && <span id={`${id}-help`} className="form-help">{help}</span>}
    </div>
  )
}
