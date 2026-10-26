# Style bible

References: (1) rainbow hummingbird with scale-pattern feathers on flat light grey; (2) painted green/ruby hummingbird with blue-coral wings on white.

## Palette
| Role | Hex |
|------|-----|
| Ground (light grey, ref 1) | #ECEBE7 → #DFE2DE |
| Ink (text, bill, eye) | #1D2626 |
| Defender back / head (ref 2) | #2E9E48 / #8ACB3C |
| Gorget ruby (flare) | #E3264D, highlight #FF6B8A |
| Defender wing (ref 2) | #7FB3EE tips, #F06A5A base |
| Intruder (ref 1) | orange #F3961C, yellow #F8C630, blue #2B66D3, purple #7B3FBF, teal #17A39A |
| Flower | #E2412E, throat #F59A3A, leaf #4E8F4A |

## Line and shape
No hard outlines. Edges come from a slightly darker tone of the fill (ref 2's soft painted edge, 2-3 px). Feathers are long rounded leaves; body is a teardrop; everything has round ends.

## Texture
Scale-pattern feathers on head, throat and body (ref 1): rows of small overlapping arcs, coloured by position. Flat light ground with a faint paper grain (seeded noise, 4% alpha). Soft bokeh blobs of flower colour in the distance.

## Light
Soft top-left light: radial gradients on every body part, a white specular dot in the eye, an iridescent shift on the gorget when it flares.

## Type
Outfit (bundled), weight 800 for lines, 900 for the big number. Sentence case. Ink #1D2626 on the light ground. Captions 64 px, number 300 px.

## Motion personality
Hover = jittery, buzzing, quick bob (2-3 Hz) with wings blurred. Flight = snappy darts (power3.inOut), body flattens toward the direction of travel. Camera floats (sine.inOut), never stops.

## How we draw this in code
One canvas 2D scene, 1080×1920, redrawn from a single GSAP proxy tween (`draw(t)`). Each bird is a function of time: position from keyframed splines, tilt from its velocity, wings drawn as a feather fan with 4 ghost copies for motion blur. Flowers and bokeh are seeded and placed in world space with parallax. Captions are DOM text in a separate composition.
