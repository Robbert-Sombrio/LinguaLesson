# Style bible: The Fluent Edge, "Ambivalence"

References: Sean's earlier Fluent Edge Short (paper, torn cards, Lora serif, red circle / slate square / pale triangle),
a mid-century line-grid poster (black street-grid lines with coloured nodes), a 9-up Bauhaus poster grid (big flat
quarter- and half-circles), and a primary Bauhaus composition (overlapping shapes, multiply overlaps).

## Palette (brand core first)
| Role | Hex |
|---|---|
| Paper | #EEEAE1 |
| Ink | #2E3642 |
| Brand red | #E2483F |
| Brand slate blue | #4E6388 |
| Brand pale blue | #B8CCE2 |
| Gold (highlight, "excited") | #E3A728 |
| Teal (accent) | #1F8A8C |
| Night (end card) | #1F2733 |

## Shape and line
Flat Bauhaus primitives with no outlines: circle, square, triangle, quarter-circle. Thin ink street-grid lines (3 px) as the
urban layer. Torn-paper white cards with a soft shadow for any quoted words.

## Texture
Linen paper: fine crossed lines at 4% on the paper colour.

## Type
Lora (serif, 500/700, italic) for the headline, the word and quotes; Inter for labels (caps, +0.14em tracking) and captions.

## Motion
Shapes land with a short overshoot (back.out), cards slide and settle (power3.out), and nothing holds still: the grid drifts and the
shapes breathe. One metaphor per beat: two shapes that collide and overlap = two feelings at once.

## How we draw this in code
DOM + inline SVG driven by GSAP, one sub-composition per scene. Captions are generated from the word timings.
