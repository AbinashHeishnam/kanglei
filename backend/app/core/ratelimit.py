import time
from collections import defaultdict, deque
from fastapi import Request, HTTPException

# In-memory sliding window: {ip: deque[timestamps]}
_BUCKETS = defaultdict(deque)

def get_client_ip(request: Request) -> str:
    # If later behind nginx, you can trust X-Forwarded-For (only if nginx sets it)
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def rate_limit(max_requests: int = 5, window_seconds: int = 600):
    def _dep(request: Request):
        ip = get_client_ip(request)
        now = time.time()
        q = _BUCKETS[ip]

        # drop old timestamps
        cutoff = now - window_seconds
        while q and q[0] < cutoff:
            q.popleft()

        if len(q) >= max_requests:
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Try again later."
            )

        q.append(now)
        return True

    return _dep
