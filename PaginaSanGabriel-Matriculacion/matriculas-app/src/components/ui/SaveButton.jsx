import { useRef, useState } from 'react'

// ── Physics constants ────────────────────────────────────────────
const CONFETTI_COUNT = 22
const SEQUIN_COUNT = 12
const GRAVITY_CONFETTI = 0.3
const GRAVITY_SEQUINS = 0.55
const DRAG_CONFETTI = 0.075
const DRAG_SEQUINS = 0.02
const TERMINAL_VELOCITY = 3
const COLORS = [
  { front: '#7b5cff', back: '#6245e0' },
  { front: '#b3c7ff', back: '#8fa5e5' },
  { front: '#5c86ff', back: '#345dd1' },
  { front: '#5cffa1', back: '#38d47a' },
]

function randomRange(min, max) {
  return Math.random() * (max - min) + min
}

function initConfettoVelocity(xRange, yRange) {
  const x = randomRange(xRange[0], xRange[1])
  const range = yRange[1] - yRange[0] + 1
  let y = yRange[1] - Math.abs(randomRange(0, range) + randomRange(0, range) - range)
  if (y >= yRange[1] - 1) y += Math.random() < 0.25 ? randomRange(1, 3) : 0
  return { x, y: -y }
}

// Launches confetti from the given button rect — fully independent of React
function launchConfetti(rect) {
  const canvas = document.createElement('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: '9999',
  })
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')

  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  const confetti = []
  const sequins = []

  for (let i = 0; i < CONFETTI_COUNT; i++) {
    confetti.push({
      randomModifier: randomRange(0, 99),
      color: COLORS[Math.floor(randomRange(0, COLORS.length))],
      dimensions: { x: randomRange(5, 9), y: randomRange(8, 15) },
      position: {
        x: randomRange(cx - rect.width / 4, cx + rect.width / 4),
        y: randomRange(cy - rect.height / 2, cy + rect.height / 2),
      },
      rotation: randomRange(0, 2 * Math.PI),
      scale: { x: 1, y: 1 },
      velocity: initConfettoVelocity([-9, 9], [6, 11]),
    })
  }

  for (let i = 0; i < SEQUIN_COUNT; i++) {
    sequins.push({
      color: COLORS[Math.floor(randomRange(0, COLORS.length))].back,
      radius: randomRange(1, 2.5),
      position: {
        x: randomRange(cx - rect.width / 3, cx + rect.width / 3),
        y: randomRange(cy - rect.height / 2, cy + rect.height / 2),
      },
      velocity: { x: randomRange(-6, 6), y: randomRange(-8, -12) },
    })
  }

  let raf

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const c of confetti) {
      const w = c.dimensions.x * c.scale.x
      const h = c.dimensions.y * c.scale.y
      ctx.translate(c.position.x, c.position.y)
      ctx.rotate(c.rotation)
      c.velocity.x -= c.velocity.x * DRAG_CONFETTI
      c.velocity.y = Math.min(c.velocity.y + GRAVITY_CONFETTI, TERMINAL_VELOCITY)
      c.velocity.x += Math.random() > 0.5 ? Math.random() : -Math.random()
      c.position.x += c.velocity.x
      c.position.y += c.velocity.y
      c.scale.y = Math.cos((c.position.y + c.randomModifier) * 0.09)
      ctx.fillStyle = c.scale.y > 0 ? c.color.front : c.color.back
      ctx.fillRect(-w / 2, -h / 2, w, h)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

    for (const s of sequins) {
      ctx.translate(s.position.x, s.position.y)
      s.velocity.x -= s.velocity.x * DRAG_SEQUINS
      s.velocity.y += GRAVITY_SEQUINS
      s.position.x += s.velocity.x
      s.position.y += s.velocity.y
      ctx.fillStyle = s.color
      ctx.beginPath()
      ctx.arc(0, 0, s.radius, 0, 2 * Math.PI)
      ctx.fill()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

    // Remove off-screen particles
    for (let i = confetti.length - 1; i >= 0; i--) {
      if (confetti[i].position.y >= canvas.height) confetti.splice(i, 1)
    }
    for (let i = sequins.length - 1; i >= 0; i--) {
      if (sequins[i].position.y >= canvas.height) sequins.splice(i, 1)
    }

    if (confetti.length > 0 || sequins.length > 0) {
      raf = requestAnimationFrame(render)
    } else {
      canvas.remove()
    }
  }

  raf = requestAnimationFrame(render)

  // Safety cleanup after 6s
  setTimeout(() => {
    cancelAnimationFrame(raf)
    canvas.remove()
  }, 6000)
}

// ── Component ────────────────────────────────────────────────────
/**
 * SaveButton — animated guardar button with confetti on success.
 *
 * @param {() => Promise<boolean>} onSave     - async save fn; returns true on success, false on error.
 *                                              Should NOT close the form.
 * @param {() => void}             onComplete - called after the success animation finishes;
 *                                              parent should reset form and close it here.
 * @param {string}                 label      - text when creating (default: 'Guardar')
 * @param {string}                 editingLabel - text when editing (default: 'Actualizar')
 * @param {boolean}                isEditing  - whether we are in edit mode
 */
export default function SaveButton({
  onSave,
  onComplete,
  label = 'Guardar',
  editingLabel = 'Actualizar',
  isEditing = false,
}) {
  const [status, setStatus] = useState('ready') // ready | loading | complete
  const btnRef = useRef(null)

  const buttonText = isEditing ? editingLabel : label

  const handleClick = async () => {
    if (status !== 'ready') return

    // Capture position BEFORE anything can change
    const rect = btnRef.current?.getBoundingClientRect() ?? {
      left: window.innerWidth / 2,
      top: window.innerHeight / 2,
      width: 160,
      height: 42,
    }

    setStatus('loading')

    let success = false
    try {
      const result = await onSave()
      success = result === true
    } catch {
      success = false
    }

    if (success) {
      setStatus('complete')
      // Burst confetti after checkmark appears
      setTimeout(() => launchConfetti(rect), 320)
      // Notify parent to reset/close form
      setTimeout(() => {
        if (onComplete) onComplete()
        setStatus('ready')
      }, 2800)
    } else {
      setStatus('ready')
    }
  }

  return (
    <button
      ref={btnRef}
      type="button"
      className={`primary-button save-btn save-btn--${status}`}
      onClick={handleClick}
      disabled={status !== 'ready'}
    >
      {/* Invisible spacer to keep natural button width */}
      <span className="save-btn__spacer" aria-hidden="true">{buttonText}</span>

      {/* Ready: submit icon + text */}
      <span className="save-btn__msg save-btn__msg--submit">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 12.2" aria-hidden="true">
          <polyline stroke="currentColor" points="2,7.1 6.5,11.1 11,7.1" />
          <line stroke="currentColor" x1="6.5" y1="1.2" x2="6.5" y2="10.3" />
        </svg>
        {buttonText}
      </span>

      {/* Loading: three bouncing dots */}
      <span className="save-btn__msg save-btn__msg--loading" aria-label="Guardando…">
        <span className="save-btn__dot" />
        <span className="save-btn__dot" />
        <span className="save-btn__dot" />
      </span>

      {/* Complete: checkmark + text */}
      <span className="save-btn__msg save-btn__msg--success">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 11" aria-hidden="true">
          <polyline stroke="currentColor" points="1.4,5.8 5.1,9.5 11.6,2.1" />
        </svg>
        Guardado
      </span>
    </button>
  )
}
