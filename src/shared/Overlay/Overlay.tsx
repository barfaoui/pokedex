import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { PixelArt } from '@/shared/PixelArt/PixelArt'
import './Overlay.scss'

const CROSS = [
  '##....##',
  '###..###',
  '.######.',
  '..####..',
  '..####..',
  '.######.',
  '###..###',
  '##....##',
]

const ARROW_LEFT = [
  '...##...',
  '..##....',
  '.##.....',
  '########',
  '########',
  '.##.....',
  '..##....',
  '...##...',
]

const ICON_PIXELS = { '#': 'overlay__icon-pixel' }

// Either a title shown in the title bar, or the id of a heading in the content that names it
type OverlayName = { title: string } | { labelledBy: string }

type OverlayProps = OverlayName & {
  /** Changes when the content is replaced, so it starts at the top again. */
  contentKey: string
  onClose: () => void
  /** Shown as a Back button when there is something to go back to. */
  onBack?: () => void
  children: ReactNode
}

// Open while mounted. A modal <dialog> keeps focus inside and makes the page behind inert.
export function Overlay({
  contentKey,
  onClose,
  onBack,
  children,
  ...name
}: OverlayProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Layout effect: its cleanup runs before React removes the dialog, so focus can go back.
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    dialog?.showModal()
    return () => {
      dialog?.close()
      opener?.focus()
    }
  }, [])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [contentKey])

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    onClose()
  }

  // The dialog itself only receives clicks on its backdrop; its content is a child.
  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  // The Back button disappears on the first card: focus moves to Close instead of being lost.
  function handleBack() {
    onBack?.()
    requestAnimationFrame(() => {
      if (!dialogRef.current?.contains(document.activeElement)) {
        closeRef.current?.focus()
      }
    })
  }

  return (
    <dialog
      ref={dialogRef}
      className="overlay"
      aria-labelledby={'title' in name ? titleId : name.labelledBy}
      onCancel={handleCancel}
      onClick={handleClick}
    >
      <div className="overlay__window">
        <div className="overlay__titlebar">
          {onBack && (
            <button
              className="overlay__back"
              type="button"
              aria-label="Back"
              onClick={handleBack}
            >
              <PixelArt
                className="overlay__icon"
                rows={ARROW_LEFT}
                pixelClasses={ICON_PIXELS}
              />
            </button>
          )}
          {'title' in name && (
            <h2 className="overlay__title" id={titleId}>
              {name.title}
            </h2>
          )}
          <button
            ref={closeRef}
            className="overlay__close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            <PixelArt
              className="overlay__icon"
              rows={CROSS}
              pixelClasses={ICON_PIXELS}
            />
          </button>
        </div>
        <div ref={bodyRef} className="overlay__body">
          {children}
        </div>
      </div>
    </dialog>
  )
}
