"""
Seed initial data for Grid Brain.
"""
import asyncio
from uuid import uuid4
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_db_manager
from app.core.logging import setup_logging, get_logger

setup_logging()
logger = get_logger(__name__)


async def seed_team_members():
    """Seed initial team members (the 4 partners)."""
    db = get_db_manager()
    
    team_members = [
        {
            "id": str(uuid4()),
            "email": "paolo.biancalana@thegridcompany.it",
            "name": "Paolo Biancalana",
            "role": "CEO & Co-Founder",
            "is_active": True,
            "notification_preferences": {
                "email": True,
                "daily_briefing": True,
                "alerts": True
            }
        },
        {
            "id": str(uuid4()),
            "email": "andrea.rossi@thegridcompany.it",
            "name": "Andrea Rossi",
            "role": "CTO & Co-Founder",
            "is_active": True,
            "notification_preferences": {
                "email": True,
                "daily_briefing": True,
                "alerts": True
            }
        },
        {
            "id": str(uuid4()),
            "email": "marco.verdi@thegridcompany.it",
            "name": "Marco Verdi",
            "role": "Creative Director & Co-Founder",
            "is_active": True,
            "notification_preferences": {
                "email": True,
                "daily_briefing": True,
                "alerts": True
            }
        },
        {
            "id": str(uuid4()),
            "email": "luca.bianchi@thegridcompany.it",
            "name": "Luca Bianchi",
            "role": "Business Development & Co-Founder",
            "is_active": True,
            "notification_preferences": {
                "email": True,
                "daily_briefing": True,
                "alerts": True
            }
        }
    ]
    
    for member in team_members:
        try:
            # Check if already exists
            existing = await db.get_many("team_members", filters={"email": member["email"]})
            if not existing:
                created = await db.create("team_members", member)
                logger.info(f"Created team member: {member['name']}")
            else:
                logger.info(f"Team member already exists: {member['name']}")
        except Exception as e:
            logger.error(f"Failed to create team member {member['name']}: {str(e)}")


async def seed_sample_clients():
    """Seed some sample clients."""
    db = get_db_manager()
    
    sample_clients = [
        {
            "id": str(uuid4()),
            "name": "Acme Corporation",
            "email": "contact@acme.com",
            "company": "Acme Corporation",
            "industry": "Technology",
            "status": "active",
            "engagement_score": 75.0
        },
        {
            "id": str(uuid4()),
            "name": "Global Innovations Ltd",
            "email": "info@globalinnovations.com",
            "company": "Global Innovations Ltd",
            "industry": "Consulting",
            "status": "active",
            "engagement_score": 60.0
        },
        {
            "id": str(uuid4()),
            "name": "StartupX",
            "email": "hello@startupx.io",
            "company": "StartupX",
            "industry": "SaaS",
            "status": "prospect",
            "engagement_score": 40.0
        }
    ]
    
    for client in sample_clients:
        try:
            existing = await db.get_many("clients", filters={"email": client["email"]})
            if not existing:
                created = await db.create("clients", client)
                logger.info(f"Created sample client: {client['name']}")
            else:
                logger.info(f"Client already exists: {client['name']}")
        except Exception as e:
            logger.error(f"Failed to create client {client['name']}: {str(e)}")


async def migrate_to_workspace_system():
    """Migrate existing data to a multi-tenant workspace system."""
    logger.info("Starting workspace data migration...")
    db = get_db_manager()

    try:
        # 1. Get Super Admin ID (Paolo)
        paolo = await db.get_many("team_members", filters={"email": "paolo.biancalana@thegridcompany.it"})
        if not paolo:
            logger.error("Super admin 'Paolo Biancalana' not found. Aborting migration.")
            return
        owner_id = paolo[0]['id']

        # 2. Create default workspace
        default_workspace = {
            'id': str(uuid4()),
            'name': 'The Grid Company',
            'slug': 'thegrid',
            'description': 'Default workspace for The Grid Company',
            'owner_id': owner_id,
            'domain': 'thegridcompany.it'
        }
        existing_workspace = await db.get_many("workspaces", filters={"slug": "thegrid"})
        if not existing_workspace:
            created_workspace = await db.create("workspaces", default_workspace)
            workspace_id = created_workspace['id']
            logger.info("Created default workspace.")
        else:
            workspace_id = existing_workspace[0]['id']
            logger.info("Default workspace already exists.")

        # 3. Associate team members with default workspace
        team_members = await db.get_many("team_members", filters={"is_active": True})
        for member in team_members:
            existing_member = await db.get_many("workspace_members", filters={"workspace_id": workspace_id, "user_id": member['id']})
            if not existing_member:
                await db.create("workspace_members", {
                    'id': str(uuid4()),
                    'workspace_id': workspace_id,
                    'user_id': member['id'],
                    'role': 'ADMIN' if member['role'] in ['CTO', 'CEO'] else 'MEMBER'
                })
                logger.info(f"Added team member {member['name']} to default workspace.")

        # 4. Associate clients (as users) with default workspace
        clients = await db.get_many("clients", filters={"status": "active"})
        for client in clients:
            # This assumes client ID can be treated as a user ID.
            # A more robust solution might involve a separate 'users' table.
            existing_member = await db.get_many("workspace_members", filters={"workspace_id": workspace_id, "user_id": client['id']})
            if not existing_member:
                await db.create("workspace_members", {
                    'id': str(uuid4()),
                    'workspace_id': workspace_id,
                    'user_id': client['id'],
                    'role': 'MEMBER'
                })
                logger.info(f"Added client {client['name']} to default workspace as user.")
        
        logger.info("Workspace data migration completed successfully.")

    except Exception as e:
        logger.error(f"An error occurred during workspace migration: {str(e)}")


async def main():
    """Run all seed functions."""
    logger.info("Starting data seeding...")
    
    await seed_team_members()
    await seed_sample_clients()
    await migrate_to_workspace_system()
    
    logger.info("Data seeding completed!")


if __name__ == "__main__":
    asyncio.run(main()) 