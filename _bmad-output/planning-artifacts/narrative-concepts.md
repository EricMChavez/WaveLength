# Narrative Concepts for Signal Puzzle Game

## Design Goal

Add a lightweight story layer inspired by Zachtronics games (TIS-100, Shenzhen I/O, Exapunks). The narrative should:

- **Frame** each puzzle as a task within a larger story
- **Deliver** through text between levels (memos, logs, transmissions) — no cutscenes
- **Accumulate** so players piece together a larger mystery over time
- **Complement** the recursive tool-building loop, not fight it
- **Stay minimal** — a few paragraphs per level at most, skippable

---

## Concept 1: "The Relay" (Coastal Signal Station)

### Premise

You're the new keeper of Relay Station 33, a coastal signal processing outpost in a chain of stations that guide ships through a treacherous archipelago. The previous keeper left abruptly. Your job: maintain and repair the signal processing equipment that keeps ships from running aground.

### Narrative Delivery

- **Work orders** from the Maritime Signal Authority (your employer) — bureaucratic, terse, occasionally contradictory
- **Maintenance log** left by the previous keeper — increasingly erratic entries
- **Radio intercepts** — fragments of transmissions from passing ships, other relay keepers, and something else
- **Equipment manifests** — flavor text on the tools you're building ("Rectifier Module, Model 33-R, field-rated")

### Arc Mapping

| Game Arc | Story Arc | Tone |
|----------|-----------|------|
| Tutorial (1-5) | Orientation. Learn the station. Work orders are routine. Previous keeper's log is mundane. | Calm, professional |
| Signal Shaping (6-12) | Equipment is degrading faster than expected. Work orders get urgent. Previous keeper's log mentions "the low signal." Radio picks up transmissions that don't match any ship. | Creeping unease |
| Timing (13-20) | Maritime Authority stops responding to your questions. You're processing signals you don't understand. Other relay stations go dark one by one. The keeper's log reveals they were trying to decode something. | Isolation, mystery |
| Advanced (21+) | You realize the signals aren't navigational — the relay network is a receiving array for something much larger. The previous keeper didn't leave. You build the tools to decode what's coming through. | Revelation |

### Why It Works

- The "station" IS your workbench — you're literally at a signal processing bench
- Work orders are natural puzzle framing ("We need a low-pass filter for Channel 6")
- Building tools from previous tools mirrors maintaining/upgrading equipment
- The coastal isolation gives Zachtronics-style "alone with the machine" atmosphere
- The mystery unfolds through the signals themselves — thematically perfect

---

## Concept 2: "The Archive" (Signal Archaeology)

### Premise

The Meridian Archive houses the last surviving recordings of a collapsed civilization. Most are corrupted beyond recognition. You're a signal restorer — your job is to reconstruct the original recordings by building processing chains that undo the degradation. Each puzzle's target waveform IS the original recording. The source waveform is what remains.

### Narrative Delivery

- **Restoration tickets** from the Archive Director — which recording to restore next, and why it matters
- **Content summaries** of restored recordings — you learn what was on them after solving each puzzle
- **Field notes** from the expedition team that recovered the physical media
- **The Director's journal** — their private theory about why the civilization fell

### Arc Mapping

| Game Arc | Story Arc | Tone |
|----------|-----------|------|
| Tutorial (1-5) | Simple restorations. Content: mundane recordings (weather reports, shipping manifests). Director is optimistic. | Procedural, hopeful |
| Signal Shaping (6-12) | Harder degradation. Content: personal messages, music, speeches. You realize the recordings span the final years before collapse. | Melancholy, human |
| Timing (13-20) | Severe corruption requires sophisticated tools. Content: emergency broadcasts, scientific data, government communications. A pattern emerges in what was recorded and when. | Urgency, pattern recognition |
| Advanced (21+) | The most corrupted recordings. Content: the final transmissions. The Director's theory is wrong — the civilization didn't fall. They encoded themselves INTO the signal archive. Your restorations aren't recovering the past; they're waking something up. | Awe, philosophical |

### Why It Works

- "Degraded signal in, clean signal out" IS the puzzle mechanic already
- Building restoration tools that compose mirrors real archival work
- The content of the recordings provides a parallel narrative for free
- The twist recontextualizes the tool-building loop: you weren't restoring, you were constructing
- Each puzzle has inherent emotional stakes ("this is someone's last message")

---

## Concept 3: "The Broadcast" (Mysterious Radio Station)

### Premise

