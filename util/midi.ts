export const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function midiNoteNumberToNoteName(noteNumber: number): string {
  const octave = Math.floor(noteNumber / 12) - 1 // MIDI note 0 is C-1
  const noteIndex = noteNumber % 12
  return `${noteNames[noteIndex]}${octave}`
}
