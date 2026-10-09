"""Quick reproduction script — run while uvicorn is running on port 5000."""
import http.client
import struct
import zlib
import json


def make_minimal_png():
    """1×1 white RGB PNG."""
    def chunk(ctype, data):
        c = struct.pack('>I', len(data)) + ctype + data
        return c + struct.pack('>I', zlib.crc32(ctype + data) & 0xFFFFFFFF)

    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0))
    raw = b'\x00\xff\xff\xff'          # filter=0, then R G B
    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    return b'\x89PNG\r\n\x1a\n' + ihdr + idat + iend


def upload(filename, data, content_type='image/png'):
    boundary = 'RepBoundary99'
    body = (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f'Content-Type: {content_type}\r\n'
        f'\r\n'
    ).encode() + data + f'\r\n--{boundary}--\r\n'.encode()

    conn = http.client.HTTPConnection('localhost', 5000)
    conn.request(
        'POST', '/api/documents/upload',
        body=body,
        headers={
            'Content-Type': f'multipart/form-data; boundary={boundary}',
            'Content-Length': str(len(body)),
        }
    )
    resp = conn.getresponse()
    body_bytes = resp.read(4096)
    return resp.status, body_bytes.decode('utf-8', errors='replace')


if __name__ == '__main__':
    png = make_minimal_png()
    status, text = upload('test_invoice.png', png, 'image/png')
    print(f'HTTP {status}')
    try:
        parsed = json.loads(text)
        print('JSON:', json.dumps(parsed, indent=2)[:2000])
    except Exception:
        print('Raw:', text[:2000])
