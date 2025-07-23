import { useEffect, useState } from 'react'

export default function useFlicker(trigger: boolean) {
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    const start = Date.now()
    function flick() {
      if (Date.now() - start > (trigger ? 400 : 250)) {
        setOpacity(trigger ? 1 : 0)
        return
      }
      setOpacity(Math.random() > 0.7 ? 1 : Math.random())
      setTimeout(flick, Math.random() * 80 + 20)
    }
    flick()
  }, [trigger])

  return { opacity }
}
