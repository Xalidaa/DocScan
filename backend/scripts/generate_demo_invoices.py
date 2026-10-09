import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

def create_invoice_pdf(data, filename):
    doc = SimpleDocTemplate(filename, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    # Header
    elements.append(Paragraph(f"<b>INVOICE</b>", styles['Title']))
    elements.append(Paragraph(f"<b>Invoice Number:</b> {data['invoice_number']}", styles['Normal']))
    elements.append(Paragraph(f"<b>Date:</b> {data['date']}", styles['Normal']))
    elements.append(Spacer(1, 20))

    # Vendor Info
    elements.append(Paragraph(f"<b>From:</b>", styles['Normal']))
    elements.append(Paragraph(f"{data['supplier']}", styles['Normal']))
    elements.append(Paragraph(f"VOEN: {data['voen']}", styles['Normal']))
    elements.append(Spacer(1, 20))

    # Table
    table_data = [["Item Description", "Quantity", "Unit Price", "Line Total"]]
    for item in data['items']:
        table_data.append([
            item['name'],
            f"{item['qty']:.2f}",
            f"${item['price']:.2f}",
            f"${item['total']:.2f}"
        ])

    t = Table(table_data, colWidths=[250, 70, 100, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.black),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('BACKGROUND', (0,1), (-1,-1), colors.white),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))

    # Totals
    totals_data = [
        ["Subtotal:", f"${data['subtotal']:.2f}"],
        ["VAT (18%):", f"${data['vat']:.2f}"],
        ["Total:", f"${data['total']:.2f}"]
    ]
    t_totals = Table(totals_data, colWidths=[350, 170])
    t_totals.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
    ]))
    elements.append(t_totals)

    doc.build(elements)

out_dir = os.path.join(os.path.dirname(__file__), "..", "data", "demo_invoices")
os.makedirs(out_dir, exist_ok=True)

# 1. Perfect Invoice
create_invoice_pdf({
    "invoice_number": "INV-2023-1001",
    "date": "2023-10-01",
    "supplier": "Tech Supplies Inc.",
    "voen": "123456789",
    "items": [
        {"name": "Consulting & Technical Services", "qty": 10, "price": 1000.00, "total": 10000.00},
        {"name": "Samsung 32-inch 4K UHD Monitor", "qty": 2, "price": 450.00, "total": 900.00}
    ],
    "subtotal": 10900.00,
    "vat": 1962.00,
    "total": 12862.00
}, os.path.join(out_dir, "01_perfect_invoice.pdf"))

# 2. Math error invoice
create_invoice_pdf({
    "invoice_number": "INV-2023-1002",
    "date": "2023-10-05",
    "supplier": "Office Essentials LLC",
    "voen": "9876543210",
    "items": [
        {"name": "Ergonomic Mesh Office Chair", "qty": 5, "price": 249.50, "total": 1247.50},
        {"name": "USB-C Multi-port Adapter Hub", "qty": 2, "price": 45.00, "total": 100.00}
    ],
    "subtotal": 1347.50,
    "vat": 242.55,
    "total": 2000.00
}, os.path.join(out_dir, "02_math_error_invoice.pdf"))

# 3. Product naming variation invoice
create_invoice_pdf({
    "invoice_number": "INV-2023-1003",
    "date": "2023-10-08",
    "supplier": "Global Tech Distributors",
    "voen": "1029384756",
    "items": [
        {"name": "Dell Laptop XPS 15 16GB RAM", "qty": 1, "price": 1850.00, "total": 1850.00},
        {"name": "logitech mx master 3s wireless mouse", "qty": 5, "price": 99.99, "total": 499.95}
    ],
    "subtotal": 2349.95,
    "vat": 422.99,
    "total": 2772.94
}, os.path.join(out_dir, "03_naming_variation_invoice.pdf"))

print(f"Generated 3 PDFs in {out_dir}")
