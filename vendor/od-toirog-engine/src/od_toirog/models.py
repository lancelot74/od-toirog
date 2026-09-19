from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class BirthInput(StrictModel):
    local_date: date
    local_time: time = Field(description="Recorded local birth time; never substitute noon.")
    timezone: str = Field(min_length=1, max_length=100, examples=["Asia/Ulaanbaatar"])
    fold: Literal[0, 1] | None = Field(
        default=None, description="For a repeated clock time: 0 = earlier, 1 = later."
    )
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @field_validator("local_date")
    @classmethod
    def require_supported_year(cls, value: date) -> date:
        if not 1900 <= value.year <= 2099:
            raise ValueError("This version supports birth dates from 1900 to 2099.")
        return value

    @field_validator("local_time")
    @classmethod
    def require_wall_time(cls, value: time) -> time:
        if value.tzinfo is not None:
            raise ValueError("Use a local clock time without an offset; supply an IANA timezone.")
        return value

    @model_validator(mode="after")
    def coordinates_together(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("Supply both latitude and longitude, or neither.")
        return self


class NatalRequest(StrictModel):
    birth: BirthInput


class SynastryRequest(StrictModel):
    person_a: BirthInput
    person_b: BirthInput


class TransitRequest(StrictModel):
    birth: BirthInput
    at: datetime = Field(description="ISO instant including Z or an explicit UTC offset.")

    @field_validator("at")
    @classmethod
    def require_offset(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Transit time must include Z or an explicit UTC offset.")
        return value


class DailyRequest(StrictModel):
    birth: BirthInput
    date: date
    timezone: str = Field(
        min_length=1,
        max_length=100,
        description="Timezone of the day being read; can differ from the birth timezone.",
    )


class Provenance(StrictModel):
    engine_version: str
    astronomy_library: str
    ephemeris: str
    ephemeris_sha256: str
    time_data_sha256: str
    timezone_database: str
    coordinate_system: str
    observer: Literal["earth_center"] = "earth_center"
    zodiac: Literal["tropical"] = "tropical"
    calendar: Literal["proleptic_gregorian"] = "proleptic_gregorian"
    speed_method: str
    rules_version: str
    rules_sha256: str
    supported_utc_start: datetime
    supported_utc_end_exclusive: datetime


class Position(StrictModel):
    body: str
    target_id: int
    target_kind: Literal["body_center", "system_barycenter"]
    longitude_deg: float
    latitude_deg: float
    distance_au: float
    sign: str
    degree_in_sign: float
    speed_deg_per_day: float
    retrograde: bool
    motion: Literal["direct", "retrograde", "stationary"]


class Aspect(StrictModel):
    id: str
    left_body: str
    right_body: str
    aspect: str
    angle_deg: float
    separation_deg: float
    orb_deg: float
    allowed_orb_deg: float
    geometric_strength: float = Field(
        description="Orb proximity, not a probability or match score."
    )


class ReadingCard(StrictModel):
    evidence_id: str
    title: str
    text: str


class Chart(StrictModel):
    birth: BirthInput
    utc: datetime
    utc_offset_seconds: int
    positions: list[Position]
    aspects: list[Aspect]
    houses: None = None
    ascendant: None = None
    midheaven: None = None


class NatalResponse(StrictModel):
    provenance: Provenance
    chart: Chart


class SynastryResponse(StrictModel):
    provenance: Provenance
    person_a: Chart
    person_b: Chart
    aspects: list[Aspect]
    reading: list[ReadingCard]
    interpretation_status: Literal["editorial_rules_v1"] = "editorial_rules_v1"
    compatibility_score: None = Field(default=None, description="No validated numeric score.")


class TransitResponse(StrictModel):
    provenance: Provenance
    natal: Chart
    at_utc: datetime
    transiting_positions: list[Position]
    aspects: list[Aspect]
    reading: list[ReadingCard]


class DailyAspect(StrictModel):
    id: str
    transiting_body: str
    natal_body: str
    aspect: str
    angle_deg: float
    allowed_orb_deg: float
    closest_sample_utc: datetime
    closest_sample_local: datetime
    closest_sample_orb_deg: float
    geometric_strength_at_sample: float
    first_in_orb_sample_utc: datetime | None
    last_in_orb_sample_utc: datetime | None
    in_orb_sample_count: int
    exact_crossings_utc: list[datetime]
    exact_crossings_local: list[datetime]


class DailyResponse(StrictModel):
    provenance: Provenance
    natal: Chart
    date: date
    timezone: str
    start_utc: datetime
    end_utc_exclusive: datetime
    duration_hours: float
    sample_step_minutes: int
    sampling_status: Literal["sampled_with_refined_crossings"] = "sampled_with_refined_crossings"
    continuous_window_boundaries_supported: Literal[False] = False
    aspects: list[DailyAspect]
    reading: list[ReadingCard]
