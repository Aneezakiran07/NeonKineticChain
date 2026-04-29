const canvas   = document.getElementById('canvas')
const ctx      = canvas.getContext('2d')
const speedBar = document.getElementById('speedBar')
const heatBar  = document.getElementById('heatBar')

// change these if u wanna break things
const SEGMENT_COUNT     = 60
const SEGMENT_LENGTH    = 13
const SOLVER_ITERATIONS = 6
const MAX_SPEED         = 60

let W, H, dpr

function resize() {
  dpr = window.devicePixelRatio || 1
  W = canvas.width  = canvas.offsetWidth  * dpr
  H = canvas.height = canvas.offsetHeight * dpr
}
resize()
window.addEventListener('resize', resize)

// 60 dots. each one remembers where it was
const nodes = []
for (let i = 0; i < SEGMENT_COUNT; i++) {
  nodes.push({ x: 0, y: 0, px: 0, py: 0 })
}

const pointer = { x: 0, y: 0, speed: 0 }
let smoothHeat = 0

// drop the whole chain at one spot on startup
function seedChain(x, y) {
  for (const n of nodes) {
    n.x = x
    n.y = y
    n.px = x
    n.py = y
  }
}
seedChain(W / 2, H / 2)
pointer.x = W / 2
pointer.y = H / 2

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect()
  const nx = (e.clientX - rect.left) * dpr
  const ny = (e.clientY - rect.top)  * dpr
  const dx = nx - pointer.x
  const dy = ny - pointer.y
  // how far did the mouse travel this frame
  pointer.speed = Math.sqrt(dx * dx + dy * dy)
  pointer.x = nx
  pointer.y = ny
})

canvas.addEventListener('touchmove', e => {
  e.preventDefault()
  const rect = canvas.getBoundingClientRect()
  const t = e.touches[0]
  const nx = (t.clientX - rect.left) * dpr
  const ny = (t.clientY - rect.top)  * dpr
  const dx = nx - pointer.x
  const dy = ny - pointer.y
  pointer.speed = Math.sqrt(dx * dx + dy * dy)
  pointer.x = nx
  pointer.y = ny
}, { passive: false })

// a to b, t is 0 to 1
function lerp(a, b, t) {
  return a + (b - a) * t
}

// cold blue at 0, hot pink at 1
function heatColor(t, alpha) {
  const r = Math.round(lerp(20,  255, t))
  const g = Math.round(lerp(80,  20,  t))
  const b = Math.round(lerp(255, 40,  Math.pow(1 - t, 0.6)))
  return `rgba(${r},${g},${b},${alpha})`
}

function updatePhysics() {
  // head always sticks to the cursor
  nodes[0].x = pointer.x
  nodes[0].y = pointer.y

  // Verlet goes brrr
  for (let i = 1; i < SEGMENT_COUNT; i++) {
    const n = nodes[i]
    const vx = n.x - n.px
    const vy = n.y - n.py
    n.px = n.x
    n.py = n.y
    n.x += vx * 0.92
    n.y += vy * 0.92 + 0.18  // 0.18 is gravity, make it bigger for drama
  }

  // yank every segment back to the right length
  for (let iter = 0; iter < SOLVER_ITERATIONS; iter++) {
    for (let i = 0; i < SEGMENT_COUNT - 1; i++) {
      const a = nodes[i]
      const b = nodes[i + 1]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001
      const correction = (dist - SEGMENT_LENGTH) / dist * 0.5
      const ox = dx * correction
      const oy = dy * correction
      if (i !== 0) {
        a.x += ox
        a.y += oy
      }
      b.x -= ox
      b.y -= oy
    }
  }
}

//outer glow, mid glow, sharp core
const PASSES = [
  { lineWidth: 10,  alphaScale: 0.15 },
  { lineWidth: 4,   alphaScale: 0.35 },
  { lineWidth: 1.5, alphaScale: 1.0  },
]

function drawChain(heat) {
  for (const pass of PASSES) {
    ctx.lineWidth = pass.lineWidth * dpr
    ctx.lineCap   = 'round'
    ctx.lineJoin  = 'round'

    for (let i = 1; i < SEGMENT_COUNT; i++) {
      const progress = i / SEGMENT_COUNT
      // tail fades out as it gets further from the head
      const fade  = Math.pow(1 - progress, 1.5)
      const alpha = fade * pass.alphaScale
      ctx.strokeStyle = heatColor(heat, alpha)
      ctx.beginPath()
      ctx.moveTo(nodes[i - 1].x, nodes[i - 1].y)
      ctx.lineTo(nodes[i].x,     nodes[i].y)
      ctx.stroke()
    }
  }
}

// lil glow blob at the cursor
function drawHead(heat) {
  const radius = (6 + heat * 10) * dpr
  const grad = ctx.createRadialGradient(
    pointer.x, pointer.y, 0,
    pointer.x, pointer.y, radius
  )
  grad.addColorStop(0,   heatColor(heat, 0.9))
  grad.addColorStop(0.4, heatColor(heat, 0.35))
  grad.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2)
  ctx.fill()
}

function updateHUD(heat) {
  speedBar.style.width = Math.min(100, heat * 250).toFixed(1) + '%'
  heatBar.style.width  = Math.min(100, heat * 140).toFixed(1) + '%'
}

function draw(heat) {
  // dark overlay instead of clear so old frames fade out slowly
  ctx.fillStyle = 'rgba(6,6,14,0.22)'
  ctx.fillRect(0, 0, W, H)
  drawChain(heat)
  drawHead(heat)
}

function loop() {
  // speed decays so heat cools when u stop moving(hmm)
  pointer.speed *= 0.85
  const rawHeat = Math.min(pointer.speed, MAX_SPEED) / MAX_SPEED
  // smooth it so color doesnt snap
  smoothHeat += (rawHeat - smoothHeat) * 0.1
  updatePhysics()
  draw(smoothHeat)
  updateHUD(smoothHeat)
  requestAnimationFrame(loop)
}

loop()