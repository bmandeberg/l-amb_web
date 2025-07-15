'use client'

import { expoMap } from '@/util/math'
import styles from './index.module.css'

interface MixersProps {
  lfo1: number
  lfo2: number
  lfo3: number
  allOn: boolean
}

export default function BinaryTree({ lfo1, lfo2, lfo3, allOn }: MixersProps) {
  return (
    <svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" version="1.1" width="1202" height="685" viewBox="0 0 1202 685">
      <defs>
        <filter
          id="mixersGlow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%" // room for the halo
          filterUnits="userSpaceOnUse">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
          <feFlood floodColor="white" floodOpacity="0.72" result="tint" />
          <feComposite in="tint" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter
          id="luminosity-noclip"
          x="584"
          y="11"
          width="602"
          height="663"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse">
          <feFlood floodColor="#fff" result="bg" />
          <feBlend in="SourceGraphic" in2="bg" />
        </filter>

        <mask id="mask" x="584" y="11" width="602" height="663" maskUnits="userSpaceOnUse">
          <g filter="url(#luminosity-noclip)">
            <image width="602" height="663" transform="translate(584 11)" xlinkHref="mixer-inner-glow-1.png" />
          </g>
        </mask>

        <filter
          id="luminosity-noclip1"
          x="244"
          y="11"
          width="359"
          height="266"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse">
          <feFlood floodColor="#fff" result="bg" />
          <feBlend in="SourceGraphic" in2="bg" />
        </filter>

        <mask id="mask-1" x="244" y="11" width="359" height="266" maskUnits="userSpaceOnUse">
          <g filter="url(#luminosity-noclip1)">
            <image width="359" height="266" transform="translate(244 11)" xlinkHref="mixer-inner-glow-2.png" />
          </g>
        </mask>

        <filter
          id="luminosity-noclip2"
          x="125"
          y="217"
          width="360"
          height="266"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse">
          <feFlood floodColor="#fff" result="bg" />
          <feBlend in="SourceGraphic" in2="bg" />
        </filter>

        <mask id="mask-2" x="125" y="217" width="360" height="266" maskUnits="userSpaceOnUse">
          <g filter="url(#luminosity-noclip2)">
            <image width="360" height="266" transform="translate(125 217)" xlinkHref="mixer-inner-glow-3.png" />
          </g>
        </mask>

        <filter
          id="luminosity-noclip3"
          x="466"
          y="217"
          width="482"
          height="457"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse">
          <feFlood floodColor="#fff" result="bg" />
          <feBlend in="SourceGraphic" in2="bg" />
        </filter>

        <mask id="mask-3" x="466" y="217" width="482" height="457" maskUnits="userSpaceOnUse">
          <g filter="url(#luminosity-noclip3)">
            <image width="482" height="457" transform="translate(466 217)" xlinkHref="mixer-inner-glow-4.png" />
          </g>
        </mask>

        <filter
          id="luminosity-noclip4"
          x="347"
          y="423"
          width="362"
          height="251"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse">
          <feFlood floodColor="#fff" result="bg" />
          <feBlend in="SourceGraphic" in2="bg" />
        </filter>

        <mask id="mask-4" x="347" y="423" width="362" height="251" maskUnits="userSpaceOnUse">
          <g filter="url(#luminosity-noclip4)">
            <image width="362" height="251" transform="translate(347 423)" xlinkHref="mixer-inner-glow-5.png" />
          </g>
        </mask>

        <filter
          id="luminosity-noclip5"
          x="16"
          y="423"
          width="350"
          height="251"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse">
          <feFlood floodColor="#fff" result="bg" />
          <feBlend in="SourceGraphic" in2="bg" />
        </filter>

        <mask id="mask-5" x="16" y="423" width="350" height="251" maskUnits="userSpaceOnUse">
          <g filter="url(#luminosity-noclip5)">
            <image width="350" height="251" transform="translate(16 423)" xlinkHref="mixer-inner-glow-6.png" />
          </g>
        </mask>
      </defs>

      {/* inner fills */}
      <g className={styles.fill}>
        <path
          style={{ opacity: allOn ? 1 : lfo3 }}
          d="M349.2,450h66.2s44.8,0,85.9,71.2l86,150h119.3l-100.1-174.4c-41.1-71.2-85.9-71.2-85.9-71.2h-157.4l-14.1,24.4h0Z"
          filter="url(#mixersGlow)"
        />
        <path
          style={{ opacity: allOn ? 1 : 1 - lfo3 }}
          d="M349.2,450h-40.7s-44.8,0-85.9,71.2l-85.3,150H18l99.4-174.4c41.1-71.2,85.9-71.2,85.9-71.2h160l-14.1,24.4h0Z"
          filter="url(#mixersGlow)"
        />

        <path
          style={{ opacity: allOn ? 1 : 1 - lfo2 }}
          d="M468.1,244.1h-40.2s-44.8,0-85.9,71.2l-63.4,110.3h-75.3s-37.6,0-75.5,54.8l109-189.5c41.1-71.2,85.9-71.2,85.9-71.2h159.6l-14.1,24.4h-.1Z"
          filter="url(#mixersGlow)"
        />
        <path
          style={{ opacity: allOn ? 1 : lfo2 }}
          d="M468.1,244.1h66.7s44.8,0,85.9,71.2l205.4,355.9h119.3l-219.4-380.3c-41.1-71.2-85.9-71.2-85.9-71.2h-157.9l-14.1,24.4h0Z"
          filter="url(#mixersGlow)"
        />

        <path
          style={{ opacity: allOn ? 1 : lfo1 }}
          d="M586.9,38.2h67.6s44.8,0,85.9,71.2l324.3,561.8h119.3L845.6,85c-41.1-71.2-85.9-71.2-85.9-71.2h-158.7l-14.1,24.4h0Z"
          filter="url(#mixersGlow)"
        />
        <path
          style={{ opacity: allOn ? 1 : 1 - lfo1 }}
          d="M586.9,38.2h-39.4s-44.8,0-85.9,71.2l-63.7,110.3h-75.4s-37.8,0-75.9,55.3l109.7-190C397.5,13.8,442.3,13.8,442.3,13.8h158.7l-14.1,24.4h0Z"
          filter="url(#mixersGlow)"
        />
      </g>

      {/* inner stroke */}
      <g>
        <path
          className={styles.hiddenPath}
          id="mixersStroke5"
          d="M349.2,450h66.2s44.8,0,85.9,71.2l86,150h119.3l-100.1-174.4c-41.1-71.2-85.9-71.2-85.9-71.2h-157.4l-14.1,24.4h0Z"
        />
        <clipPath id="innerClip5">
          <use href="#mixersStroke5" />
        </clipPath>
        <g clipPath="url(#innerClip5)">
          <path
            style={{ opacity: allOn ? 0 : 1 - lfo3 }}
            className={styles.clipPath}
            d="M349.2,450h66.2s44.8,0,85.9,71.2l86,150h119.3l-100.1-174.4c-41.1-71.2-85.9-71.2-85.9-71.2h-157.4l-14.1,24.4h0Z"
            filter="url(#mixersGlow)"
          />
        </g>

        <path
          className={styles.hiddenPath}
          id="mixersStroke6"
          d="M349.2,450h-40.7s-44.8,0-85.9,71.2l-85.3,150H18l99.4-174.4c41.1-71.2,85.9-71.2,85.9-71.2h160l-14.1,24.4h0Z"
        />
        <clipPath id="innerClip6">
          <use href="#mixersStroke6" />
        </clipPath>
        <g clipPath="url(#innerClip6)">
          <path
            style={{ opacity: allOn ? 0 : lfo3 }}
            className={styles.clipPath}
            d="M349.2,450h-40.7s-44.8,0-85.9,71.2l-85.3,150H18l99.4-174.4c41.1-71.2,85.9-71.2,85.9-71.2h160l-14.1,24.4h0Z"
            filter="url(#mixersGlow)"
          />
        </g>

        <path
          className={styles.hiddenPath}
          id="mixersStroke3"
          d="M468.1,244.1h-40.2s-44.8,0-85.9,71.2l-63.4,110.3h-75.3s-37.6,0-75.5,54.8l109-189.5c41.1-71.2,85.9-71.2,85.9-71.2h159.6l-14.1,24.4h-.1Z"
        />
        <clipPath id="innerClip3">
          <use href="#mixersStroke3" />
        </clipPath>
        <g clipPath="url(#innerClip3)">
          <path
            style={{ opacity: allOn ? 0 : lfo2 }}
            className={styles.clipPath}
            d="M468.1,244.1h-40.2s-44.8,0-85.9,71.2l-63.4,110.3h-75.3s-37.6,0-75.5,54.8l109-189.5c41.1-71.2,85.9-71.2,85.9-71.2h159.6l-14.1,24.4h-.1Z"
            filter="url(#mixersGlow)"
          />
        </g>

        <path
          className={styles.hiddenPath}
          id="mixersStroke4"
          d="M468.1,244.1h66.7s44.8,0,85.9,71.2l205.4,355.9h119.3l-219.4-380.3c-41.1-71.2-85.9-71.2-85.9-71.2h-157.9l-14.1,24.4h0Z"
        />
        <clipPath id="innerClip4">
          <use href="#mixersStroke4" />
        </clipPath>
        <g clipPath="url(#innerClip4)">
          <path
            style={{ opacity: allOn ? 0 : 1 - lfo2 }}
            className={styles.clipPath}
            d="M468.1,244.1h66.7s44.8,0,85.9,71.2l205.4,355.9h119.3l-219.4-380.3c-41.1-71.2-85.9-71.2-85.9-71.2h-157.9l-14.1,24.4h0Z"
            filter="url(#mixersGlow)"
          />
        </g>

        <path
          className={styles.hiddenPath}
          id="mixersStroke1"
          d="M586.9,38.2h67.6s44.8,0,85.9,71.2l324.3,561.8h119.3L845.6,85c-41.1-71.2-85.9-71.2-85.9-71.2h-158.7l-14.1,24.4h0Z"
        />
        <clipPath id="innerClip1">
          <use href="#mixersStroke1" />
        </clipPath>
        <g clipPath="url(#innerClip1)">
          <path
            style={{ opacity: allOn ? 0 : 1 - lfo1 }}
            className={styles.clipPath}
            d="M586.9,38.2h67.6s44.8,0,85.9,71.2l324.3,561.8h119.3L845.6,85c-41.1-71.2-85.9-71.2-85.9-71.2h-158.7l-14.1,24.4h0Z"
            filter="url(#mixersGlow)"
          />
        </g>

        <path
          className={styles.hiddenPath}
          id="mixersStroke2"
          d="M586.9,38.2h-39.4s-44.8,0-85.9,71.2l-63.7,110.3h-75.4s-37.8,0-75.9,55.3l109.7-190C397.5,13.8,442.3,13.8,442.3,13.8h158.7l-14.1,24.4h0Z"
        />
        <clipPath id="innerClip2">
          <use href="#mixersStroke2" />
        </clipPath>
        <g clipPath="url(#innerClip2)">
          <path
            style={{ opacity: allOn ? 0 : lfo1 }}
            className={styles.clipPath}
            d="M586.9,38.2h-39.4s-44.8,0-85.9,71.2l-63.7,110.3h-75.4s-37.8,0-75.9,55.3l109.7-190C397.5,13.8,442.3,13.8,442.3,13.8h158.7l-14.1,24.4h0Z"
            filter="url(#mixersGlow)"
          />
        </g>
      </g>

      {/* inner glow */}
      <g>
        <g mask="url(#mask)" style={{ opacity: allOn ? 1 : expoMap(lfo1) }}>
          <path
            d="M586.9,38.2h67.6s44.8,0,85.9,71.2l324.3,561.8h119.3L845.6,85c-41.1-71.2-85.9-71.2-85.9-71.2h-158.7l-14.1,24.4h0Z"
            fill="#fff"
          />
        </g>

        <g mask="url(#mask-1)" style={{ opacity: allOn ? 1 : expoMap(1 - lfo1) }}>
          <path
            d="M586.9,38.2h-39.4s-44.8,0-85.9,71.2l-63.7,110.3h-75.4s-37.8,0-75.9,55.3l109.7-190C397.5,13.8,442.3,13.8,442.3,13.8h158.7l-14.1,24.4h0Z"
            fill="#fff"
          />
        </g>

        <g mask="url(#mask-2)" style={{ opacity: allOn ? 1 : expoMap(1 - lfo2) }}>
          <path
            d="M468.1,244.1h-40.2s-44.8,0-85.9,71.2l-63.4,110.3h-75.3s-37.6,0-75.5,54.8l109-189.5c41.1-71.2,85.9-71.2,85.9-71.2h159.6l-14.1,24.4h-.1Z"
            fill="#fff"
          />
        </g>

        <g mask="url(#mask-3)" style={{ opacity: allOn ? 1 : expoMap(lfo2) }}>
          <path
            d="M468.1,244.1h66.7s44.8,0,85.9,71.2l205.4,355.9h119.3l-219.4-380.3c-41.1-71.2-85.9-71.2-85.9-71.2h-157.9l-14.1,24.4h0Z"
            fill="#fff"
          />
        </g>

        <g mask="url(#mask-4)" style={{ opacity: allOn ? 1 : expoMap(lfo3) }}>
          <path
            d="M349.2,450h66.2s44.8,0,85.9,71.2l86,150h119.3l-100.1-174.4c-41.1-71.2-85.9-71.2-85.9-71.2h-157.4l-14.1,24.4h0Z"
            fill="#fff"
          />
        </g>

        <g mask="url(#mask-5)" style={{ opacity: allOn ? 1 : expoMap(1 - lfo3) }}>
          <path
            d="M349.2,450h-40.7s-44.8,0-85.9,71.2l-85.3,150H18l99.4-174.4c41.1-71.2,85.9-71.2,85.9-71.2h160l-14.1,24.4h0Z"
            fill="#fff"
          />
        </g>
      </g>

      {/* hacky color patches when allOn */}
      {allOn && (
        <g className={styles.colorPatches}>
          <rect x="581" y="14" width="30" height="24" />
          <rect x="455" y="220" width="30" height="24" />
          <rect x="342" y="426" width="30" height="24" />
        </g>
      )}
    </svg>
  )
}
