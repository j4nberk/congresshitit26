# -*- coding: utf-8 -*-
# Adapted from kaifcodec/InstaScrape (MIT License)
# Modified for Electron subprocess usage: non-interactive, JSON I/O via stdout

import asyncio
import httpx
import json
import os
import re
import sys
import time
import argparse
from math import ceil
from typing import Any, Dict, List, Optional, Tuple

from login import (
    login_instagram,
    read_cookie_json,
    write_cookie_json,
    cookie_json_valid,
    LoginError,
)

PARENT_QUERY_HASH = "97b41c52301f77ce508f55e66d17620e"
COMMENTS_PER_PAGE = 50


class ScrapeError(Exception):
    pass


def emit(event: str, data: Any = None):
    """Send a JSON event to stdout for Electron to consume."""
    msg = json.dumps({"event": event, "data": data}, ensure_ascii=False)
    print(msg, flush=True)


def extract_shortcode(url: str) -> Optional[str]:
    m = re.search(r"instagram\.com/(?:reel|p)/([^/?#]+)/?", url)
    return m.group(1) if m else None


def cookies_string(sessionid: str, csrftoken: str, mid: str, dsuserid: str) -> str:
    return f"sessionid={sessionid}; ds_user_id={dsuserid}; csrftoken={csrftoken}; mid={mid}"


def build_headers(shortcode: str, cookies_str: str) -> Dict[str, str]:
    return {
        "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-A125F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "X-Requested-With": "XMLHttpRequest",
        "X-IG-App-ID": "936619743392459",
        "Referer": f"https://www.instagram.com/reel/{shortcode}/",
        "Cookie": cookies_str,
    }


async def graphql_request(client: httpx.AsyncClient, query_hash: str, variables: Dict[str, Any]) -> Dict[str, Any]:
    var_str = json.dumps(variables, separators=(",", ":"))
    url = "https://www.instagram.com/graphql/query/"
    params = {"query_hash": query_hash, "variables": var_str}
    r = await client.get(url, params=params, follow_redirects=False, timeout=20)
    if r.status_code in (301, 302, 303, 307, 308):
        raise ScrapeError("Redirected (possible auth required).")
    if r.status_code == 401:
        raise ScrapeError("Unauthorized (401).")
    if r.status_code == 429:
        raise ScrapeError("Rate limited (429). Reduce RPS and try again.")
    if r.status_code != 200:
        text = r.text[:200] if r.text else f"HTTP {r.status_code}"
        raise ScrapeError(f"HTTP {r.status_code}: {text}")
    try:
        return r.json()
    except Exception:
        raise ScrapeError("Failed to parse JSON from GraphQL response.")


