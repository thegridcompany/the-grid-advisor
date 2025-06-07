"""
Repository for handling database operations for Rates.
"""
from typing import List, Optional
from uuid import UUID

from app.core.database import db_manager, DatabaseError
from app.db.models import Rate


class RateRepository:
    """
    Repository for Rates.
    """

    async def create_rate(self, rate: Rate) -> Rate:
        """
        Create a new rate.

        Args:
            rate: The rate to create.

        Returns:
            The created rate.
        """
        rate_dict = rate.model_dump(exclude_unset=True)
        created_rate = await db_manager.create("rates", rate_dict)
        if not created_rate:
            raise DatabaseError("Failed to create rate.")
        return Rate(**created_rate)

    async def get_rate_by_id(self, rate_id: UUID) -> Optional[Rate]:
        """
        Get a rate by its ID.

        Args:
            rate_id: The ID of the rate.

        Returns:
            The rate, or None if not found.
        """
        rate_data = await db_manager.get_by_id("rates", str(rate_id))
        return Rate(**rate_data) if rate_data else None

    async def get_all_rates(self, is_active: Optional[bool] = None) -> List[Rate]:
        """
        Get all rates, optionally filtering by active status.

        Args:
            is_active: Filter by active status if provided.

        Returns:
            A list of rates.
        """
        filters = {}
        if is_active is not None:
            filters["is_active"] = is_active
        
        rates_data = await db_manager.get_many("rates", filters=filters)
        return [Rate(**rate) for rate in rates_data]

    async def update_rate(self, rate_id: UUID, rate_update: Rate) -> Optional[Rate]:
        """
        Update a rate.

        Args:
            rate_id: The ID of the rate to update.
            rate_update: The new rate data.

        Returns:
            The updated rate, or None if not found.
        """
        update_data = rate_update.model_dump(exclude_unset=True)
        updated_rate_data = await db_manager.update("rates", str(rate_id), update_data)
        return Rate(**updated_rate_data) if updated_rate_data else None

    async def delete_rate(self, rate_id: UUID) -> bool:
        """
        Delete a rate.

        Args:
            rate_id: The ID of the rate to delete.

        Returns:
            True if deleted, False otherwise.
        """
        return await db_manager.delete("rates", str(rate_id))

rate_repository = RateRepository() 