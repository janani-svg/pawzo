# Pawzo — Documentation

Reference and specification documents for the **Pawzo** pet health & wellness app.
For setup and how to run the project, see the [root README](../README.md).

## Documents

| Document | What it covers |
|----------|----------------|
| [PAWZO_Project_Context.md](PAWZO_Project_Context.md) | Product scope, features, user flows, and roadmap |
| [SYSTEM_FLOW.md](SYSTEM_FLOW.md) | User journeys, screen structure, and navigation |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | **As-built** database schema (mirrors the real SQLAlchemy models) |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Colors, components, motion, sound, and brand voice |
| [PAWZO_Typography_Font_Specifications.md](PAWZO_Typography_Font_Specifications.md) | Fonts and the type scale |
| [CLAUDE.md](CLAUDE.md) | Operating rules for AI assistants working on this project |

## Notes

- **Design docs** (`DESIGN_SYSTEM`, typography) describe design *intent* and are independent of the code.
- **`DATABASE_SCHEMA.md`** is kept in sync with [`backend/app/models/models.py`](../backend/app/models/models.py) — if they disagree, the code wins.
- The original UI was prototyped in Figma; the shipped app is a Next.js 16 PWA with a FastAPI + PostgreSQL backend.
