import os
import pytest
from app.services.product_matcher import ProductMatcherService


@pytest.fixture
def matcher(tmp_path):
    catalog_content = (
        "product_code,product_name,category,unit_price\n"
        "PROD-001,Consulting & Technical Services,Services,1000.00\n"
        "PROD-002,Dell XPS 15 Laptop 16GB RAM 512GB SSD,Electronics,1850.00\n"
        "PROD-003,Logitech MX Master 3S Wireless Mouse,Peripherals,99.99\n"
        "PROD-004,Apple MacBook Pro 16-inch M3 Max,Electronics,3499.00\n"
        "PROD-005,Samsung 32-inch 4K UHD Monitor,Monitors,450.00\n"
        "PROD-006,HP LaserJet Pro Wireless Printer,Office Equipment,299.99\n"
        "PROD-007,Ergonomic Mesh Office Chair,Furniture,249.50\n"
        "PROD-008,USB-C Multi-port Adapter Hub,Accessories,45.00\n"
    )
    catalog_file = tmp_path / "catalog.csv"
    catalog_file.write_text(catalog_content, encoding="utf-8")
    return ProductMatcherService(catalog_path=str(catalog_file))


def test_exact_name_match(matcher):
    res = matcher.match_item("Consulting & Technical Services")
    assert res.status == "matched"
    assert res.matched_product_code == "PROD-001"
    assert res.matched_product_name == "Consulting & Technical Services"
    assert res.similarity_score == 100.0


def test_minor_typo_and_casing_variation(matcher):
    # Variation with lowercase and minor abbreviation/typo
    res = matcher.match_item("logitech mx master 3s wireless mouse")
    assert res.status == "matched"
    assert res.matched_product_code == "PROD-003"
    assert res.similarity_score >= 80.0


def test_reordered_words_and_truncated(matcher):
    # Order variation and abbreviation
    res = matcher.match_item("Dell Laptop XPS 15 16GB RAM")
    assert res.status == "matched"
    assert res.matched_product_code == "PROD-002"
    assert res.similarity_score >= 80.0


def test_partial_uncertain_match(matcher):
    # Partial query that is somewhat ambiguous or medium similarity
    res = matcher.match_item("Apple MacBook 16")
    assert res.status in ["matched", "uncertain"]
    assert res.matched_product_code == "PROD-004"
    assert 50.0 <= res.similarity_score < 100.0


def test_unmatched_completely_different_item(matcher):
    # Unrelated product not in catalog
    res = matcher.match_item("Industrial Hydraulic Oil Filter Element")
    assert res.status == "unmatched"
    assert res.matched_product_code is None
    assert res.similarity_score < 50.0


def test_empty_and_whitespace_input(matcher):
    res = matcher.match_item("   ")
    assert res.status == "unmatched"
    assert res.matched_product_code is None
    assert res.similarity_score == 0.0


def test_batch_matching(matcher):
    items = [
        "Samsung 32 4K Monitor",
        "HP LaserJet Printer Pro",
        "Nonexistent Widget XYZ"
    ]
    results = matcher.match_items(items)
    assert len(results) == 3
    assert results[0].status == "matched"
    assert results[0].matched_product_code == "PROD-005"
    assert results[1].status == "matched"
    assert results[1].matched_product_code == "PROD-006"
    assert results[2].status == "unmatched"
