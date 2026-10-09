from app.core.config import settings
from .base import ERPAdapter
from .odoo import OdooAdapter
from .mock import MockERPAdapter

def get_erp_adapter() -> ERPAdapter:
    """
    Factory function to get the appropriate ERP adapter based on configuration.
    """
    if settings.ERP_MOCK_MODE:
        return MockERPAdapter()
    return OdooAdapter()
