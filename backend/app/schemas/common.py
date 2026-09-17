from pydantic import BaseModel


class ErrorBody(BaseModel):
    accepted: bool = False
    code: str
    detail: str | None = None