You've been hired as a signal engineer at WXYZ, a radio station that has broadcast continuously since 1962. No one knows who owns it. No one knows who listens. Your predecessor left a resignation letter that just says "I'm sorry." Your job: prepare signal transmissions according to the station manager's specifications. The manager communicates exclusively through typed memos slipped under your studio door.

### Narrative Delivery

- **Manager's memos** — your puzzle assignments, increasingly strange ("Process this signal. Do not listen to it.")
- **Station manual** — an employee handbook with redacted sections and handwritten margin notes from previous engineers
- **FCC complaints** — letters from listeners that shouldn't exist (the station has no registered audience)
- **Your predecessor's notes** — found in desk drawers, taped behind equipment

### Arc Mapping

| Game Arc | Story Arc | Tone |
|----------|-----------|------|
| Tutorial (1-5) | Normal radio engineering. Memos are professional. Manual is helpful. You're just learning the equipment. | Mundane workplace |
| Signal Shaping (6-12) | Memos get specific in odd ways. FCC complaints arrive — from coordinates in the ocean. Manual has a chapter on "Listener Safety" that's entirely redacted. | Corporate uncanny |
| Timing (13-20) | Predecessor's notes reveal they figured out the signal encoding. The broadcasts aren't entertainment — they're instructions. The "listeners" are following them. Your tools are getting powerful enough to decode what the instructions say. | Paranoia, complicity |
| Advanced (21+) | The manager's memos drop all pretense. You're building the final transmission. You realize every engineer before you built one piece of it. Your recursive tool-building has been assembling something across decades of engineers. Choice: transmit or don't. | Culmination |

### Why It Works

- Corporate memos are the most Zachtronics delivery mechanism possible
- The "mysterious employer" trope maps to the faceless puzzle-giver
- Every tool you build was "requested" — reframes the progression as something directed
- The station manual doubles as a game manual with narrative flavor
- Multiple document types keep the reading varied without being heavy

---

## Concept 4: "The Bench" (Apprentice's Workshop)

### Premise

Your mentor, Sadie Huang, was the greatest signal engineer who ever lived. She built instruments that could do things no one else could replicate. She left you her workshop — "The Bench" — and a journal filled with her designs. Each puzzle is you rebuilding one of Sadie's tools from her notes, following the path she walked decades ago. But her later journal entries suggest she was building toward something specific, and she never finished.

### Narrative Delivery

- **Sadie's journal** — design notes for each tool, but also personal reflections, sketches, and observations. Warm, precise, occasionally funny.
- **Letters from colleagues** — other engineers writing to Sadie, requesting her tools, expressing admiration or skepticism
- **Your own notes** — brief first-person observations that appear after completing each puzzle ("Sadie made this look easy. Took me four hours.")
- **The blueprint** — a growing schematic that Sadie's journal references, revealed piece by piece

### Arc Mapping

| Game Arc | Story Arc | Tone |
|----------|-----------|------|
| Tutorial (1-5) | Early journal. Sadie as a young engineer, excited, discovering fundamentals. Her notes are patient and clear — she's teaching you through time. | Warm, mentor-student |
| Signal Shaping (6-12) | Middle journal. Sadie's tools are getting sophisticated. Colleagues write asking for custom builds. She mentions "the composition" for the first time — something she's been working toward. | Craftsmanship, ambition |
| Timing (13-20) | Late journal. Sadie is obsessive. She's stopped taking commissions. The composition requires tools that don't exist yet — she's inventing new processing techniques. Letters from concerned friends. | Dedication, isolation |
| Advanced (21+) | Final journal entries. Sadie got close but couldn't finish. The composition is a signal processing chain so complex it requires every tool she ever built, nested recursively — the ultimate expression of the game's core mechanic. You finish what she started. | Legacy, completion |

### Why It Works

- The tool-building IS the story — you're literally rebuilding her toolkit
- The recursive nesting mechanic has a narrative mirror: Sadie's grand composition
- A mentor who communicates through left-behind notes is emotionally resonant
- "Finish the master's work" gives the endgame a clear emotional goal
- The journal entries can contain real signal processing insight, making them feel educational, not decorative
- Closest to Zachtronics' "craftsperson" tone (Opus Magnum especially)

---

## Concept 5: "Signals in the Static" (Numbers Station / Cold War)

### Premise

It's 1983. You work in a basement office of the Ministry of Communications in an unnamed Eastern Bloc country. Your official title is "Signal Conditioning Technician." Your real job: process encoded transmissions for intelligence operations you know nothing about. You receive assignments on carbon-copy forms. You build the processing chains. You don't ask questions.

