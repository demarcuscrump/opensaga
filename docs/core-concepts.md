# Core Concepts

Understanding the core entities of OpenSaga is vital for contributing to the platform.

## Worlds
A **World** is a root-level collaborative universe. It is the container for all rules, lore, and characters. Each World defines its own Governance Model and specific visual identity (hero images, tags).

## The World Bible
The **World Bible** is the canonical source of truth for a World. It contains the rules, magic systems, history, geography, and tone of the universe. Contributors use the World Bible as the baseline when proposing new content.

## Proposals & Characters
Users cannot simply "add" content to a World. Instead, they submit a **Proposal** (such as a new Character or a lore entry). A Proposal starts in a `DRAFT` or `PROPOSAL` status and must undergo a community vote.

## Canon & Governance
When a Proposal receives enough votes (based on the World's Voting Threshold and Governance Model), its status transitions to `CANON`. If it is rejected, it becomes `REJECTED`. 

**Governance Models:**
1. **Creator Approved:** Only the original creator of the World has the power to accept/reject proposals.
2. **Community Vote (Democracy):** Proposals are accepted if they meet a specific threshold of community upvotes (e.g., 60%).
3. **Lorekeeper Council (Oligarchy):** A designated group of high-ranking "Lorekeeper" users hold the voting power to establish Canon.
