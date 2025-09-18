from pydantic import BaseModel
from typing import List, Optional
from datetime import date


class TipsYield(BaseModel):
    maturity_years: float
    yield_rate: float


class LadderInput(BaseModel):
    current_age: int
    time_horizon: int  # years
    current_year: int
    current_month: int
    start_year: int
    start_month: int
    target_income_stream: List[float]  # real pretax income by year
    inflation_rate: float = 0.03
    tax_rate: float = 0.2
    tips_yields: List[TipsYield]


class LadderStep(BaseModel):
    age: int
    year: int
    target_income: float
    real_interest_rate: float
    years_out: float
    real_interest_inflator: float
    real_discount_rate: float
    ladder_amount_today: float
    inflation_inflator: float
    inflation_deflator: float
    nominal_interest_rate: float
    amount_in_play: float
    taxable_gain: float
    taxes: float
    nominal_income_pretax: float
    nominal_income_posttax: float
    real_posttax_income: float
    total_discount_factor: float
    total_discount_divisor: float
    nominal_income_discounted: float
    nominal_aftertax_discounted: float


class LadderResult(BaseModel):
    steps: List[LadderStep]
    total_investment_required: float
    total_real_income: float
    post_tax_yield: float
    npv_taxes: float
    post_tax_real_gain: float