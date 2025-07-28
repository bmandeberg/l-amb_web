import { useEffect, useRef } from 'react'
import { Application, Assets, Sprite, Texture, Filter, GlProgram } from 'pixi.js'
import styles from './index.module.css'

/**
 * Props
 *  - levels:  four audio levels, 0–1
 *  - pitches:   four MIDI pitch numbers, acts as a multiplier on the waves’ speed
 */
interface BackgroundProps {
  levels: [number, number, number, number]
  pitches: [number, number, number, number]
}

export default function Background({ levels, pitches }: BackgroundProps) {
  const host = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application>(null)
  const filterRef = useRef<Filter>(null)
  const uniformsRef = useRef({
    uRes: { value: [0, 0], type: 'vec2<f32>' },
    uCenters: { value: new Float32Array([0.2, 0.4, 0.6, 0.8]), type: 'vec4<f32>' },
    uLevels: { value: new Float32Array([0.2, 0.4, 0.6, 0.8]), type: 'vec4<f32>' },
    uPitches: { value: new Float32Array([0.2, 0.4, 0.6, 0.8]), type: 'vec4<f32>' },
    uTime: { value: 0, type: 'f32' },
  })

  // ‑‑ build Pixi once --------------------------------------------------------
  useEffect(() => {
    if (!window) return

    async function initPixi() {
      if (!host.current) return

      // init app
      const app = new Application()
      await app.init({
        backgroundAlpha: 0,
        antialias: true,
        resizeTo: host.current,
      })
      host.current.appendChild(app.canvas)
      appRef.current = app

      // load assets
      const bgTex = await Assets.load('/bg.jpg')
      const bg = new Sprite(bgTex)
      bg.anchor.set(0.5)
      bg.x = app.screen.width / 2
      bg.y = app.screen.height / 2
      app.stage.addChild(bg)

      const dispTex = await Assets.load('/disp.jpg')
      dispTex.source.addressMode = 'repeat'

      // foreground rectangle
      const rect = new Sprite(Texture.WHITE)
      rect.width = app.screen.width * 0.95
      rect.height = app.screen.height * 0.8
      rect.anchor.set(0.5)
      rect.x = app.screen.width / 2
      rect.y = app.screen.height / 2
      app.stage.addChild(rect)

      // shader and filter
      const vertex = await loadFrag('basic', 'vert')
      const fragment = await loadFrag('radial-waves')
      uniformsRef.current.uRes.value = [rect.width, rect.height]
      const filter = new Filter({
        glProgram: new GlProgram({ vertex, fragment }),
        resources: {
          radialWaveUniforms: uniformsRef.current,
          uDisp: dispTex,
        },
      })
      filterRef.current = filter
      rect.filters = [filter]

      // ticker
      app.ticker.add((time) => {
        filter.resources.radialWaveUniforms.uniforms.uTime += 0.1 * time.deltaTime
      })
    }

    initPixi()

    return () => {
      appRef.current?.destroy(true, { children: true, texture: true })
    }
  }, [])

  // ‑‑ update uniforms when props change -------------------------------------
  useEffect(() => {
    const f = filterRef.current
    if (!f) return
    f.resources.radialWaveUniforms.uniforms.uLevels = new Float32Array(levels)
    f.resources.radialWaveUniforms.uniforms.uPitches = new Float32Array(pitches)
  }, [levels, pitches])

  return <div ref={host} className={styles.background} />
}

async function loadFrag(name: string, vertex?: string): Promise<string> {
  const res = await fetch(`/shaders/${name}.${vertex ? 'vert' : 'frag'}`)
  if (!res.ok) throw new Error(`Failed to load shader: ${name}`)
  const frag = await res.text()
  return frag
}
