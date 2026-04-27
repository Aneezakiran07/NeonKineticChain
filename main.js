const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const SEGMENT_COUNT = 60
const SEGMENT_LENGTH = 13
const SOLVER_ITERATIONS = 6

let W, H, dpr

function resize() {
  dpr = window.devicePixelRatio || 1
  W = canvas.width  = canvas.offsetWidth  * dpr
  H = canvas.height = canvas.offsetHeight * dpr
}

resize()
window.addEventListener('resize', resize)

// each node stores current position and prev pos for Verlet integration
const nodes = []
for (let i = 0; i < SEGMENT_COUNT; i++) {
  nodes.push({ x: 0, y: 0, px: 0, py: 0 })
}

const pointer = { x: 0, y: 0 }

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
  pointer.x = (e.clientX - rect.left) * dpr
  pointer.y = (e.clientY - rect.top)  * dpr
})

canvas.addEventListener('touchmove', e => {
  e.preventDefault()
  const rect = canvas.getBoundingClientRect()
  const t = e.touches[0]
  pointer.x = (t.clientX - rect.left) * dpr
  pointer.y = (t.clientY - rect.top)  * dpr
}, { passive: false })

function updatePhysics() {
  // pin the head node directly to the pointer each frame
  nodes[0].x = pointer.x
  nodes[0].y = pointer.y

  //verlet integration moves each tail node by its implied velocity plus gravity
  for (let i = 1; i < SEGMENT_COUNT; i++) {
    const n = nodes[i]
    const vx = n.x - n.px
    const vy = n.y - n.py
    n.px = n.x
    n.py = n.y
    n.x += vx * 0.92
    n.y += vy * 0.92 + 0.18
  }

  // constraint solver pulls or pushes neighbors to maintain fixed segment length
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

function draw() {
  ctx.clearRect(0, 0, W, H)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 1.5 * dpr
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(nodes[0].x, nodes[0].y)
  for (let i = 1; i < SEGMENT_COUNT; i++) {
    ctx.lineTo(nodes[i].x, nodes[i].y)
  }
  ctx.stroke()

  //sraw a small dot at the chain head so the cursor pos is visible
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.beginPath()
  ctx.arc(pointer.x, pointer.y, 3 * dpr, 0, Math.PI * 2)
  ctx.fill()
}

function loop() {
  updatePhysics()
  draw()
  requestAnimationFrame(loop)
}

loop()