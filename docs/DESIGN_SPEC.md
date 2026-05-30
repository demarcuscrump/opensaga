# OpenSaga Design Spec

OpenSaga should feel like a timeless canon archive that lets every fictional
world bring its own color. The product identity is neutral, literary, and
source-of-truth oriented; individual worlds provide the expressive layer.

## Design Rule

OpenSaga is monochrome. Worlds are colorful. Canon is gold.

## Design Principles

- The platform should feel like a high-end library, wiki, archive, and creative
  governance system.
- System UI stays neutral so user-created worlds can own their mood.
- Canon status must be visually clear without turning the whole app colorful.
- Creative tools should feel useful and calm, not like prompt spam.
- Do not use emoji as navigation, badges, product marks, or formal status.

## Core Brand Tokens

| Token | Hex | Usage |
| --- | ---: | --- |
| Canon Black | `#0B0B0D` | Logo, primary text, authority, primary CTA |
| Archive White | `#FAF9F6` | Main Paper background |
| Soft Parchment | `#F3EFE7` | Panels, empty states, lore surfaces |
| Mist Grey | `#DCD8D0` | Borders, dividers, passive controls |
| Scribe Grey | `#6E6A63` | Secondary text |
| Canon Gold | `#C6A15B` | Canon badges and accepted entries |

## Canon Loop Status Tokens

| Status | Hex | Meaning |
| --- | ---: | --- |
| Proposal | `#6D5DF6` | New idea or imagination state |
| Vote | `#3B82F6` | Community decision process |
| Canon | `#C6A15B` | Accepted truth |
| Archived | `#9A948C` | Rejected, inactive, or historical |
| Conflict | `#D56A3A` | Continuity issue or review needed |

## World Accent Rule

Each world may define an `accentColor`. The accent can appear on world cards,
world headers, genre pills, map/timeline highlights, and world-specific empty
states. Global navigation, primary product actions, account settings, and admin
controls remain in the OpenSaga core palette.

## Typography

- Use readable editorial typography.
- Keep system labels and governance states compact.
- World titles can be expressive, but world content should remain legible.
- Creator Studio controls should use practical interface scale.

## Layout

- World Bible pages should behave like a source-of-truth document.
- Proposal pages should clearly separate idea, evidence, discussion, votes, and
  canon result.
- Creator Studio should group tools by creative intent, not by model provider.
- Character board outputs should be modular and selectable.

## Accessibility

- Proposal, vote, canon, rejected, and conflict states must use labels as well
  as color.
- Preserve keyboard navigation for creation tools, voting, modals, and settings.
- World accent colors must be contrast-checked against their surface.
- User-uploaded and generated character images need clear alt text.
