from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
from app.models.document import InvoiceData

class ERPAdapter(ABC):
    @abstractmethod
    def export_invoice(self, invoice: InvoiceData) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Exports an invoice to the ERP system.
        
        Args:
            invoice: The InvoiceData database model containing validated data.
            
        Returns:
            Tuple containing:
            - bool: Success status
            - str: Message or error description
            - Dict: Additional metadata (e.g., ERP document ID)
        """
        pass
