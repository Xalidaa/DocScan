import json
import pytest

def extract_json_from_text(text: str) -> dict:
    # Try finding markdown fences first
    import re
    match = re.search(r'```(?:json)?\s*(.*?)\s*```', text, re.DOTALL | re.IGNORECASE)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Try raw_decode from the first '{'
    decoder = json.JSONDecoder()
    idx = 0
    while idx < len(text):
        idx = text.find('{', idx)
        if idx == -1:
            break
        try:
            result, _ = decoder.raw_decode(text[idx:])
            if isinstance(result, dict):
                return result
        except json.JSONDecodeError:
            pass
        idx += 1
        
    raise ValueError("Could not parse valid JSON from the response.")


def test_plain_json():
    text = '{"supplier": "Vendor", "total": 100.0}'
    assert extract_json_from_text(text) == {"supplier": "Vendor", "total": 100.0}

def test_fenced_json():
    text = '```json\n{"supplier": "Vendor", "total": 100.0}\n```'
    assert extract_json_from_text(text) == {"supplier": "Vendor", "total": 100.0}
    
def test_preamble_plus_json():
    text = 'Here is the extracted data:\n{"supplier": "Vendor", "total": 100.0}\nHave a nice day!'
    assert extract_json_from_text(text) == {"supplier": "Vendor", "total": 100.0}

def test_malformed_json():
    text = 'Here is data: {"supplier": "Vendor", "total": }'
    with pytest.raises(ValueError, match="Could not parse valid JSON"):
        extract_json_from_text(text)

def test_json_with_braces_in_string():
    text = 'Here it is:\n{"supplier": "Vendor {Inc}", "total": 100.0}'
    assert extract_json_from_text(text) == {"supplier": "Vendor {Inc}", "total": 100.0}

def test_json_with_trailing_brace():
    text = '{"supplier": "Vendor"} }'
    assert extract_json_from_text(text) == {"supplier": "Vendor"}
