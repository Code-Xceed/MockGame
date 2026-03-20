# ADR-0001: Modular Monolith First

Date: 2026-03-19
Status: Accepted

## Decision
Start with a modular monolith in NestJS and extract services only when scale and team topology require it.

## Rationale
- Faster initial delivery.
- Lower operational complexity during MVP.
- Clear domain boundaries can still be enforced with modules/events.

## Consequences
- Need strict module boundaries from day one.
- Extraction plan should be revisited at traffic milestones.
