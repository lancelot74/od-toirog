from datetime import datetime

from .aspects import find_aspects, load_rules
from .astronomy import SkyfieldProvider
from .daily import scan_day
from .models import (
    BirthInput,
    Chart,
    DailyRequest,
    DailyResponse,
    NatalRequest,
    NatalResponse,
    SynastryRequest,
    SynastryResponse,
    TransitRequest,
    TransitResponse,
)
from .readings import aspect_cards, daily_cards
from .timezones import civil_day, get_zone, local_to_utc, require_supported


class Engine:
    """Framework-independent service, also usable directly inside another backend."""

    def __init__(self, provider: SkyfieldProvider):
        self.provider = provider

    def chart(self, birth: BirthInput) -> Chart:
        naive = datetime.combine(birth.local_date, birth.local_time)
        utc = require_supported(local_to_utc(naive, birth.timezone, birth.fold))
        positions = self.provider.positions(utc)
        offset = utc.astimezone(get_zone(birth.timezone)).utcoffset()
        return Chart(
            birth=birth,
            utc=utc,
            utc_offset_seconds=int(offset.total_seconds()),
            positions=positions,
            aspects=find_aspects(positions),
        )

    def natal(self, request: NatalRequest) -> NatalResponse:
        return NatalResponse(provenance=self.provider.provenance, chart=self.chart(request.birth))

    def synastry(self, request: SynastryRequest) -> SynastryResponse:
        a, b = self.chart(request.person_a), self.chart(request.person_b)
        aspects = find_aspects(a.positions, b.positions, mode="synastry")
        return SynastryResponse(
            provenance=self.provider.provenance,
            person_a=a,
            person_b=b,
            aspects=aspects,
            reading=aspect_cards(aspects, context="synastry"),
        )

    def transits(self, request: TransitRequest) -> TransitResponse:
        chart = self.chart(request.birth)
        utc = require_supported(request.at)
        positions = self.provider.positions(utc)
        aspects = find_aspects(positions, chart.positions, mode="transit")
        return TransitResponse(
            provenance=self.provider.provenance,
            natal=chart,
            at_utc=utc,
            transiting_positions=positions,
            aspects=aspects,
            reading=aspect_cards(aspects, context="transit"),
        )

    def daily(self, request: DailyRequest) -> DailyResponse:
        start, end = civil_day(request.date, request.timezone)
        chart = self.chart(request.birth)
        aspects = scan_day(self.provider, chart.positions, start, end, request.timezone)
        return DailyResponse(
            provenance=self.provider.provenance,
            natal=chart,
            date=request.date,
            timezone=request.timezone,
            start_utc=start,
            end_utc_exclusive=end,
            duration_hours=(end - start).total_seconds() / 3600,
            sample_step_minutes=load_rules()["daily_sample_minutes"],
            aspects=aspects,
            reading=daily_cards(aspects),
        )
