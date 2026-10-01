---
name: ddd-analysis
description: Úsala siempre que escribas, modifiques o revises código que trabaje
---
# Domain-Driven Development — Semantic Analysis

## When to use

- Raw or ambiguous requirements.
- Different stakeholders use the same word with different meaning.
- Multiple documents describe overlapping concepts with inconsistent names.
- A feature feels tangled — the real conflict is about language, not logic.

## Workflow

1. **Extract domain terms** — every noun and verb with business meaning
2. **Detect polysemy** — does a nutritionist and a developer understand the same thing?
3. **Group into Bounded Contexts** — by ubiquitous language, coherent rules, independent lifecycle
4. **Flag conflicts** — name contexts, explain why they collide, propose canonical term

## Expected output

- **Polysemic terms**: table with Term, Meaning Context A, Meaning Context B, Conflict
- **Bounded Context Map**: contexts, core terms, relationships (upstream/downstream, shared kernel)
- **Semantic knots**: terms that block progress by meaning incompatible things
- **Disambiguation suggestions**: proposed resolution for each conflict

## Hard rule

- **Untie the semantic knot before coding.** No code. Analysis only.

## Checklist de revisión
- [ ] ¿Algún toISOString() o new Date("AAAA-MM-DD")?
- [ ] ¿Algun calculo con 86400000 milisegundos?
- [ ] ¿Que pasa con una sesión registrada a las 00:30?
- [ ] ¿Que pasa con el día del cambio de hora (último domingo de marzo y octubre)?
- [ ] ¿Se ignoran las fechas futuras donde corresponde?

## Al terminar
Indica qué puntos del checklist has comprobado y cómo.