import { useId } from 'react'
import { secondaryColor, gray } from '@/app/globals'
import styles from './index.module.css'

const WIDTH = 20
const HEIGHT = 20
const MARGIN = 3

export interface MinimalCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export default function Checkbox({ checked, onChange, label }: MinimalCheckboxProps) {
  const id = useId() // keeps <label> association unique

  return (
    <label htmlFor={id} className={styles.wrapper}>
      {/* the real checkbox (invisible but still accessible) */}
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={styles.native}
      />

      {/* OFF: empty circle */}
      {!checked && (
        <svg
          width={WIDTH}
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className={styles.icon}
          aria-hidden="true">
          <circle cx={WIDTH / 2} cy={HEIGHT / 2} r={WIDTH / 2 - 1} fill="none" stroke={gray} strokeWidth="1" />
        </svg>
      )}

      {/* ON: red X */}
      {checked && (
        <svg
          width={WIDTH}
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className={styles.icon}
          aria-hidden="true">
          <line
            x1={MARGIN}
            y1={MARGIN}
            x2={WIDTH - MARGIN}
            y2={HEIGHT - MARGIN}
            stroke={secondaryColor}
            strokeWidth="1"
          />
          <line
            x1={WIDTH - MARGIN}
            y1={MARGIN}
            x2={MARGIN}
            y2={HEIGHT - MARGIN}
            stroke={secondaryColor}
            strokeWidth="1"
          />
        </svg>
      )}

      {/* label text */}
      <p className={styles.checkboxText} style={{ color: checked ? secondaryColor : gray }}>
        {label}
      </p>
    </label>
  )
}
