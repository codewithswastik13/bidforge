"""Business-rule failures for the auction engine.

These map directly onto the error contract in
RTB_Auction_System_Framework.md section 18 (409 for business rejections,
503 for infrastructure contention). Routes catch these explicitly; there
is also a catch-all FastAPI exception handler in main.py as a safety net.
"""
from decimal import Decimal


class AuctionError(Exception):
    code: str = "AUCTION_ERROR"
    status_code: int = 409


class AuctionNotLive(AuctionError):
    code = "AUCTION_NOT_LIVE"


class AuctionEnded(AuctionError):
    code = "AUCTION_ENDED"


class AuctionNotFound(AuctionError):
    code = "AUCTION_NOT_FOUND"
    status_code = 404


class BidTooLow(AuctionError):
    code = "BID_TOO_LOW"

    def __init__(
        self,
        current_price: Decimal,
        minimum_bid: Decimal,
        attempted_amount: Decimal,
        version: int = 0,
    ):
        self.current_price = current_price
        self.minimum_bid = minimum_bid
        self.attempted_amount = attempted_amount
        self.version = version
        super().__init__(
            f"Bid {attempted_amount} is below minimum {minimum_bid} "
            f"(current price {current_price})"
        )


class DatabaseContention(AuctionError):
    code = "DATABASE_CONTENTION"
    status_code = 503
