# LEDBASIC

**A browser-based electronics simulator with its own programming language.**

🇹🇷 [Türkçe README](README.tr.md)

LEDBASIC lets you build and program electronic circuits without touching a single
wire. No pin numbers, no resistor math, no datasheets — you drop components on a
breadboard, call them by name, and focus on the logic.

```basic
IF LIGHT(SENSOR1) < 300 THEN RELAYON RELAY1 ELSE RELAYOFF RELAY1
```

That's a complete streetlight controller. One line.

---

## Why

Learning electronics usually stalls at the wiring. A beginner who wants to try
"turn the lamp on when it gets dark" first has to figure out voltage dividers, ADC
pins, flyback diodes and optocouplers. The idea dies before it runs.

LEDBASIC removes that wall. You learn the *logic* first — the hardware comes later,
and by then you already have a working mental model to attach the wires to.

---

## Quick start

Download `ledbasic.html` and open it in a browser. That's it.

- No installation, no build step, no dependencies
- Single self-contained file (~500 KB)
- Works offline
- Works on phones — this entire project was in fact developed on one

---

## What's in it

### 23 component types

| Category | Components |
|---|---|
| **Outputs** | LED (RGB, any color), power LED (PWM dimmable), LED strip (addressable RGB or fixed color, 8–60 LEDs), relay (1/2/4/8 channel + SSR) |
| **Inputs** | Button, pulse button (edge-triggered), potentiometer |
| **Displays** | Character LCD (16×2, 20×4), graphic LCD (128×64), 7-segment (1–8 digits), LED matrix (8×8 up to 32×8, mono or RGB), LED sign (scrolling text, 5 sizes) |
| **Motors** | DC motor (PWM speed + direction), servo (0–180°), stepper (time-accurate stepping) |
| **Sensors** | LDR, PIR, HC-SR04 ultrasonic, thermostat, rain, CNY70, DHT11 |
| **Sound** | Active/passive buzzer, sounder, speaker — real audio via Web Audio |
| **Storage** | EEPROM with a two-layer file system |

### The language

Modeled on PIC BASIC, with **every keyword available in both Turkish and English**
(312 spellings, 110 commands). Case-insensitive.

```basic
// Control flow
IF x > 5 THEN HIGH LED1 ELSE LOW LED1        // single-line
SELECT mode
    CASE 1
    CASE 2, 3
    CASE 5 TO 9
    OTHERWISE
END SELECT

// Loops
FOR i = 0 TO 10 STEP 2 ... NEXT i
WHILE cond ... WEND

// Data
DIM scores[10]
RECORD Player
    name
    score
END
LET p = NEW Player
p.score = 100

// Reusable code with local scope
SUB blink(led, ms)
    HIGH led
    PAUSE ms
    LOW led
END

FUNCTION withTax(v)
    GIVE v * 120 / 100
END
```

Also included: hex/binary literals (`&HFF`, `&B1010`), BASIC operators
(`^`, `MOD`, `\`, `<>`), string functions, math functions, and game helpers
(collision detection, clamping, wrapping, sprite drawing, pixel reading).

### Beyond the basics

- **Multiple code pages** with shared scope — a `SUB` defined in one page is
  callable from every other page
- **Player export** — package your project into a standalone HTML file: just the
  breadboard and your name, program auto-runs, no editor. Project data is gzipped
  and embedded. Share it anywhere.
- **Turkish / English UI** — switches menus, error messages *and* component name
  prefixes (`BUTON1` ⇄ `BUTTON1`)
- **Save / load** projects to browser storage or `.json` files

---

## Testing

The engine and UI are covered by automated tests that run in Node.js against a
lightweight DOM shim — no browser needed.

```bash
node regression_test.js   # 26 — language core, all component commands
node boot_normal.js       # 16 — app boots, palette, editor, tabs
node boot.js              # 13 — player mode: decompress, load, auto-run
node boot_lang.js         # 14 — language switching end to end
```

Every one of the **63 code examples in the reference documentation is parsed by
the real parser before publishing**, and the command dictionary is generated
directly from the engine's keyword table — so the docs cannot contain a command
that doesn't exist.

---

## Documentation

`ledbasic-referans.html` — 19 sections, 63 verified examples, from first program
to complete projects (night light, thermostat, parking sensor, counter, moving
sprite). Open it in a browser; it reads fine on a phone.

---

## Known limitations

Stated plainly, because a README that only lists wins is not useful:

- Everything lives in one 11,000-line HTML file. It works, but it is not a
  codebase you'd want to onboard a team into.
- Audio needs a user gesture before it can start — browsers require this. In
  player mode a hint appears if the project uses sound.
- The automated tests verify behaviour, not appearance. Layout, colors and
  visual polish are unverified by machine.
- `'` is not a comment character; use `//`.

---

## Credits

Designed and directed by the project owner, written with Claude (Anthropic),
with planning input from DeepSeek. Built entirely on a phone.

The name says it: **LED** like the thing that lights up, **BASIC** like the thing
you can actually read.
