import { writeUrlState } from '@/app/url-state'
import './AppLink.scss'

interface AppLinkProps {
  query: string
}

export function AppLink({ query }: AppLinkProps) {
  const href = `${import.meta.env.BASE_URL}${writeUrlState({ query, tab: 'all' })}`
  return (
    <a
      className="app-link"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open “${query}” in the app, in a new tab`}
      // The case row opens on click: the link mustn't toggle it too.
      onClick={(event) => event.stopPropagation()}
    >
      ↗
    </a>
  )
}
