interface Props {
  text: string
  tone?: 'info' | 'error'
}

export default function Toast({ text, tone = 'info' }: Props) {
  return (
    <div className="toast" data-tone={tone} role="status" aria-live="polite">
      {text}
    </div>
  )
}
