import numpy as np
import pandas as pd
from typing import List, Dict
from models import LadderInput, LadderResult, LadderStep, TipsYield


class TipsLadderCalculator:

    def __init__(self, ladder_input: LadderInput):
        self.input = ladder_input
        self.steps: List[LadderStep] = []

    def calculate_ladder(self) -> LadderResult:
        """Calculate the complete TIPS ladder based on input parameters"""

        # Initialize variables
        current_age = self.input.current_age
        current_year = self.input.current_year
        inflation_rate = self.input.inflation_rate
        tax_rate = self.input.tax_rate

        # Create yield lookup
        yield_lookup = {y.maturity_years: y.yield_rate for y in self.input.tips_yields}

        total_investment = 0.0

        for i, target_income in enumerate(self.input.target_income_stream):
            age = current_age + i
            year = current_year + i
            years_out = i + 0.5  # Mid-year assumption

            # Get real interest rate for this maturity
            real_interest_rate = self._get_interpolated_yield(yield_lookup, years_out)

            # Calculate step values based on spreadsheet formulas
            step = self._calculate_step(
                age=age,
                year=year,
                target_income=target_income,
                real_interest_rate=real_interest_rate,
                years_out=years_out,
                inflation_rate=inflation_rate,
                tax_rate=tax_rate
            )

            self.steps.append(step)
            total_investment += step.ladder_amount_today

        # Calculate summary metrics
        total_real_income = sum(step.real_posttax_income for step in self.steps)
        post_tax_yield = self._calculate_post_tax_yield()
        npv_taxes = sum(step.nominal_aftertax_discounted - step.nominal_income_discounted
                       for step in self.steps)
        post_tax_real_gain = (total_real_income / total_investment) - 1.0 if total_investment > 0 else 0.0

        return LadderResult(
            steps=self.steps,
            total_investment_required=total_investment,
            total_real_income=total_real_income,
            post_tax_yield=post_tax_yield,
            npv_taxes=npv_taxes,
            post_tax_real_gain=post_tax_real_gain
        )

    def _calculate_step(self, age: int, year: int, target_income: float,
                       real_interest_rate: float, years_out: float,
                       inflation_rate: float, tax_rate: float) -> LadderStep:
        """Calculate individual ladder step based on spreadsheet formulas"""

        # Real interest inflator: (1 + real_rate)^years_out
        real_interest_inflator = (1 + real_interest_rate) ** years_out

        # Real discount rate: 1 / real_interest_inflator
        real_discount_rate = 1 / real_interest_inflator

        # Inflation inflator: (1 + inflation)^years_out
        inflation_inflator = (1 + inflation_rate) ** years_out

        # Inflation deflator: 1 / inflation_inflator
        inflation_deflator = 1 / inflation_inflator

        # Nominal interest rate for this horizon
        nominal_interest_rate = (1 + real_interest_rate) * (1 + inflation_rate) - 1

        # Calculate ladder amount needed today (present value of target income)
        ladder_amount_today = target_income * real_discount_rate

        # Amount in play at time t (before payout) = ladder_amount * real_interest_inflator
        amount_in_play = ladder_amount_today * real_interest_inflator

        # Taxable gain = amount_in_play - ladder_amount_today
        taxable_gain = amount_in_play - ladder_amount_today

        # Taxes = taxable_gain * tax_rate
        taxes = taxable_gain * tax_rate

        # Nominal income pretax = target_income * inflation_inflator
        nominal_income_pretax = target_income * inflation_inflator

        # Nominal income post-tax = nominal_income_pretax - taxes
        nominal_income_posttax = nominal_income_pretax - taxes

        # Real post-tax income = nominal_income_posttax * inflation_deflator
        real_posttax_income = nominal_income_posttax * inflation_deflator

        # Total discount factor for NPV calculations
        total_discount_factor = (1 + nominal_interest_rate) ** years_out
        total_discount_divisor = 1 / total_discount_factor

        # Discounted values
        nominal_income_discounted = nominal_income_pretax * total_discount_divisor
        nominal_aftertax_discounted = nominal_income_posttax * total_discount_divisor

        return LadderStep(
            age=age,
            year=year,
            target_income=target_income,
            real_interest_rate=real_interest_rate,
            years_out=years_out,
            real_interest_inflator=real_interest_inflator,
            real_discount_rate=real_discount_rate,
            ladder_amount_today=ladder_amount_today,
            inflation_inflator=inflation_inflator,
            inflation_deflator=inflation_deflator,
            nominal_interest_rate=nominal_interest_rate,
            amount_in_play=amount_in_play,
            taxable_gain=taxable_gain,
            taxes=taxes,
            nominal_income_pretax=nominal_income_pretax,
            nominal_income_posttax=nominal_income_posttax,
            real_posttax_income=real_posttax_income,
            total_discount_factor=total_discount_factor,
            total_discount_divisor=total_discount_divisor,
            nominal_income_discounted=nominal_income_discounted,
            nominal_aftertax_discounted=nominal_aftertax_discounted
        )

    def _get_interpolated_yield(self, yield_lookup: Dict[float, float], years_out: float) -> float:
        """Interpolate yield for given maturity"""
        maturities = sorted(yield_lookup.keys())

        # If exact match, return it
        if years_out in yield_lookup:
            return yield_lookup[years_out]

        # Find bounding maturities
        lower_mat = None
        upper_mat = None

        for mat in maturities:
            if mat <= years_out:
                lower_mat = mat
            elif mat > years_out and upper_mat is None:
                upper_mat = mat
                break

        # Linear interpolation
        if lower_mat is None:
            return yield_lookup[maturities[0]]
        elif upper_mat is None:
            return yield_lookup[maturities[-1]]
        else:
            # Linear interpolation between bounds
            weight = (years_out - lower_mat) / (upper_mat - lower_mat)
            return yield_lookup[lower_mat] + weight * (yield_lookup[upper_mat] - yield_lookup[lower_mat])

    def _calculate_post_tax_yield(self) -> float:
        """Calculate effective post-tax yield"""
        if not self.steps:
            return 0.0

        total_investment = sum(step.ladder_amount_today for step in self.steps)
        total_posttax_income = sum(step.real_posttax_income for step in self.steps)

        if total_investment == 0:
            return 0.0

        # Simple average yield approximation
        avg_years = sum(step.years_out for step in self.steps) / len(self.steps)
        return (total_posttax_income / total_investment) ** (1 / avg_years) - 1.0