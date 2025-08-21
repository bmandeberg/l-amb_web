import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import ReactSwitch from 'react-switch'
import cn from 'classnames'
import useLambStore from '@/app/state'
import { clockDivMultOptions, numClockOptions } from '@/util/clock'
import { LFOParameters } from '@/tone/createLFO'
import useLFO from '@/hooks/useLFO'
import LinearKnob from '@/components/LinearKnob'
import { secondaryColor, gray } from '@/app/globals'
import { initState, updateLocalStorage } from '@/util/presets'
import { random } from '@/util/math'
import styles from './index.module.css'

const defaultSeqLfo: LFOParameters = {
  frequency: initState('internalFreq', 1, 'sequencer') as number,
  dutyCycle: 0.5,
  shape: 0,
}
const NUM_STEPS = 8

export const sequences = {
  up: (currentStep: number) => (currentStep + 1) % NUM_STEPS,
  down: (currentStep: number) => (currentStep - 1 + NUM_STEPS) % NUM_STEPS,
}

interface SequencerProps {
  setSequencerValue: (sequencerValue: number) => void
  initialized: boolean
  lfo1Phase?: React.RefObject<null | number>
  playing: boolean
}

export default function Sequencer({ setSequencerValue, initialized, lfo1Phase, playing }: SequencerProps) {
  const [step, setStep] = useState<number>(0)
  const [skip, setSkip] = useState<boolean[]>(
    () => initState('skip', Array(NUM_STEPS).fill(false), 'sequencer') as boolean[]
  )
  const [values, setValues] = useState<number[]>(
    () =>
      initState(
        'values',
        Array.from({ length: NUM_STEPS }, () => random(0.25, 0.75)),
        'sequencer'
      ) as number[]
  )
  const [freeSeq, setFreeSeq] = useState<boolean>(() => initState('freeSeq', false, 'sequencer') as boolean)
  const [internalFreq, setInternalFreq] = useState<number>(() => initState('internalFreq', 1, 'sequencer') as number)
  const [clockDivMultIndex, setClockDivMultIndex] = useState<number>(
    () => initState('clockDivMultIndex', Math.floor(numClockOptions / 2) + 1, 'sequencer') as number
  )
  const [sequenceIndex, setSequenceIndex] = useState<number>(() => initState('sequenceIndex', 0, 'sequencer') as number)

  const lfo1Freq = useLambStore((state) => state.lfo1Freq)

  const { value: lfo, setFrequency, setPhase } = useLFO(initialized, defaultSeqLfo)
  const lfoRef = useRef<number>(lfo)

  const skipRef = useRef(skip)
  useEffect(() => {
    skipRef.current = skip
  }, [skip])

  const sequenceStepper = (
    currentStep: number,
    firstStep: number,
    secondStep: number,
    currentPhase: boolean
  ): number => {
    const nextStep = currentPhase
      ? (currentStep + firstStep + NUM_STEPS) % NUM_STEPS
      : (currentStep + secondStep + NUM_STEPS) % NUM_STEPS
    seqPhase.current = !currentPhase
    return nextStep
  }

  // sequences
  const seqPhase = useRef<boolean>(true)
  const sequences = useRef<Record<string, (currentStep: number, currentPhase: boolean) => number>>({
    up: (currentStep: number) => (currentStep + 1) % NUM_STEPS,
    down: (currentStep: number) => (currentStep - 1 + NUM_STEPS) % NUM_STEPS,
    'up/down': (currentStep: number) => {
      if (currentStep === skipRef.current.findIndex((s) => !s)) seqPhase.current = true
      if (currentStep === skipRef.current.findLastIndex((s) => !s)) seqPhase.current = false
      return seqPhase.current ? (currentStep + 1) % NUM_STEPS : (currentStep - 1 + NUM_STEPS) % NUM_STEPS
    },
    random: () => Math.floor(Math.random() * NUM_STEPS),
    '+2-1': (currentStep: number, currentPhase: boolean) => sequenceStepper(currentStep, 2, -1, currentPhase),
    '+1-2': (currentStep: number, currentPhase: boolean) => sequenceStepper(currentStep, 1, -2, currentPhase),
    '-3+5': (currentStep: number, currentPhase: boolean) => sequenceStepper(currentStep, -3, 5, currentPhase),
  })
  useEffect(() => {
    seqPhase.current = true
  }, [sequenceIndex])

  const advanceStep = useCallback(
    (currentPhase: boolean) => {
      if (skip.every((s) => s)) return

      setStep((step) => {
        const sequenceFunc = sequences.current[Object.keys(sequences.current)[sequenceIndex]]
        let nextStep = sequenceFunc(step, currentPhase)
        let depth = 0
        while (skip[nextStep] && depth < NUM_STEPS) {
          nextStep = sequenceFunc(nextStep, currentPhase)
          depth++
        }

        return nextStep
      })
    },
    [skip, sequenceIndex]
  )

  useEffect(() => {
    setSequencerValue(values[step])
  }, [step, values, setSequencerValue])

  useEffect(() => {
    // advance sequencer at rising edge of internal LFO
    if (lfo === 1 && lfoRef.current === 0) {
      advanceStep(seqPhase.current)
    }

    lfoRef.current = lfo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lfo])

  useEffect(() => {
    if (freeSeq) {
      setFrequency?.current?.(internalFreq)
    }
  }, [internalFreq, setFrequency, freeSeq])

  useEffect(() => {
    if (!freeSeq) {
      // set frequency based on division/multiplication of lfo1
      const clockDivMult = clockDivMultOptions[clockDivMultIndex]
      const divMultFreq = clockDivMultIndex < numClockOptions / 2 ? lfo1Freq / clockDivMult : lfo1Freq * clockDivMult
      setFrequency?.current?.(divMultFreq)

      // set phase to match lfo1 phase
      if (lfo1Phase && lfo1Phase?.current !== null) {
        setPhase?.current?.(lfo1Phase.current)
      }
    }
  }, [lfo1Freq, setFrequency, freeSeq, clockDivMultIndex, lfo1Phase, setPhase])

  const content = useMemo(
    () => (
      <div className={cn(styles.sequencer, { [styles.active]: playing })}>
        <p className={styles.sequencerTitle}>SEQUENCER</p>

        {/* main sequencer knobs */}
        <div className={styles.sequenceSteps}>
          {Array.from({ length: NUM_STEPS }, (_, i) => (
            <div key={i} className={styles.sequenceStep}>
              <LinearKnob
                min={0}
                max={1}
                value={values[i]}
                onChange={(value) => {
                  const newValues = [...values]
                  newValues[i] = value
                  setValues(newValues)
                  updateLocalStorage('values', newValues, 'sequencer')
                }}
                strokeColor={step === i ? secondaryColor : undefined}
                defaultValue={0.5}
              />
              <p className={styles.stepNum} style={{ color: step === i ? secondaryColor : gray }}>
                {i + 1}
              </p>
              {/* make an svg that is a 20px by 20px X with a stroke color of secondaryColor */}
              <svg
                className={styles.skipStep}
                width="20"
                height="20"
                viewBox="0 0 20 20"
                onClick={() => {
                  const newSkip = [...skip]
                  newSkip[i] = !newSkip[i]
                  setSkip(newSkip)
                  updateLocalStorage('skip', newSkip, 'sequencer')
                }}>
                <line x1="0" y1="0" x2="20" y2="20" stroke={skip[i] ? secondaryColor : gray} strokeWidth="2" />
                <line x1="20" y1="0" x2="0" y2="20" stroke={skip[i] ? secondaryColor : gray} strokeWidth="2" />
              </svg>
            </div>
          ))}
        </div>

        {/* frequency control */}
        <div className={styles.sequencerControls}>
          <svg className={styles.sequencerPointer} width="40" height="28">
            <line x1="0" y1="14" x2="40" y2="14" stroke={secondaryColor} strokeWidth="1" />
            <line x1="39" y1="0" x2="39" y2="28" stroke={secondaryColor} strokeWidth="1" />
          </svg>
          <div className={styles.knobControl}>
            <LinearKnob
              min={0}
              max={numClockOptions - 1}
              step={1}
              value={clockDivMultIndex}
              onChange={(clockDivMultIndex) => {
                setClockDivMultIndex(clockDivMultIndex)
                updateLocalStorage('clockDivMultIndex', clockDivMultIndex, 'sequencer')
              }}
              strokeColor={freeSeq ? undefined : secondaryColor}
            />
            <p style={{ color: freeSeq ? gray : secondaryColor, marginTop: -7 }}>
              <span className={styles.divMultSymbol}>{clockDivMultIndex < numClockOptions / 2 - 1 ? '÷' : '×'}</span>
              {clockDivMultOptions[clockDivMultIndex]}
            </p>
          </div>
          <div className={styles.syncSwitch}>
            <ReactSwitch
              onChange={(freeSeq) => {
                setFreeSeq(freeSeq)
                updateLocalStorage('freeSeq', freeSeq, 'sequencer')
              }}
              checked={freeSeq}
              uncheckedIcon={false}
              checkedIcon={false}
              width={48}
              height={24}
            />
            <p>{freeSeq ? 'FREE' : 'SYNC'}</p>
          </div>
          <div className={styles.knobControl}>
            <LinearKnob
              min={0.1}
              max={10}
              value={internalFreq}
              onChange={(internalFreq) => {
                setInternalFreq(internalFreq)
                updateLocalStorage('internalFreq', internalFreq, 'sequencer')
              }}
              strokeColor={freeSeq ? secondaryColor : undefined}
              taper="log"
            />
            <p style={{ color: freeSeq ? secondaryColor : gray }}>{internalFreq.toFixed(2)} Hz</p>
          </div>

          <div className={styles.verticalDivider}></div>

          {/* sequence selector */}
          <div className={styles.sequenceSelector}>
            <div className={styles.knobControl}>
              <LinearKnob
                min={0}
                max={Object.keys(sequences.current).length - 1}
                step={1}
                value={sequenceIndex}
                onChange={(sequenceIndex) => {
                  setSequenceIndex(sequenceIndex)
                  updateLocalStorage('sequenceIndex', sequenceIndex, 'sequencer')
                }}
                strokeColor={secondaryColor}
              />
            </div>
            <p>
              direction:
              <br />
              {Object.keys(sequences.current)[sequenceIndex]}
            </p>
          </div>
        </div>
      </div>
    ),
    [step, values, skip, freeSeq, internalFreq, clockDivMultIndex, sequenceIndex, playing]
  )

  return content
}
