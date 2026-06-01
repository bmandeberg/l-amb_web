'use client'

import { useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from 'react'
import cn from 'classnames'
import styles from './index.module.css'

const ROW_HEIGHT = 32
const MENU_MAX_HEIGHT = 320

export interface DropdownOption {
  label: string
  value: string
}

interface DropdownProps {
  options: DropdownOption[]
  value: string | null
  setValue: (value: string) => void
  placeholder?: string
  noOptions?: string
  className?: string
  // editable combobox mode: the control becomes a text input and only the
  // arrow toggles the menu (used by Presets to unify name + dropdown)
  editable?: boolean
  inputValue?: string
  onInputChange?: (value: string) => void
  inputAriaLabel?: string
  adornment?: ReactNode
}

export default function Dropdown({
  options,
  value,
  setValue,
  placeholder,
  noOptions,
  className,
  editable,
  inputValue,
  onInputChange,
  inputAriaLabel,
  adornment,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [menuAbove, setMenuAbove] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // close on outside click
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const menuHeight = useMemo(() => Math.min(options.length * ROW_HEIGHT, MENU_MAX_HEIGHT), [options.length])

  const selectedIndex = useMemo(() => options.findIndex((o) => o.value === value), [options, value])
  const displayValue = selectedIndex !== -1 ? options[selectedIndex].label : ''

  const toggleOpen = useCallback(() => {
    if (!open && rootRef.current) {
      // open above when there isn't room below
      const rect = rootRef.current.getBoundingClientRect()
      const roomBelow = window.innerHeight - rect.bottom
      setMenuAbove(roomBelow < menuHeight + 8 && rect.top > roomBelow)
    }
    setOpen((o) => !o)
  }, [open, menuHeight])

  // scroll the selected option into view when opening
  useEffect(() => {
    if (open && selectedIndex !== -1 && menuRef.current) {
      menuRef.current.scrollTop = selectedIndex * ROW_HEIGHT
    }
  }, [open, selectedIndex])

  // hidden sizing element widens the control: in editable mode it tracks the
  // current input text (so the box grows to fit the name), otherwise the longest
  // option (so a select-style dropdown fits any choice).
  const longest = useMemo(
    () => options.reduce((acc, o) => (o.label.length > acc.length ? o.label : acc), placeholder ?? ''),
    [options, placeholder]
  )
  const sizerText = editable ? inputValue || placeholder || '' : longest

  return (
    <div ref={rootRef} className={cn(styles.dropdown, className, { [styles.open]: open })}>
      <div className={styles.control} onClick={editable ? undefined : toggleOpen}>
        {editable ? (
          <input
            className={styles.input}
            type="text"
            value={inputValue ?? ''}
            spellCheck={false}
            onChange={(e) => onInputChange?.(e.target.value)}
            aria-label={inputAriaLabel}
          />
        ) : (
          <span className={cn(styles.value, { [styles.placeholder]: selectedIndex === -1 })}>
            {displayValue || placeholder}
          </span>
        )}
        {adornment}
        <span
          className={cn(styles.arrow, { [styles.clickable]: editable })}
          onClick={editable ? toggleOpen : undefined}
        />
      </div>

      {/* invisible spacer that drives the control width (see sizerText) */}
      <div className={styles.sizer} aria-hidden="true">
        {sizerText}
      </div>

      {open && (
        <div
          ref={menuRef}
          className={cn(styles.menu, { [styles.above]: menuAbove })}
          style={{ maxHeight: MENU_MAX_HEIGHT }}>
          {options.length ? (
            options.map((o) => (
              <div
                key={o.value}
                className={cn(styles.option, { [styles.selected]: o.value === value })}
                onClick={() => {
                  setValue(o.value)
                  setOpen(false)
                }}>
                {o.label}
              </div>
            ))
          ) : (
            <div className={styles.noOptions}>{noOptions ?? 'No presets'}</div>
          )}
        </div>
      )}
    </div>
  )
}
