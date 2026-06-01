function hasWindow() {
  return typeof window !== 'undefined'
}

export function initState(stateName: string, defaultState: unknown, parentObj?: string) {
  if (!hasWindow() || !window.localStorage) return defaultState

  let finalState = defaultState

  const presetSetting = getUrlPresetParam(stateName, parentObj)
  const localPreset = window.localStorage.getItem('preset')
  let localState = null
  if (localPreset) {
    const parsedPreset = parentObj ? (JSON.parse(localPreset)[parentObj] ?? null) : JSON.parse(localPreset)
    localState = parsedPreset && parsedPreset[stateName]
  }

  if (presetSetting !== null && presetSetting !== undefined) {
    // first check url query string for preset
    finalState = presetSetting
    updateLocalStorage(stateName, finalState, parentObj, true)
  } else if (localState !== null && localState !== undefined) {
    // next check local storage
    finalState = localState
  } else {
    // otherwise assign/update default
    updateLocalStorage(stateName, finalState, parentObj, true)
  }

  return finalState
}

const debounces: Record<string, NodeJS.Timeout> = {}

export function updateLocalStorage(stateName: string, localState: unknown, parentObj?: string, immediate?: boolean) {
  if (!hasWindow() || !window.localStorage) return

  const localPreset = window.localStorage.getItem('preset')
  if (!localPreset) {
    const newPreset = parentObj ? { [parentObj]: { [stateName]: localState } } : { [stateName]: localState }
    window.localStorage.setItem('preset', JSON.stringify(newPreset))
    notifyPatchChange()
  } else {
    const parsedPreset = JSON.parse(localPreset)
    if (parentObj) {
      parsedPreset[parentObj] = parsedPreset[parentObj] || {}
      parsedPreset[parentObj][stateName] = localState
    } else {
      parsedPreset[stateName] = localState
    }

    if (immediate) {
      window.localStorage.setItem('preset', JSON.stringify(parsedPreset))
      notifyPatchChange()
    } else {
      const debounceKey = parentObj ? `${parentObj}_${stateName}` : stateName
      clearTimeout(debounces[debounceKey])
      debounces[debounceKey] = setTimeout(() => {
        window.localStorage.setItem('preset', JSON.stringify(parsedPreset))
        notifyPatchChange()
      }, 100)
    }
  }
}

export function initStateParam(stateName: string, defaultState: unknown, type?: 'string' | 'number') {
  if (!hasWindow() || !window.localStorage) return defaultState

  let finalState = defaultState

  const localState = window.localStorage.getItem(stateName)
  if (localState) {
    finalState = type === 'number' ? Number(localState) : localState
  } else {
    updateLocalParam(stateName, finalState)
  }

  return finalState
}

export function updateLocalParam(stateName: string, localState: unknown) {
  if (!hasWindow() || !window.localStorage) return
  window.localStorage.setItem(stateName, String(localState))
}

export function getParamFromQueryString(param: string) {
  if (!hasWindow() || !window.location) return null

  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(param)
}

export function getUrlPresetParam(stateName: string, parentObj?: string) {
  // base64 decode ?preset=<encoded>
  const encoded = getParamFromQueryString('preset')
  if (encoded) {
    const decoded = decodePreset(encoded)
    return (parentObj ? decoded[parentObj]?.[stateName] : decoded[stateName]) ?? null
  }
  return null
}

export function copyPresetUrl() {
  if (!window?.localStorage || !navigator?.clipboard) return

  const preset = window.localStorage.getItem('preset')
  if (preset) {
    const encoded = btoa(preset)
    const url = `${window.location.origin}${window.location.pathname}?preset=${encoded}`
    navigator.clipboard.writeText(url)
  }
}

export function decodePreset(encoded: string) {
  const decoded = atob(encoded)
  return JSON.parse(decoded)
}

// ---- Named patch presets ----
//
// The "live patch" is the existing localStorage['preset'] object that every
// control reads via initState / writes via updateLocalStorage. A named preset
// is just a saved snapshot of that object plus an id and name. Master volume is
// intentionally NOT part of a patch — it lives at the top level as a global
// output level (see initStateParam('volume')).

export interface Preset {
  id: string
  name: string
  patch: Record<string, unknown>
}

const PRESETS_KEY = 'presets'
const ACTIVE_PRESET_KEY = 'activePreset'

export function getLivePatch(): Record<string, unknown> {
  if (!hasWindow() || !window.localStorage) return {}
  const raw = window.localStorage.getItem('preset')
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function setLivePatch(patch: Record<string, unknown>) {
  if (!hasWindow() || !window.localStorage) return
  window.localStorage.setItem('preset', JSON.stringify(patch))
  notifyPatchChange()
}

export function getStoredPresets(): Preset[] {
  if (!hasWindow() || !window.localStorage) return []
  const raw = window.localStorage.getItem(PRESETS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function setStoredPresets(presets: Preset[]) {
  if (!hasWindow() || !window.localStorage) return
  window.localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
}

// Seed factory presets exactly once, only for a visitor who has never had a
// presets library (the key is absent, not an empty array). Deleting all presets
// leaves the key as "[]", so it won't re-seed. Returns the list to start from.
export function seedDefaultPresetsIfUnset(defaults: Preset[]): Preset[] {
  if (!hasWindow() || !window.localStorage) return []
  const raw = window.localStorage.getItem(PRESETS_KEY)
  if (raw === null && defaults.length) {
    setStoredPresets(defaults)
    // a brand-new visitor not following a ?preset= share link starts on the
    // first/default preset, so it shows up named and selected instead of the
    // unsaved "New Preset" placeholder (its patch matches the control defaults,
    // so the live sound already equals it — no "dirty" state)
    if (getActivePresetId() === null && getParamFromQueryString('preset') === null) {
      setActivePresetId(defaults[0].id)
    }
    return defaults
  }
  return getStoredPresets()
}

export function getActivePresetId(): string | null {
  if (!hasWindow() || !window.localStorage) return null
  return window.localStorage.getItem(ACTIVE_PRESET_KEY)
}

export function setActivePresetId(id: string | null) {
  if (!hasWindow() || !window.localStorage) return
  if (id === null) window.localStorage.removeItem(ACTIVE_PRESET_KEY)
  else window.localStorage.setItem(ACTIVE_PRESET_KEY, id)
}

// Deep equality for plain JSON values (used for dirty tracking).
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ak = Object.keys(a as object)
  const bk = Object.keys(b as object)
  if (ak.length !== bk.length) return false
  return ak.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}

// Pub/sub so the preset UI can recompute "dirty" whenever the live patch changes.
type PatchListener = () => void
const patchListeners = new Set<PatchListener>()
export function onPatchChange(cb: PatchListener): () => void {
  patchListeners.add(cb)
  return () => {
    patchListeners.delete(cb)
  }
}
function notifyPatchChange() {
  patchListeners.forEach((cb) => cb())
}
