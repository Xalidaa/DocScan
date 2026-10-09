import os
import csv
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel
from rapidfuzz import process, fuzz


class CatalogProduct(BaseModel):
    product_code: str
    product_name: str
    category: Optional[str] = None
    unit_price: Optional[float] = None


class MatchResult(BaseModel):
    original_name: str
    matched_product_code: Optional[str] = None
    matched_product_name: Optional[str] = None
    similarity_score: float = 0.0
    status: str = "unmatched"  # "matched", "uncertain", "unmatched"


class ProductMatcherService:
    MATCHED_THRESHOLD: float = 80.0
    UNCERTAIN_THRESHOLD: float = 50.0

    def __init__(self, catalog_path: Optional[str] = None):
        if not catalog_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            catalog_path = os.path.join(base_dir, "data", "catalog.csv")
        self.catalog_path = catalog_path
        self.products: List[CatalogProduct] = []
        self._load_catalog()

    def _load_catalog(self) -> None:
        """Loads the product catalog from CSV."""
        if not os.path.exists(self.catalog_path):
            self.products = []
            return

        products = []
        with open(self.catalog_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    price = float(row["unit_price"]) if row.get("unit_price") else None
                except (ValueError, TypeError):
                    price = None

                products.append(
                    CatalogProduct(
                        product_code=row.get("product_code", ""),
                        product_name=row.get("product_name", ""),
                        category=row.get("category"),
                        unit_price=price,
                    )
                )
        self.products = products

    def match_item(self, item_name: str) -> MatchResult:
        """
        Matches an extracted line-item name against catalog products using RapidFuzz.
        Returns match details, similarity score, and match status ('matched', 'uncertain', 'unmatched').
        """
        if not item_name or not item_name.strip() or not self.products:
            return MatchResult(
                original_name=item_name or "",
                matched_product_code=None,
                matched_product_name=None,
                similarity_score=0.0,
                status="unmatched",
            )

        clean_name = item_name.strip()
        catalog_names = [p.product_name for p in self.products]

        # RapidFuzz WRatio offers strong fuzz matching for name variations, order, and abbreviations
        match_tuple = process.extractOne(
            clean_name,
            catalog_names,
            scorer=fuzz.WRatio
        )

        if not match_tuple:
            return MatchResult(
                original_name=clean_name,
                matched_product_code=None,
                matched_product_name=None,
                similarity_score=0.0,
                status="unmatched",
            )

        best_name, score, index = match_tuple
        score = round(float(score), 2)
        matched_product = self.products[index]

        if score >= self.MATCHED_THRESHOLD:
            status = "matched"
        elif score >= self.UNCERTAIN_THRESHOLD:
            status = "uncertain"
        else:
            status = "unmatched"

        if status == "unmatched":
            return MatchResult(
                original_name=clean_name,
                matched_product_code=None,
                matched_product_name=None,
                similarity_score=score,
                status="unmatched",
            )

        return MatchResult(
            original_name=clean_name,
            matched_product_code=matched_product.product_code,
            matched_product_name=matched_product.product_name,
            similarity_score=score,
            status=status,
        )

    def match_items(self, item_names: List[str]) -> List[MatchResult]:
        """Matches a batch of extracted line-item names."""
        return [self.match_item(name) for name in item_names]
