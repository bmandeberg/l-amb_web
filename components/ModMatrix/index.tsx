import cn from 'classnames'
import { useRef, useMemo } from 'react'
import { useGesture } from '@use-gesture/react'
import { constrain } from '@/util/math'
import styles from './index.module.css'

export const modSources = ['LFO1', 'LFO2', 'LFO3', 'SEQ', 'LFO4']
export const modDestinations = [
  'LFO1 FREQ',
  'LFO1 DUTY',
  'LFO2 FREQ',
  'LFO2 DUTY',
  'LFO3 FREQ',
  'LFO3 DUTY',
  'VOICE1',
  'VOICE2',
  'VOICE3',
  'VOICE4',
  'DIST',
  'LPF',
  'DLY TIME',
]

interface ModMatrixProps {
  playing: boolean
  modMatrix: number[][]
  setModMatrix: (modMatrix: number[][]) => void
}

export default function ModMatrix({ playing, modMatrix, setModMatrix }: ModMatrixProps) {
  const dragModCell = useRef<{ x: number; y: number } | null>(null)
  const dragModValue = useGesture({
    onDragStart: ({ args: [rowIndex, colIndex] }) => {
      if (dragModCell.current) return
      dragModCell.current = { x: colIndex, y: rowIndex }
    },
    onDrag: ({ delta, event }) => {
      const cellHeight = (event.currentTarget as HTMLTableCellElement)?.clientHeight
      if (!cellHeight || !dragModCell.current) return
      const amountChanged = -delta[1] / cellHeight
      const newMatrix = [...modMatrix]
      const x = dragModCell.current?.x
      const y = dragModCell.current?.y
      newMatrix[y][x] = constrain((newMatrix[y][x] || 0) + amountChanged, 0, 1)
      setModMatrix(newMatrix)
    },
    onDragEnd: () => {
      dragModCell.current = null
    },
  })

  const content = useMemo(
    () => (
      <table className={cn(styles.modMatrix, { [styles.active]: playing })}>
        <thead>
          <tr>
            <th className={styles.noBorder}>
              <svg
                width="68"
                height="18"
                viewBox="0 0 68 18"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="curved arrow from right to bottom">
                <path d="M64 6 L34 6 34 17" fill="none" stroke="currentColor" strokeWidth="1" />
                <path d="M30 14 L34 17 38 14" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
            </th>
            {modSources.map((source) => (
              <th key={source} className={styles.cellWidth}>
                {source}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modDestinations.map((destination, rowIndex) => (
            <tr key={destination}>
              <td>{destination}</td>
              {modSources.map((source, colIndex) => (
                <td key={source} className={cn(styles.cellWidth, styles.modCell)} {...dragModValue(rowIndex, colIndex)}>
                  <div
                    className={styles.modValue}
                    style={{ top: `${(1 - modMatrix[rowIndex][colIndex]) * 100}%` }}></div>
                  <span className={styles.modValueText}>
                    {modMatrix[rowIndex][colIndex] ? modMatrix[rowIndex][colIndex].toFixed(2) : '0'}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    ),
    [dragModValue, modMatrix, playing]
  )

  return content
}
