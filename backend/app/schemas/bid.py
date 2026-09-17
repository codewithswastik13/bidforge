from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class BidRequest(BaseModel):
    amount: Decimal


class BidAccepted(BaseModel):
    accepted: bool = True
    bid_id: str
    auction_id: str
    amount: Decimal
    version: int
    current_price: Decimal


class BidRejected(BaseModel):
    accepted: bool = False
    code: str
    attempted_amount: Decimal
    current_price: Decimal
    minimum_bid: Decimal
    version: int


class BidHistoryItem(BaseModel):
    bid_id: str
    bidder: str
    amount: Decimal
    version: int
    created_at: datetime

    model_config = {"from_attributes": True}
