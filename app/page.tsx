'use client'

import { CSSProperties as CSS } from 'react'
import { primaryColor } from './globals'
import Voice from '@/components/Voice'
import BinaryTree from '@/components/BinaryTree'
import styles from './page.module.css'

export default function Home() {
  return (
    <div className={styles.page} style={{ '--primary-color': primaryColor } as CSS}>
      <BinaryTree lfo1={0} lfo2={1} lfo3={0} allOn={true} />
      <div className={styles.voices}>
        <Voice />
        <div style={{ width: 160 }} />
        <Voice />
        <Voice />
        <Voice />
      </div>
    </div>
  )
}
