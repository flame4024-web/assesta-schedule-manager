# -*- coding: utf-8 -*-
"""
Vercel Serverless Function Handler for Assesta Intranet Proxy
"""

from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import re
import requests
from bs4 import BeautifulSoup

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
            self._send_json(200, {"status": "ok", "platform": "vercel-serverless"})
            return

        if path.endswith("/calendar"):
            sidx = query.get("sIDX", ["669"])[0]
            year = query.get("year", ["2026"])[0]
            month = query.get("month", ["10"])[0].zfill(2)
            cookie = self.headers.get("X-Cookie", "")

            url = f"{INTRANET_BASE}/schedule/schedule.asp?sIDX={sidx}&wdate={year}-{month}-01"
            try:
                headers = {
                    "User-Agent": "Mozilla/5.0",
                    "Referer": f"{INTRANET_BASE}/schedule/schedule.asp"
                }
                if cookie:
                    headers["Cookie"] = cookie
                res = requests.get(url, headers=headers, timeout=10)
                res.encoding = "euc-kr"
                soup = BeautifulSoup(res.text, "html.parser")

                schedules = []
                for el in soup.find_all(attrs={"onclick": True}):
                    onclick = el.get("onclick", "")
                    m = re.search(r"View_Popup\((\d+)\s*,\s*(\d+)\)", onclick)
                    if m:
                        idx = m.group(1)
                        title = el.get_text(strip=True)
                        parent_td = el.find_parent("td")
                        date_val = None
                        if parent_td:
                            dm = re.search(r"\b(\d{1,2})\b", parent_td.get_text())
                            if dm:
                                date_val = f"{year}-{month}-{dm.group(1).zfill(2)}"
                        schedules.append({"idx": idx, "title": title, "date": date_val, "sIDX": sidx})

                self._send_json(200, {"success": True, "year": year, "month": month, "schedules": schedules})
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
                res = requests.get(csv_url, timeout=10)
                res.encoding = "utf-8"
                self._send_json(200, {"success": True, "csv_data": res.text})
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

        cookie = payload.get("cookie") or self.headers.get("X-Cookie", "")
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Referer": f"{INTRANET_BASE}/schedule/schedule.asp",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        if cookie:
            headers["Cookie"] = cookie

        if path.endswith("/register") or path.endswith("/update"):
            mode = "MOD" if path.endswith("/update") else "REG"
            sidx = str(payload.get("sIDX", "669"))
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
                "year": year,
                "month": month,
                "day": day,
                "subject": payload.get("subject", ""),
                "writer": payload.get("writer", "권민섭"),
                "ccAddr": payload.get("ccAddr", ""),
                "place": place_val,
                "sHour": s_time[0] if s_time else "9",
                "sMin": s_time[1] if len(s_time) > 1 else "0",
                "eHour": e_time[0] if e_time else "18",
                "eMin": e_time[1] if len(e_time) > 1 else "0",
                "content": payload.get("content", "")
            }
            if mode == "MOD" and "idx" in payload:
                form_data["idx"] = str(payload["idx"])

            try:
                encoded = urllib.parse.urlencode(form_data, encoding="euc-kr").encode("euc-kr")
                res = requests.post(f"{INTRANET_BASE}/schedule/schedule_proc.asp", data=encoded, headers=headers, timeout=10)
                res.encoding = "euc-kr"
                if "alert(" in res.text:
                    m = re.search(r"alert\(['\"](.*?)['\"]\)", res.text)
                    self._send_json(400, {"success": False, "message": m.group(1) if m else "실패"})
                else:
                    self._send_json(200, {"success": True, "message": "저장 완료", "data": form_data})
            except Exception as e:
                self._send_json(500, {"success": False, "error": str(e)})
            return

        if path.endswith("/delete"):
            idx = str(payload.get("idx", ""))
            sidx = str(payload.get("sIDX", "669"))
            try:
                encoded = urllib.parse.urlencode({"mode": "DEL", "idx": idx, "sIDX": sidx}, encoding="euc-kr").encode("euc-kr")
                res = requests.post(f"{INTRANET_BASE}/schedule/schedule_proc.asp", data=encoded, headers=headers, timeout=10)
                res.encoding = "euc-kr"
                if "alert(" in res.text:
                    m = re.search(r"alert\(['\"](.*?)['\"]\)", res.text)
                    self._send_json(400, {"success": False, "message": m.group(1) if m else "실패"})
                else:
                    self._send_json(200, {"success": True, "message": "삭제 완료"})
            except Exception as e:
                self._send_json(500, {"success": False, "error": str(e)})
            return

        self._send_json(404, {"error": "Not Found"})
