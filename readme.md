# Neon Kinetic Chain

A physics cool thingy that runs in the browser. Move your mouse and a glowing rope follows it. Move fast and it heats up from blue to pink.

---

## How to run

Serve the folder over HTTP and open `index.html`.

```
npx serve .
```

> Opening the file directly as `file://` will break ES module imports if you later split into modules. A local server avoids this entirely.

---

## What it does

A chain of 60 dots follows your cursor. Each dot connects to the next by a fixed-length segment. The chain droops under gravity, swings with momentum, and heats up as you move faster.

---

## Concepts

**Verlet Integration**
Each node stores its current position and its previous position. Velocity is never stored explicitly. It is implied by the difference between the two positions. This makes the simulation naturally stable under repeated forces.

**Constraint solving**
After each physics step a loop runs 6 times over every connected pair of nodes. If two nodes are too far apart or too close together it nudges them back to the correct distance. Running multiple iterations per frame is what keeps the chain from stretching or bunching under fast movement.

**Multi-pass glow**
The chain is drawn three times per frame at different line widths and opacities. Wide and faint for the outer bloom, medium for the core glow, thin and fully opaque for the bright center line. This fakes a neon tube without CSS blur, which would tank performance.

**Heat color**
Mouse speed is normalized to a 0 to 1 value. That value drives a linear interpolation across the RGB channels from cool blue to hot pink. The value is smoothed across frames so the color eases in and out instead of snapping on every frame.

**Motion trails**
The canvas is not cleared between frames. A semi-transparent dark rectangle is painted over the previous frame instead. Old lines fade out over several frames leaving glowing trails.

---

## File structure

```
index.html    markup, HUD, readme dialog, dialog open and close logic
style.css     dark theme, HUD bars, readme button, dialog panel
main.js       everything else: physics, rendering, input, animation loop
```

---

## Play with it?!

All constants are at the top of `main.js`.

## Constant | Default | What it does 
- `SEGMENT_COUNT` | 60 | number of dots in the chain |
- `SEGMENT_LENGTH` | 13 | pixel distance between each dot |
- `SOLVER_ITERATIONS` | 6 | constraint passes per frame, higher is stiffer |
- `MAX_SPEED` | 60 | mouse speed that counts as full heat |

To change the physics feel, edit the Verlet loop in `updatePhysics`. The `0.92` is damping and the `0.18` is gravity. Lower damping makes the tail swing longer. Higher gravity makes it droop faster.

To change the color range, edit `heatColor` in `main.js`. The two sets of RGB values are the cold color and the hot color.

---

## Browser support

Works in any browser that supports the Canvas 2D API and ES2017. That covers every modern browser released after 2017.