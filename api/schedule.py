# -*- coding: utf-8 -*-
"""
Vercel Serverless Function Handler for Assesta Intranet Proxy
(Zero-dependency fallback + Smart Cookie Auto-formatter)
"""

from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import urllib.request
import ssl
import re

try:
    import requests
except ImportError:
    requests = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

INTRANET_BASE = "https://it.assesta.com"

PLACE_MAP = {
    "내부미팅": "1",
    "외부미팅": "2",
    "업무": "3",
    "외부교육": "4",
    "근태": "8",
    "프로젝트": "9",
    "내부교육": "10",
    "기타": "11"
}


DEFAULT_AUTH_COOKIES = {
    "autologin": "1",
    "BP%5FIDX": "1",
    "deptIDX": "28",
    "IDX": "669",
    "Manager%5Fn": "N",
    "saveID": "mskwon",
    "userGrade": "5",
    "userID": "mskwon",
    "userIDX": "727",
    "userName": "%B1%C7%B9%CE%BC%87",
    "userPass": "1q2w3e4r1%21",
    "ASPSESSIONIDQSAABDBQ": "ELGDCCCDCNPMNFKJHLICMEMG"
}


def normalize_cookie(raw_cookie, sidx="669"):
    """사용자가 24자리 세션키만 넣든, 특정 쿠키만 넣든, 전체 쿠키를 넣든 완벽한 인증 쿠키로 자동 완성"""
    raw = (raw_cookie or "").strip().replace('"', '').replace("'", "")
    
    cookies = {}
    if "=" in raw:
        parts = [p.strip() for p in raw.split(";") if p.strip()]
        for p in parts:
            if "=" in p:
                k, v = p.split("=", 1)
                cookies[k.strip()] = v.strip()
    elif len(raw) == 24 and raw.isupper() and raw.isalnum():
        cookies["ASPSESSIONIDQSAABDBQ"] = raw
    elif raw:
        cookies["ASPSESSIONIDQSAABDBQ"] = raw

    # 기본 필수 인증 쿠키에 병합 (누락된 키 자동 보충)
    merged = dict(DEFAULT_AUTH_COOKIES)
    if sidx:
        merged["IDX"] = str(sidx)
    merged.update(cookies)
    
    return "; ".join([f"{k}={v}" for k, v in merged.items()])


