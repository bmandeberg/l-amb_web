'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  Preset,
  getLivePatch,
  setLivePatch,
  getStoredPresets,
  setStoredPresets,
  seedDefaultPresetsIfUnset,
  getActivePresetId,
  setActivePresetId,
  deepEqual,
  onPatchChange,
} from '@/util/presets'
import { defaultPresets } from '@/util/defaultPresets'

const NEW_PRESET_NAME = 'New Preset'

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function usePresetManager() {
  const [presets, setPresets] = useState<Preset[]>(() => seedDefaultPresetsIfUnset(defaultPresets))
  const [activeId, setActiveId] = useState<string | null>(() => getActivePresetId())
  const [name, setName] = useState<string>('')
  const [epoch, setEpoch] = useState(0)
  // bumps whenever the live patch changes, so `dirty` recomputes
  const [patchVersion, setPatchVersion] = useState(0)

  // persist the presets list
  useEffect(() => {
    setStoredPresets(presets)
  }, [presets])

  // recompute dirty when the live patch changes. Defer to a microtask: initState
  // writes default values during component render (in useState initializers), and
  // bumping state synchronously there would update this component mid-render.
  useEffect(() => {
    let scheduled = false
    return onPatchChange(() => {
      if (scheduled) return
      scheduled = true
      queueMicrotask(() => {
        scheduled = false
        setPatchVersion((v) => v + 1)
      })
    })
  }, [])

  const activePreset = useMemo(() => presets.find((p) => p.id === activeId) ?? null, [presets, activeId])

  // reflect the active preset's name in the editable field
  useEffect(() => {
    setName(activePreset ? activePreset.name : NEW_PRESET_NAME)
  }, [activePreset])

  const dirty = useMemo(() => {
    void patchVersion // dependency: recompute when the live patch changes
    if (!activePreset) return true // unsaved placeholder
    return !deepEqual(getLivePatch(), activePreset.patch)
  }, [activePreset, patchVersion])

  const dedupName = useCallback((rawName: string, id: string | null, list: Preset[]): string => {
    const base0 = rawName.trim() || NEW_PRESET_NAME
    const clash = list.find((p) => p.name === base0 && p.id !== id)
    if (!clash) return base0
    const base = base0.replace(/\s\(\d+\)$/, '')
    const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp('^' + escaped + '\\s\\((\\d+)\\)$')
    let max = 1
    list.forEach((p) => {
      const m = p.name.match(re)
      if (m && p.id !== id) max = Math.max(max, +m[1])
    })
    return `${base} (${max + 1})`
  }, [])

  const loadPreset = useCallback((id: string) => {
    const preset = getStoredPresets().find((p) => p.id === id)
    if (!preset) return
    setLivePatch({ ...preset.patch })
    setActiveId(id)
    setActivePresetId(id)
    setEpoch((e) => e + 1)
  }, [])

  // Save: overwrite the active preset, or create one if on a placeholder.
  const savePreset = useCallback(() => {
    const patch = getLivePatch()
    setPresets((list) => {
      const i = list.findIndex((p) => p.id === activeId)
      if (i !== -1) {
        const copy = list.slice()
        copy[i] = { ...copy[i], name: dedupName(name, copy[i].id, list), patch }
        return copy
      }
      const id = newId()
      setActiveId(id)
      setActivePresetId(id)
      return [...list, { id, name: dedupName(name, id, list), patch }]
    })
  }, [activeId, name, dedupName])

  // Save as new: always create a fresh preset from the current sound.
  const saveAsNew = useCallback(() => {
    const patch = getLivePatch()
    const id = newId()
    setPresets((list) => [...list, { id, name: dedupName(name, id, list), patch }])
    setActiveId(id)
    setActivePresetId(id)
  }, [name, dedupName])

  // Delete the active preset; the current sound stays loaded as a placeholder.
  const deletePreset = useCallback(() => {
    if (!activeId) return
    setPresets((list) => list.filter((p) => p.id !== activeId))
    setActiveId(null)
    setActivePresetId(null)
  }, [activeId])

  const presetOptions = useMemo(() => presets.map((p) => ({ label: p.name, value: p.id })), [presets])

  return {
    presets,
    presetOptions,
    activeId,
    isPlaceholder: !activePreset,
    name,
    setName,
    dirty,
    epoch,
    loadPreset,
    savePreset,
    saveAsNew,
    deletePreset,
  }
}
