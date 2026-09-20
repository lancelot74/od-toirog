"""Static test host with capacity for concurrent Next.js asset/prefetch requests."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class TestServer(ThreadingHTTPServer):
    request_queue_size = 128


if __name__ == '__main__':
    TestServer(('127.0.0.1', 4173), partial(SimpleHTTPRequestHandler, directory='out')).serve_forever()