def make_request(url, method="GET", data=None, headers=None):
    headers = headers or {}
    if requests is not None:
        if method == "POST":
            res = requests.post(url, data=data, headers=headers, timeout=10)
        else:
            res = requests.get(url, headers=headers, timeout=10)
        try:
            res.encoding = "euc-kr"
            text = res.text
        except Exception:
            text = res.content.decode("euc-kr", errors="replace")
        return res.status_code, text

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            content = resp.read()
            text = content.decode("euc-kr", errors="replace")
            return resp.status, text
    except urllib.error.HTTPError as e:
        content = e.read()
        text = content.decode("euc-kr", errors="replace")
        return e.code, text


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status_code, data):
        response_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Cookie, X-Sidx")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.end_headers()
        self.wfile.write(response_bytes)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Cookie, X-Sidx")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path.endswith("/status"):
            self._send_json(200, {
                "status": "ok",
                "platform": "vercel-serverless",
                "requests_installed": requests is not None
            })
            return

        if path.endswith("/calendar"):
            sidx = query.get("sIDX", ["669"])[0]
            year = query.get("year", ["2026"])[0]
            month = query.get("month", ["10"])[0].zfill(2)
            raw_cookie = self.headers.get("X-Cookie", "")
            cookie = normalize_cookie(raw_cookie, sidx)

            url = f"{INTRANET_BASE}/schedule/schedule.asp?sIDX={sidx}&wdate={year}-{month}-01"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
                "Referer": f"{INTRANET_BASE}/schedule/schedule.asp"
            }
            if cookie:
                headers["Cookie"] = cookie

            try:
                status, text = make_request(url, method="GET", headers=headers)
                schedules = []

                if BeautifulSoup is not None:
                    soup = BeautifulSoup(text, "html.parser")
                    for el in soup.find_all(attrs={"onclick": True}):
                        oc = el.get("onclick", "")
                        om = re.search(r"View_Popup\((\d+)\)", oc)
                        if om:
                            idx = om.group(1)
                            title = el.get_text(strip=True)
                            td = el.find_parent("td")
                            date_val = None
                            if td:
                                # 같은 TD 또는 주변에서 날짜 찾기
                                lines = [l.strip() for l in td.get_text().splitlines() if l.strip()]
                                for line in lines:
                                    if line.isdigit() and 1 <= int(line) <= 31:
                                        date_val = f"{year}-{month}-{line.zfill(2)}"
                                        break
                            schedules.append({
                                "idx": idx,
                                "title": title,
                                "date": date_val,
                                "sIDX": sidx
                            })
                else:
                    # 정규식 fallback
                    matches = re.finditer(r"View_Popup\((\d+)\)[^>]*>(.*?)<\/", text, re.IGNORECASE)
                    for m in matches:
                        idx = m.group(1)
                        title = re.sub(r"<[^>]+>", "", m.group(2)).strip()
                        schedules.append({
                            "idx": idx,
                            "title": title,
                            "date": None,
                            "sIDX": sidx
                        })

                self._send_json(200, {
                    "success": True,
                    "year": year,
                    "month": month,
                    "schedules": schedules,
                    "cookie_provided": bool(cookie)
                })
            except Exception as e:
                self._send_json(500, {"success": False, "error": str(e)})
            return

        if path.endswith("/fetch_sheet"):
            sheet_url = query.get("url", [""])[0]
            csv_url = sheet_url
            if "docs.google.com/spreadsheets" in sheet_url:
                m = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", sheet_url)
                if m:
                    csv_url = f"https://docs.google.com/spreadsheets/d/{m.group(1)}/gviz/tq?tqx=out:csv"
            try:
                status, text = make_request(csv_url, method="GET")
                self._send_json(200, {"success": True, "csv_data": text})
            except Exception as e:
                self._send_json(500, {"success": False, "error": str(e)})
            return

        self._send_json(404, {"error": "Not Found"})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception:
            payload = {}

        sidx = str(payload.get("sIDX", "669"))
        raw_cookie = payload.get("cookie") or self.headers.get("X-Cookie", "")
        cookie = normalize_cookie(raw_cookie, sidx)

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
            "Referer": f"{INTRANET_BASE}/schedule/schedule.asp",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        if cookie:
            headers["Cookie"] = cookie

        if path.endswith("/register") or path.endswith("/update"):
            mode = "MOD" if path.endswith("/update") else "REG"
            date_str = payload.get("date", "")
            parts = date_str.split("-")
            year = parts[0] if len(parts) == 3 else "2026"
            month = parts[1] if len(parts) == 3 else "10"
            day = parts[2] if len(parts) == 3 else "1"

            s_time = payload.get("startTime", "09:00").split(":")
            e_time = payload.get("endTime", "18:00").split(":")
            place_val = str(payload.get("place", "9"))
            if place_val in PLACE_MAP:
                place_val = PLACE_MAP[place_val]

            form_data = {
                "mode": mode,
                "sIDX": sidx,
                "year": str(int(year)),
                "month": str(int(month)),
                "day": str(int(day)),
                "subject": payload.get("subject", ""),
                "writer": payload.get("writer", "권민섭"),
                "ccAddr": payload.get("ccAddr", ""),
                "place": place_val,
                "sHour": str(int(s_time[0])) if s_time else "9",
                "sMin": str(int(s_time[1])) if len(s_time) > 1 else "0",
                "eHour": str(int(e_time[0])) if e_time else "18",
                "eMin": str(int(e_time[1])) if len(e_time) > 1 else "0",
                "content": payload.get("content", "")
            }
            if mode == "MOD" and "idx" in payload:
                form_data["idx"] = str(payload["idx"])

            try:
                encoded = urllib.parse.urlencode(form_data, encoding="euc-kr").encode("euc-kr")
                status, text = make_request(f"{INTRANET_BASE}/schedule/schedule_proc.asp", method="POST", data=encoded, headers=headers)
                if "alert(" in text:
                    m = re.search(r"alert\(['\"](.*?)['\"]\)", text)
                    alert_msg = m.group(1) if m else "실패"
                    self._send_json(400, {"success": False, "message": alert_msg, "raw": text[:200]})
                else:
                    self._send_json(200, {"success": True, "message": "저장 완료", "data": form_data})
            except Exception as e:
                self._send_json(500, {"success": False, "error": str(e)})
            return

        if path.endswith("/delete"):
            idx = str(payload.get("idx", ""))
            try:
                encoded = urllib.parse.urlencode({"mode": "DEL", "idx": idx, "sIDX": sidx}, encoding="euc-kr").encode("euc-kr")
                status, text = make_request(f"{INTRANET_BASE}/schedule/schedule_proc.asp", method="POST", data=encoded, headers=headers)
                if "alert(" in text:
                    m = re.search(r"alert\(['\"](.*?)['\"]\)", text)
                    self._send_json(400, {"success": False, "message": m.group(1) if m else "실패"})
                else:
                    self._send_json(200, {"success": True, "message": "삭제 완료"})
            except Exception as e:
                self._send_json(500, {"success": False, "error": str(e)})
            return

        self._send_json(404, {"error": "Not Found"})
