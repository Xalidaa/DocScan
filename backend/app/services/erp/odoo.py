import xmlrpc.client
import logging
from typing import Dict, Any, Tuple
from app.models.document import InvoiceData
from app.core.config import settings
from .base import ERPAdapter

logger = logging.getLogger(__name__)

class OdooAdapter(ERPAdapter):
    def __init__(self):
        self.url = settings.ODOO_URL
        self.db = settings.ODOO_DB
        self.username = settings.ODOO_USER
        self.password = settings.ODOO_PASSWORD
        self.common = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/common')
        self.models = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/object')
        self.uid = None

    def _authenticate(self) -> bool:
        if self.uid is not None:
            return True
        try:
            self.uid = self.common.authenticate(self.db, self.username, self.password, {})
            return bool(self.uid)
        except Exception as e:
            logger.error(f"Odoo authentication failed: {e}")
            return False

    def export_invoice(self, invoice: InvoiceData) -> Tuple[bool, str, Dict[str, Any]]:
        if not self._authenticate():
            return False, "Failed to authenticate with Odoo.", {}

        try:
            # 1. Map supplier to a partner (or create if missing, but we'll try to find first)
            # In a real scenario, you'd match by TIN/VOEN or exact name
            partner_id = self._get_or_create_partner(invoice.supplier_name, invoice.tin_voen)

            # 2. Build invoice lines
            invoice_lines = []
            for item in invoice.line_items:
                product_id = self._get_product(item.matched_product_code, item.original_name)
                line_val = {
                    'product_id': product_id,
                    'name': item.original_name or 'Unknown Item',
                    'quantity': item.quantity or 1.0,
                    'price_unit': item.unit_price or 0.0,
                }
                invoice_lines.append((0, 0, line_val))

            # 3. Create the invoice (account.move)
            invoice_vals = {
                'move_type': 'in_invoice',
                'partner_id': partner_id,
                'invoice_date': invoice.date,
                'ref': invoice.invoice_number,
                'invoice_line_ids': invoice_lines,
            }
            
            invoice_id = self.models.execute_kw(
                self.db, self.uid, self.password,
                'account.move', 'create', [invoice_vals]
            )

            return True, "Successfully exported to Odoo", {"erp_id": invoice_id}
            
        except Exception as e:
            logger.error(f"Odoo export failed: {e}")
            return False, f"Odoo export error: {str(e)}", {}

    def _get_or_create_partner(self, name: str, tin: str) -> int:
        if not name:
            name = "Unknown Vendor"
        
        domain = []
        if tin:
            domain.append(('vat', '=', tin))
        else:
            domain.append(('name', 'ilike', name))
            
        partner_ids = self.models.execute_kw(self.db, self.uid, self.password, 'res.partner', 'search', [domain], {'limit': 1})
        if partner_ids:
            return partner_ids[0]
            
        # Create
        return self.models.execute_kw(self.db, self.uid, self.password, 'res.partner', 'create', [{
            'name': name,
            'vat': tin,
            'supplier_rank': 1,
            'is_company': True
        }])
        
    def _get_product(self, code: str, name: str) -> int:
        # Standard Odoo implementation returns False if no product matches, requiring product_id to be False
        # But we will try to find it by code first.
        if code:
            prod_ids = self.models.execute_kw(self.db, self.uid, self.password, 'product.product', 'search', [[('default_code', '=', code)]], {'limit': 1})
            if prod_ids:
                return prod_ids[0]
                
        # We can either return False to just use 'name' on the line without a product,
        # or we could create a new product. Let's return False for loosely coupled items.
        return False
