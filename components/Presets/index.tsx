'use client'

import { useCallback } from 'react'
import cn from 'classnames'
import { secondaryColor, gray } from '@/app/globals'
import Dropdown, { DropdownOption } from '@/components/Dropdown'
import styles from './index.module.css'

interface PresetsProps {
  presetOptions: DropdownOption[]
  activeId: string | null
  name: string
  setName: (name: string) => void
  dirty: boolean
  isPlaceholder: boolean
  loadPreset: (id: string) => void
  savePreset: () => void
  saveAsNew: () => void
  deletePreset: () => void
}

export default function Presets({
  presetOptions,
  activeId,
  name,
  setName,
  dirty,
  isPlaceholder,
  loadPreset,
  savePreset,
  saveAsNew,
  deletePreset,
}: PresetsProps) {
  const canSave = dirty || isPlaceholder
  const canDelete = !isPlaceholder

  const doSave = useCallback(() => {
    if (canSave) savePreset()
  }, [canSave, savePreset])

  const doDelete = useCallback(() => {
    if (canDelete) deletePreset()
  }, [canDelete, deletePreset])

  return (
    <div className={styles.presets}>
      <div className={styles.controlRow}>
        <Dropdown
          className={styles.combo}
          options={presetOptions}
          value={activeId}
          setValue={loadPreset}
          placeholder="New Preset"
          noOptions="No saved presets"
          editable
          inputValue={name}
          onInputChange={setName}
          inputAriaLabel="Preset name"
          adornment={dirty ? <span className={styles.editedDot} title="Unsaved changes" /> : null}
        />

        {/* save */}
        <button
          type="button"
          className={cn(styles.action, { [styles.disabled]: !canSave })}
          onClick={doSave}
          title="Save preset">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M8 1.5 V10 M4.5 6.5 L8 10 L11.5 6.5"
              fill="none"
              stroke={canSave ? secondaryColor : gray}
              strokeWidth="1.5"
            />
            <path d="M2.5 12.5 H13.5" fill="none" stroke={canSave ? secondaryColor : gray} strokeWidth="1.5" />
          </svg>
        </button>

        {/* duplicate (save as new) */}
        <button type="button" className={styles.action} onClick={saveAsNew} title="Duplicate preset">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <line x1="8" y1="3" x2="8" y2="13" stroke={secondaryColor} strokeWidth="1.5" />
            <line x1="3" y1="8" x2="13" y2="8" stroke={secondaryColor} strokeWidth="1.5" />
          </svg>
        </button>

        {/* delete */}
        <button
          type="button"
          className={cn(styles.action, { [styles.disabled]: !canDelete })}
          onClick={doDelete}
          title="Delete preset">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M3 4.5 H13 M6.5 4.5 V3 H9.5 V4.5 M4.5 4.5 L5 13 H11 L11.5 4.5"
              fill="none"
              stroke={canDelete ? secondaryColor : gray}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <p className={styles.label}>Preset</p>
    </div>
  )
}
