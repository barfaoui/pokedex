import { GLOSSARY } from '@/eval/glossary'
import './Glossary.scss'

export function Glossary() {
  return (
    <details className="glossary">
      <summary className="glossary__summary">What the terms mean</summary>
      <dl className="glossary__list">
        {GLOSSARY.map(({ term, meaning }) => (
          <div key={term} className="glossary__entry">
            <dt className="glossary__term">{term}</dt>
            <dd className="glossary__meaning">{meaning}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
