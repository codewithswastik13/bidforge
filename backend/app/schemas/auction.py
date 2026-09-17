from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class AuctionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    starting_price: Decimal = Field(gt=0)
    min_increment: Decimal = Field(default=Decimal("1.00"), gt=0)
    starts_at: datetime
    ends_at: datetime


class AuctionResponse(BaseModel):
    auction_id: str
    title: str
    description: str | None
    starting_price: Decimal
    min_increment: Decimal
    current_price: Decimal
    version: int
    status: str
    current_winner: str | None
    starts_at: datetime
    ends_at: datetime

    model_config = {"from_attributes": True}


class AuctionListResponse(BaseModel):
    items: list[AuctionResponse]
    total: int