def parse_parent_comments(data: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    try:
        media = data["data"]["shortcode_media"]
        edge_info = media["edge_media_to_parent_comment"]
        edges = edge_info["edges"]
        page_info = edge_info["page_info"]
    except KeyError:
        raise ScrapeError("Unexpected GraphQL shape; missing comment edges.")
    
    comments = []
    for edge in edges:
        node = edge.get("node", {})
        text = node.get("text", "")
        username = node.get("owner", {}).get("username", "")
        created_at = node.get("created_at")
        if username:
            comments.append({"username": username, "text": text, "created_at": created_at})
    
    return comments, page_info


def get_counts_from_first_page(data: dict) -> int:
    try:
        media = data["data"]["shortcode_media"]
        count = media["edge_media_to_parent_comment"].get("count")
        if isinstance(count, int) and count >= 0:
            return count
    except Exception:
        pass
    return 0


def headers_from_store(shortcode: str, fallback: Tuple[str, str, str, str]) -> Dict[str, str]:
    dj = read_cookie_json()
    if cookie_json_valid(dj):
        c = dj["cookies"]
        ck = cookies_string(c["sessionid"], c["csrftoken"], c["mid"], c["ds_user_id"])
    else:
        ck = cookies_string(*fallback)
    return build_headers(shortcode, ck)


class RateLimiter:
    def __init__(self, rps: float):
        self.rps = max(0.1, float(rps))
        self.interval = 1.0 / self.rps
        self._last = 0.0
        self._lock = asyncio.Lock()

    async def wait(self):
        async with self._lock:
            now = time.perf_counter()
            delta = now - self._last
            if delta < self.interval:
                await asyncio.sleep(self.interval - delta)
            self._last = time.perf_counter()


async def fetch_all_comments(shortcode: str, session_tuple: Tuple[str, str, str, str], rps: float) -> List[Dict[str, Any]]:
    limits = httpx.Limits(max_keepalive_connections=10, max_connections=20)
    async with httpx.AsyncClient(http2=True, timeout=httpx.Timeout(20.0, connect=10.0), limits=limits) as client:
        headers = headers_from_store(shortcode, session_tuple)
        client.headers.update(headers)

        # First page
        variables = {"shortcode": shortcode, "first": COMMENTS_PER_PAGE}
        data = await graphql_request(client, PARENT_QUERY_HASH, variables)
        
        comments, page_info = parse_parent_comments(data)
        total_count = get_counts_from_first_page(data) or len(comments)
        
        all_comments = list(comments)
        has_next = page_info.get("has_next_page", False)
        cursor = page_info.get("end_cursor")
        
        emit("progress", {"fetched": len(all_comments), "total": total_count, "page": 1})
        
        limiter = RateLimiter(rps)
        page_num = 1

        while has_next and cursor:
            page_num += 1
            await limiter.wait()
            
            # Refresh headers from cookie store
            dj = read_cookie_json()
            hdrs = headers_from_store(shortcode, session_tuple) if cookie_json_valid(dj) else headers
            client.headers.update(hdrs)
            
            vars2 = {"shortcode": shortcode, "first": COMMENTS_PER_PAGE, "after": cursor}
            
            tries = 0
            while True:
                tries += 1
                try:
                    d2 = await graphql_request(client, PARENT_QUERY_HASH, vars2)
                    new_comments, pinfo2 = parse_parent_comments(d2)
                    all_comments.extend(new_comments)
                    has_next = pinfo2.get("has_next_page", False)
                    cursor = pinfo2.get("end_cursor")
                    break
                except ScrapeError as e:
                    if tries >= 3:
                        emit("warning", f"Page {page_num} failed after 3 retries: {e}")
                        has_next = False
                        break
                    await asyncio.sleep(1.0)
            
            emit("progress", {"fetched": len(all_comments), "total": total_count, "page": page_num})
        
        return all_comments


async def amain(url: str, username: str, password: str, rps: float):
    shortcode = extract_shortcode(url)
    if not shortcode:
        emit("error", "Geçersiz URL formatı. /p/ veya /reel/ bekleniyor.")
        sys.exit(1)
    
    emit("status", f"Shortcode: {shortcode}")
    
    # Try to use existing cookies first, login if needed
    dj = read_cookie_json()
    if cookie_json_valid(dj):
        c = dj["cookies"]
        session_tuple = (c["sessionid"], c["csrftoken"], c["mid"], c["ds_user_id"])
        emit("status", "Mevcut cookie'ler kullanılıyor...")
    else:
        emit("status", "Giriş yapılıyor...")
        try:
            sessionid, csrftoken, mid, dsuserid = login_instagram(username, password)
            write_cookie_json(sessionid, csrftoken, mid, dsuserid)
            session_tuple = (sessionid, csrftoken, mid, dsuserid)
            emit("status", "Giriş başarılı, cookie'ler kaydedildi.")
        except LoginError as e:
            emit("error", f"Giriş hatası: {e}")
            sys.exit(1)
    
    # Fetch comments
    emit("status", "Yorumlar çekiliyor...")
    try:
        comments = await fetch_all_comments(shortcode, session_tuple, rps)
    except ScrapeError as e:
        # Maybe cookies expired mid-run, try re-login
        emit("status", "Cookie'ler geçersiz, tekrar giriş yapılıyor...")
        try:
            sessionid, csrftoken, mid, dsuserid = login_instagram(username, password)
            write_cookie_json(sessionid, csrftoken, mid, dsuserid)
            session_tuple = (sessionid, csrftoken, mid, dsuserid)
            comments = await fetch_all_comments(shortcode, session_tuple, rps)
        except (LoginError, ScrapeError) as e2:
            emit("error", f"Scrape hatası: {e2}")
            sys.exit(1)
    
    # Output final results
    emit("result", {
        "count": len(comments),
        "comments": comments,
    })


def main():
    parser = argparse.ArgumentParser(description="InstaScrape - Electron subprocess mode")
    parser.add_argument("--url", required=True, help="Instagram post/reel URL")
    parser.add_argument("--username", required=True, help="Instagram username (dummy account)")
    parser.add_argument("--password", required=True, help="Instagram password")
    parser.add_argument("--rps", type=float, default=5.0, help="Requests per second (default: 5)")
    args = parser.parse_args()
    
    try:
        asyncio.run(amain(args.url, args.username, args.password, args.rps))
    except KeyboardInterrupt:
        emit("error", "İptal edildi.")
        sys.exit(1)
    except Exception as e:
        emit("error", f"Beklenmeyen hata: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
