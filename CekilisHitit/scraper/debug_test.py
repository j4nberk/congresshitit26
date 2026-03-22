#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

with open('/tmp/scraper_debug.log', 'w') as f:
    f.write("Script started\n")
    
    try:
        f.write("Testing imports...\n")
        import httpx
        f.write(f"httpx: OK ({httpx.__version__})\n")
    except Exception as e:
        f.write(f"httpx ERROR: {e}\n")
    
    try:
        import requests
        f.write(f"requests: OK ({requests.__version__})\n")
    except Exception as e:
        f.write(f"requests ERROR: {e}\n")
    
    try:
        from login import login_instagram, read_cookie_json, write_cookie_json, cookie_json_valid, LoginError
        f.write("login.py: OK\n")
    except Exception as e:
        f.write(f"login.py ERROR: {e}\n")
    
    try:
        import main
        f.write("main.py: OK\n")
    except Exception as e:
        f.write(f"main.py ERROR: {e}\n")
    
    f.write("All done\n")
    f.flush()
