"""Small, auditable editorial layer. These are reflection prompts, not predictions."""

from .aspects import load_rules
from .models import Aspect, DailyAspect, ReadingCard

PERSONAL_BODIES = frozenset({"sun", "moon", "mercury", "venus", "mars"})


def aspect_cards(aspects: list[Aspect], *, context: str) -> list[ReadingCard]:
    rules = load_rules()
    # At least one personal planet; avoid ranking generational outer/outer
    # alignments as if they were distinctive relationship evidence.
    candidates = [
        a for a in aspects if a.left_body in PERSONAL_BODIES or a.right_body in PERSONAL_BODIES
    ]
    cards = []
    for aspect in candidates[: rules["reading_card_limit"]]:
        a, b = aspect.left_body, aspect.right_body
        if context == "synastry":
            title = f"A's {a.title()} {aspect.aspect} B's {b.title()}"
        else:
            title = f"Transiting {a.title()} {aspect.aspect} natal {b.title()}"
        text = (
            f"In this astrology framework, {a.title()} relates to {rules['body_themes'][a]}, "
            f"and {b.title()} to {rules['body_themes'][b]}. "
            f"{rules[f'{context}_prompts'][aspect.aspect]}"
        )
        cards.append(ReadingCard(evidence_id=aspect.id, title=title, text=text))
    return cards


def daily_cards(aspects: list[DailyAspect]) -> list[ReadingCard]:
    rules = load_rules()
    cards = []
    for aspect in aspects:
        if aspect.natal_body not in PERSONAL_BODIES:
            continue
        a, b = aspect.transiting_body, aspect.natal_body
        cards.append(
            ReadingCard(
                evidence_id=aspect.id,
                title=f"{a.title()} {aspect.aspect} your natal {b.title()}",
                text=(
                    f"A reflection on {rules['body_themes'][a]} and {rules['body_themes'][b]}. "
                    f"{rules['transit_prompts'][aspect.aspect]}"
                ),
            )
        )
        if len(cards) == rules["reading_card_limit"]:
            break
    return cards
