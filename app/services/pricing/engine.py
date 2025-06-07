"""
Pricing engine for calculating project costs and generating quotes.
"""
from typing import List, Dict, Any

from app.repositories.rate_repository import rate_repository
from app.db.models import Rate, RateType


class PricingEngine:
    """
    Handles cost calculation and pricing logic.
    """

    async def calculate_cost(self, components: List[Dict[str, Any]]) -> float:
        """
        Calculates the total cost for a list of project components.

        Args:
            components: A list of dictionaries, where each dictionary
                        represents a project component with keys like
                        'rate_name', 'quantity'.

        Returns:
            The total calculated cost.
        """
        rates = await rate_repository.get_all_rates(is_active=True)
        rate_map = {rate.name: rate for rate in rates}
        
        total_cost = 0.0
        for component in components:
            rate_name = component.get("rate_name")
            quantity = component.get("quantity", 0)
            
            if rate_name in rate_map:
                rate = rate_map[rate_name]
                total_cost += rate.cost * quantity
        
        return total_cost

    def generate_quote(self, cost: float, margin: float = 0.2) -> Dict[str, Any]:
        """
        Generates a quote with a given margin.

        Args:
            cost: The total calculated cost.
            margin: The profit margin to apply.

        Returns:
            A dictionary representing the final quote.
        """
        price = cost / (1 - margin)
        profit = price - cost
        
        return {
            "cost": round(cost, 2),
            "price": round(price, 2),
            "margin": round(margin, 2),
            "profit": round(profit, 2),
        }

pricing_engine = PricingEngine()

def calculate_cost(blueprint: dict) -> float:
    """
    Calculates the total cost of a project based on a blueprint.
    For now, this is a placeholder.
    """
    # In the future, this will read from a rates table and a blueprint
    # with hour estimates per role.
    print("Calculating cost for blueprint:", blueprint.get("title", "Untitled"))
    return 1000.0  # Placeholder value

def apply_margin(cost: float, margin_percentage: float) -> float:
    """
    Applies a margin to the cost to determine the price.
    """
    return cost * (1 + margin_percentage / 100)

def generate_price_tiers(base_price: float) -> dict:
    """
    Generates different pricing tiers.
    """
    return {
        "basic": base_price,
        "standard": base_price * 1.2,
        "premium": base_price * 1.5,
    } 