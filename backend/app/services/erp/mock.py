import logging
import uuid
import time
from typing import Dict, Any, Tuple
from app.models.document import InvoiceData
from .base import ERPAdapter

logger = logging.getLogger(__name__)

class MockERPAdapter(ERPAdapter):
    def export_invoice(self, invoice: InvoiceData) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Mocks the export of an invoice to an ERP system.
        """
        logger.info(f"Mock exporting invoice {invoice.invoice_number} from {invoice.supplier_name}")
        
        # Simulate network latency
        time.sleep(1)
        
        # Simulate a successful export with a mock ID
        mock_id = f"MOCK-INV-{str(uuid.uuid4())[:8].upper()}"
        
        return True, "Successfully exported to Mock ERP", {"erp_id": mock_id, "mock": True}