### Narrative Delivery

- **Assignment forms** — stamped, numbered, sometimes with sections blacked out. Your puzzle briefs.
- **Intercepted transmissions** — signals from "the other side" that you're asked to decode or counter
- **Co-worker notes** — passed on scraps of paper. Gossipy, human, sometimes warning you about things
- **Internal memos** — bureaucratic directives that reveal the organization's priorities and paranoia
- **Samizdat** — forbidden writings that start appearing in your desk, suggesting the signals carry a message the Ministry doesn't want decoded

### Arc Mapping

| Game Arc | Story Arc | Tone |
|----------|-----------|------|
| Tutorial (1-5) | First week on the job. Everything by the book. Co-worker shows you around. Assignments are simple conditioning tasks. | Bureaucratic, mundane |
| Signal Shaping (6-12) | You're good at this. Promoted to harder work. Co-worker hints that some signals "aren't what they say." An assignment form arrives with no originating department. | Controlled unease |
| Timing (13-20) | A co-worker disappears. Samizdat appears. The unauthorized signals contain a pattern — someone is using the Ministry's own infrastructure to transmit something hidden in the noise floor. You have the tools to find it. | Tension, moral choice |
| Advanced (21+) | You decode the hidden signal. It's a complete record of what the Ministry has done — evidence, names, dates — encoded as a signal processing chain so complex that only someone who built every tool from scratch could decode it. The previous technician (who "left") built it. Now you choose: complete the decode, or bury it. | Stakes, purpose |

### Why It Works

- Cold War numbers stations ARE signal processing — zero thematic gap
- The bureaucratic tone matches Zachtronics perfectly (Shenzhen I/O, TIS-100)
- Carbon-copy forms and internal memos are visually distinctive
- "Don't ask questions, just process signals" mirrors how players approach puzzles
- The hidden-signal-in-the-noise is a perfect metaphor for the game's mechanics
- Moral dimension adds weight without requiring branching gameplay

---

## Comparison Matrix

| Criteria | The Relay | The Archive | The Broadcast | The Bench | Signals in the Static |
|----------|-----------|-------------|---------------|-----------|----------------------|
| Thematic fit with signal processing | Strong | Strong | Medium | Strong | Very strong |
| Zachtronics tone match | Good | Good | Strong | Good (Opus Magnum) | Very strong (TIS-100) |
| Emotional range | Mystery → awe | Melancholy → awe | Mundane → horror | Warm → bittersweet | Tense → defiant |
| Narrative complexity | Medium | Medium | High | Low-Medium | High |
| Document variety | 4 types | 4 types | 4 types | 4 types | 5 types |
| Reframes the game loop | Tools = equipment repair | Tools = restoration techniques | Tools = assignments | Tools = mentor's designs | Tools = decryption chain |
| Risk | "Cosmic horror" could feel generic | "Lost civilization" is well-worn | Hardest to keep coherent | Least surprising | Period setting limits audience? |

---

## Recommendation

**The Bench** (Concept 4) is the safest choice — the narrative IS the mechanic, and it's hard to get wrong. The mentor's journal provides natural tutorial text, and the emotional arc is clean.

**Signals in the Static** (Concept 5) is the boldest choice — it has the strongest Zachtronics energy, the most tension, and the deepest thematic integration. But it requires more careful writing to avoid cliches.

**The Archive** (Concept 2) is the best middle ground — evocative, thematically pure, and the "restored recordings as narrative content" mechanic is genuinely novel.

These aren't mutually exclusive at the structural level. The delivery mechanism (text documents between puzzles, 2-4 document types, skippable) is the same for all five. The choice is primarily about tone and setting.

---

## Implementation Notes (If Pursued)

### Minimal Implementation

- Add a `narrative/` directory under `src/` or alongside puzzle definitions
- Each level gets an optional `NarrativeContent` object: `{ documents: Document[] }`
- `Document = { type: 'memo' | 'journal' | 'letter' | ...; title: string; body: string }`
- Display as a simple overlay before/after puzzle (same overlay system already built)
- No new dependencies. Pure text content.

### Content Volume

- ~100-200 words per level (2-3 short documents)
- 45 levels × ~150 words = ~6,750 words total
- Roughly equivalent to a long short story
- Could be written in a few focused sessions

### Integration Points

- Level select screen shows document icons for unread narrative
- Post-victory: narrative documents appear after ceremony animation, before zoom-out
- Pre-puzzle: optional "briefing" document with the assignment framing
- All skippable with a single keypress
