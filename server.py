# -*- coding: utf-8 -*-
"""
어세스타 인트라넷 캘린더 관리 웹 애플리케이션 로컬 백엔드 서버
"""

import http.server
import json
import os
import re
import socketserver
import urllib.parse
import urllib.request
import requests
from bs4 import BeautifulSoup

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INTRANET_BASE = "https://it.assesta.com"

PLACE_NAMES = {
    "1": "내부미팅",
    "2": "외부미팅",
    "3": "업무",
    "4": "외부교육",
    "8": "근태",
    "9": "프로젝트",
    "10": "내부교육",
    "11": "기타"
}

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

    merged = dict(DEFAULT_AUTH_COOKIES)
    if sidx:
        merged["IDX"] = str(sidx)
    merged.update(cookies)
    return "; ".join([f"{k}={v}" for k, v in merged.items()])


class ScheduleHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

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

        if path == "/api/status":
            self._send_json(200, {"status": "ok", "intranet": INTRANET_BASE})
            return

        if path == "/api/calendar":
            self.handle_get_calendar(query)
            return

        if path == "/api/detail":
            self.handle_get_detail(query)
            return

        if path == "/api/address_book":
            self.handle_get_address_book(query)
            return

        if path == "/api/fetch_sheet":
            self.handle_fetch_sheet(query)
            return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception:
            payload = {}

        if path == "/api/register":
            self.handle_register(payload, mode="REG")
            return

        if path == "/api/update":
            self.handle_register(payload, mode="MOD")
            return

        if path == "/api/delete":
            self.handle_delete(payload)
            return

        self._send_json(404, {"error": "Endpoint not found"})

    # --- API 로직 ---

    def _get_headers(self, custom_cookie=None, sidx="669"):
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
            "Referer": f"{INTRANET_BASE}/schedule/schedule.asp"
        }
        cookie = custom_cookie or self.headers.get("X-Cookie", "")
        headers["Cookie"] = normalize_cookie(cookie, sidx)
        return headers


    def handle_get_calendar(self, query):
        sidx = query.get("sIDX", ["669"])[0]
        year = query.get("year", ["2026"])[0]
        month = query.get("month", ["10"])[0].zfill(2)
        cookie = self.headers.get("X-Cookie", "")

        url = f"{INTRANET_BASE}/schedule/schedule.asp?sIDX={sidx}&wdate={year}-{month}-01"
        try:
            res = requests.get(url, headers=self._get_headers(cookie), timeout=10)
            res.encoding = "euc-kr"
            soup = BeautifulSoup(res.text, "html.parser")

            schedules = []
            # View_Popup(idx, sIDX) 형식 onclick 요소 탐색
            for el in soup.find_all(attrs={"onclick": True}):
                onclick = el.get("onclick", "")
                m = re.search(r"View_Popup\((\d+)\s*,\s*(\d+)\)", onclick)
                if m:
                    idx = m.group(1)
                    title = el.get_text(strip=True)
                    parent_td = el.find_parent("td")
                    date_val = None
                    if parent_td:
                        date_text = parent_td.get_text()
                        dm = re.search(r"\b(\d{1,2})\b", date_text)
                        if dm:
                            date_val = f"{year}-{month}-{dm.group(1).zfill(2)}"

                    schedules.append({
                        "idx": idx,
                        "title": title,
                        "date": date_val,
                        "sIDX": sidx
                    })

            self._send_json(200, {
                "success": True,
                "year": year,
                "month": month,
                "schedules": schedules,
                "raw_html_len": len(res.text)
            })
        except Exception as e:
            self._send_json(500, {"success": False, "error": str(e)})

    def handle_get_detail(self, query):
        idx = query.get("idx", [""])[0]
        sidx = query.get("sIDX", ["669"])[0]
        cookie = self.headers.get("X-Cookie", "")

        if not idx:
            self._send_json(400, {"error": "idx is required"})
            return

        url = f"{INTRANET_BASE}/schedule/schedule_view.asp?idx={idx}&sIDX={sidx}"
        try:
            res = requests.get(url, headers=self._get_headers(cookie), timeout=10)
            res.encoding = "euc-kr"
            soup = BeautifulSoup(res.text, "html.parser")

            text = soup.get_text()
            title = ""
            h_tags = soup.find_all(["h1", "h2", "h3", "b", "strong"])
            if h_tags:
                title = h_tags[0].get_text(strip=True)

            self._send_json(200, {
                "success": True,
                "idx": idx,
                "raw_text": text[:1000]
            })
        except Exception as e:
            self._send_json(500, {"success": False, "error": str(e)})

    def handle_get_address_book(self, query):
        sidx = query.get("sIDX", ["669"])[0]
        cookie = self.headers.get("X-Cookie", "")

        addr_book = []
        try:
            json_path = os.path.join(BASE_DIR, "data", "address_book.json")
            if os.path.exists(json_path):
                with open(json_path, "r", encoding="utf-8") as f:
                    addr_book = json.load(f)
        except Exception:
            pass

        url = f"{INTRANET_BASE}/schedule/schedule_reg.asp?sIDX={sidx}&year=2026&month=10&day=1"
        try:
            res = requests.get(url, headers=self._get_headers(cookie, sidx), timeout=10)
            res.encoding = "euc-kr"
            soup = BeautifulSoup(res.text, "html.parser")

            sel = soup.find("select", attrs={"name": "addrBook"})
            if sel:
                parsed_book = []
                for opt in sel.find_all("option"):
                    val = opt.get("value", "").strip()
                    name = opt.get_text(strip=True)
                    if name and val:
                        is_team = any(k in name for k in ['팀', '센터', '소장', '부대표', '대표', '일정', '교육', '세미나', 'MBTI', '스튜디오', 'ZOOM', '공용'])
                        parsed_book.append({"id": val, "name": name, "category": "team" if is_team else "member"})
                if parsed_book:
                    addr_book = parsed_book

            self._send_json(200, {"success": True, "address_book": addr_book, "count": len(addr_book)})
        except Exception as e:
            if addr_book:
                self._send_json(200, {"success": True, "address_book": addr_book, "count": len(addr_book)})
            else:
                self._send_json(500, {"success": False, "error": str(e)})


    def handle_fetch_sheet(self, query):
        sheet_url = query.get("url", [""])[0]
        if not sheet_url:
            self._send_json(400, {"error": "url is required"})
            return

        csv_url = sheet_url
        if "docs.google.com/spreadsheets" in sheet_url:
            m = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", sheet_url)
            if m:
                sheet_id = m.group(1)
                csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv"

        try:
            res = requests.get(csv_url, timeout=10)
            res.encoding = "utf-8"
            self._send_json(200, {"success": True, "csv_data": res.text})
        except Exception as e:
            self._send_json(500, {"success": False, "error": str(e)})

    def handle_register(self, payload, mode="REG"):
        cookie = payload.get("cookie") or self.headers.get("X-Cookie", "")
        sidx = str(payload.get("sIDX", "669"))

        date_str = payload.get("date", "")
        parts = date_str.split("-")
        if len(parts) == 3:
            year, month, day = str(int(parts[0])), str(int(parts[1])), str(int(parts[2]))
        else:
            year = str(payload.get("year", "2026"))
            month = str(payload.get("month", "10"))
            day = str(payload.get("day", "1"))

        s_time = payload.get("startTime", "09:00").split(":")
        e_time = payload.get("endTime", "18:00").split(":")
        s_hour = str(int(s_time[0])) if s_time else "9"
        s_min = str(int(s_time[1])) if len(s_time) > 1 else "0"
        e_hour = str(int(e_time[0])) if e_time else "18"
        e_min = str(int(e_time[1])) if len(e_time) > 1 else "0"

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
            "sHour": s_hour,
            "sMin": s_min,
            "eHour": e_hour,
            "eMin": e_min,
            "content": payload.get("content", "")
        }

        if mode == "MOD" and "idx" in payload:
            form_data["idx"] = str(payload["idx"])

        try:
            # EUC-KR 인코딩으로 변환하여 POST 전송
            encoded_data = urllib.parse.urlencode(form_data, encoding="euc-kr")
            headers = self._get_headers(cookie, sidx)
            headers["Content-Type"] = "application/x-www-form-urlencoded"

            target_url = f"{INTRANET_BASE}/schedule/schedule_proc.asp"
            res = requests.post(target_url, data=encoded_data.encode("euc-kr"), headers=headers, timeout=10)
            res.encoding = "euc-kr"

            text = res.text
            if "alert(" in text:
                m = re.search(r"alert\(['\"](.*?)['\"]\)", text)
                alert_msg = m.group(1) if m else "서버 응답"
                if any(kw in alert_msg for kw in ["완료", "등록", "수정", "성공"]):
                    self._send_json(200, {
                        "success": True,
                        "message": alert_msg,
                        "data": form_data
                    })
                else:
                    self._send_json(400, {"success": False, "message": alert_msg, "raw": text})
            else:
                self._send_json(200, {
                    "success": True,
                    "message": "일정이 성공적으로 저장되었습니다." if mode == "REG" else "수정 완료되었습니다.",
                    "data": form_data
                })
        except Exception as e:
            self._send_json(500, {"success": False, "error": str(e)})

    def handle_delete(self, payload):
        idx = str(payload.get("idx", ""))
        sidx = str(payload.get("sIDX", "669"))
        cookie = payload.get("cookie") or self.headers.get("X-Cookie", "")

        if not idx:
            self._send_json(400, {"error": "idx is required"})
            return

        form_data = {
            "mode": "DEL",
            "idx": idx,
            "sIDX": sidx
        }

        try:
            encoded_data = urllib.parse.urlencode(form_data, encoding="euc-kr")
            headers = self._get_headers(cookie, sidx)
            headers["Content-Type"] = "application/x-www-form-urlencoded"

            target_url = f"{INTRANET_BASE}/schedule/schedule_proc.asp"
            res = requests.post(target_url, data=encoded_data.encode("euc-kr"), headers=headers, timeout=10)
            res.encoding = "euc-kr"

            text = res.text
            if "alert(" in text:
                m = re.search(r"alert\(['\"](.*?)['\"]\)", text)
                alert_msg = m.group(1) if m else "삭제 실패"
                if any(kw in alert_msg for kw in ["삭제", "완료", "성공"]):
                    self._send_json(200, {"success": True, "message": alert_msg})
                else:
                    self._send_json(400, {"success": False, "message": alert_msg})
            else:
                self._send_json(200, {"success": True, "message": f"일정(ID: {idx})이 삭제되었습니다."})
        except Exception as e:
            self._send_json(500, {"success": False, "error": str(e)})


def run():
    with socketserver.TCPServer(("", PORT), ScheduleHandler) as httpd:
        print(f"==================================================")
        print(f" [어세스타 인트라넷 캘린더 관리 웹 서버 가동]")
        print(f" - 브라우저 접속 주소: http://localhost:{PORT}")
        print(f" - 사내망 접속 주소: http://내_IP_주소:{PORT}")
        print(f" - 종료하려면 Ctrl+C 를 누르세요.")
        print(f"==================================================")
        httpd.serve_forever()


if __name__ == "__main__":
    run()
