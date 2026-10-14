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
import os

try:
    import requests
except ImportError:
    requests = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

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


def normalize_cc_addr(cc_str):
    """
    레거시 ASP 인트라넷 schedule_proc.asp 필수 규격:
    각 이름/팀 명칭 사이에 ', '가 들어가고, 마지막 끝에도 반드시 ', ' (쉼표+공백)이 필수임.
    끝에 공백이 없거나 쉼표가 없으면 OLE DB SQL 구문 오류(500)가 발생함.
    """
    if not cc_str:
        return ""
    parts = [p.strip() for p in re.split(r"[,;\n]+", str(cc_str)) if p.strip()]
    if not parts:
        return ""
    return ", ".join(parts) + ", "



def make_request(url, method="GET", data=None, headers=None, encoding="euc-kr"):
    headers = headers or {}
    if requests is not None:
        if method == "POST":
            res = requests.post(url, data=data, headers=headers, timeout=10)
        else:
            res = requests.get(url, headers=headers, timeout=10)
        try:
            res.encoding = encoding
            text = res.text
        except Exception:
            text = res.content.decode(encoding, errors="replace")
        return res.status_code, text

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            content = resp.read()
            text = content.decode(encoding, errors="replace")
            return resp.status, text
    except urllib.error.HTTPError as e:
        content = e.read()
        text = content.decode(encoding, errors="replace")
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
                        om = re.search(r"View_Popup\((\d+)\s*(?:,\s*(\d+))?\)", oc)
                        if om:
                            idx = om.group(1)
                            title_short = el.get_text(strip=True)
                            full_title = title_short
                            writer = ""
                            cc_addr = ""
                            place_text = ""
                            time_str = ""
                            content = ""

                            om_attr = el.get("onmouseover", "")
                            if "Detail_View" in om_attr:
                                m_detail = re.search(r"Detail_View\('(.*)'\);", om_attr, re.DOTALL)
                                if m_detail:
                                    inner_html = m_detail.group(1).replace(r"\'", "'")
                                    dsoup = BeautifulSoup(inner_html, "html.parser")
                                    for tr in dsoup.find_all("tr"):
                                        tds = tr.find_all("td")
                                        if len(tds) >= 2:
                                            k = tds[0].get_text(strip=True).replace(":", "")
                                            v = tds[1].get_text("\n", strip=True)
                                            if "제목" in k and v: full_title = v
                                            elif "작성" in k: writer = v
                                            elif "참조" in k: cc_addr = v
                                            elif "구분" in k: place_text = v
                                            elif "시간" in k: time_str = v
                                            elif "내용" in k: content = v

                            td = el.find_parent("td")
                            date_val = None
                            if td:
                                lines = [l.strip() for l in td.get_text().splitlines() if l.strip()]
                                for line in lines:
                                    if line.isdigit() and 1 <= int(line) <= 31:
                                        date_val = f"{year}-{month}-{line.zfill(2)}"
                                        break

                            s_time = "09:00"
                            e_time = "18:00"
                            tm = re.search(r"(\d{1,2})시\s*(\d{1,2})분\s*~\s*(\d{1,2})시\s*(\d{1,2})분", time_str)
                            if tm:
                                s_time = f"{int(tm.group(1)):02d}:{int(tm.group(2)):02d}"
                                e_time = f"{int(tm.group(3)):02d}:{int(tm.group(4)):02d}"

                            schedules.append({
                                "idx": idx,
                                "title": full_title,
                                "title_short": title_short,
                                "date": date_val,
                                "startTime": s_time,
                                "endTime": e_time,
                                "timeStr": time_str,
                                "placeText": place_text,
                                "place": PLACE_MAP.get(place_text, "9"),
                                "writer": writer,
                                "ccAddr": cc_addr,
                                "content": content,
                                "sIDX": sidx
                            })
                else:
                    matches = re.finditer(r"View_Popup\((\d+)\)[^>]*>(.*?)<\/", text, re.IGNORECASE)
                    for m in matches:
                        idx = m.group(1)
                        title = re.sub(r"<[^>]+>", "", m.group(2)).strip()
                        schedules.append({
                            "idx": idx,
                            "title": title,
                            "title_short": title,
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
                return
            except Exception as e:
                self._send_json(500, {"success": False, "error": str(e)})
                return

        if path.endswith("/schedule_detail") or path.endswith("/detail"):
            idx = query.get("idx", [""])[0]
            sidx = query.get("sIDX", ["669"])[0]
            raw_cookie = self.headers.get("X-Cookie", "")
            cookie = normalize_cookie(raw_cookie, sidx)

            if not idx:
                self._send_json(400, {"error": "idx is required"})
                return

            url = f"{INTRANET_BASE}/schedule/schedule_view.asp?idx={idx}&sIDX={sidx}"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
                "Referer": f"{INTRANET_BASE}/schedule/schedule.asp",
                "Cookie": cookie
            }
            try:
                status, text = make_request(url, method="GET", headers=headers)
                form_data = {
                    "idx": idx,
                    "sIDX": sidx,
                    "subject": "",
                    "writer": "",
                    "ccAddr": "",
                    "place": "9",
                    "startTime": "09:00",
                    "endTime": "18:00",
                    "content": ""
                }
                s_hour, s_min, e_hour, e_min = "9", "0", "18", "0"

                if BeautifulSoup is not None:
                    soup = BeautifulSoup(text, "html.parser")
                    for inp in soup.find_all(["input", "textarea", "select"]):
                        name = inp.get("name")
                        if not name: continue
                        if inp.name == "input":
                            itype = inp.get("type", "text").lower()
                            if itype in ["radio", "checkbox"]:
                                if inp.has_attr("checked"): form_data[name] = inp.get("value", "")
                            else:
                                form_data[name] = inp.get("value", "")
                        elif inp.name == "textarea":
                            form_data[name] = inp.get_text()
                        elif inp.name == "select":
                            sel_opt = inp.find("option", selected=True)
                            val = sel_opt.get("value") if sel_opt else ""
                            if name == "sHour": s_hour = val or s_hour
                            elif name == "sMin": s_min = val or s_min
                            elif name == "eHour": e_hour = val or e_hour
                            elif name == "eMin": e_min = val or e_min
                            else: form_data[name] = val

                try:
                    form_data["startTime"] = f"{int(s_hour):02d}:{int(s_min):02d}"
                    form_data["endTime"] = f"{int(e_hour):02d}:{int(e_min):02d}"
                except Exception:
                    form_data["startTime"] = "09:00"
                    form_data["endTime"] = "18:00"

                place_code = form_data.get("place", "9")
                form_data["placeText"] = PLACE_NAMES.get(place_code, "프로젝트")

                self._send_json(200, {
                    "success": True,
                    "schedule": form_data
                })
                return
            except Exception as e:
                self._send_json(500, {"success": False, "error": str(e)})
                return
        if path.endswith("/address_book"):
            sidx = query.get("sIDX", ["669"])[0]
            raw_cookie = self.headers.get("X-Cookie", "")
            cookie = normalize_cookie(raw_cookie, sidx)

            addr_book = []
            try:
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                json_path = os.path.join(base_dir, "data", "address_book.json")
                if os.path.exists(json_path):
                    with open(json_path, "r", encoding="utf-8") as f:
                        addr_book = json.load(f)
            except Exception:
                pass

            url = f"{INTRANET_BASE}/schedule/schedule_reg.asp?sIDX={sidx}&year=2026&month=10&day=1"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
                "Referer": f"{INTRANET_BASE}/schedule/schedule.asp",
                "Cookie": cookie
            }
            try:
                status, text = make_request(url, method="GET", headers=headers)
                if "addrBook" in text:
                    sel_match = re.search(r'<select[^>]*name=[\'"]?addrBook[\'"]?[^>]*>(.*?)</select>', text, re.IGNORECASE | re.DOTALL)
                    if sel_match:
                        sel_html = sel_match.group(1)
                        parsed_book = []
                        options = re.findall(r'<option[^>]*value=[\'"]?(\d+)[\'"]?[^>]*>(.*?)</option>', sel_html, re.IGNORECASE)
                        for val, name in options:
                            val = val.strip()
                            name = re.sub(r'<[^>]+>', '', name).strip()
                            if name and val:
                                is_team = any(k in name for k in ['팀', '센터', '소장', '부대표', '대표', '일정', '교육', '세미나', 'MBTI', '스튜디오', 'ZOOM', '공용'])
                                parsed_book.append({"id": val, "name": name, "category": "team" if is_team else "member"})
                        if parsed_book:
                            addr_book = parsed_book
            except Exception:
                pass


            self._send_json(200, {"success": True, "address_book": addr_book, "count": len(addr_book)})
            return

        if path.endswith("/fetch_sheet"):
            sheet_url = query.get("url", [""])[0]
            csv_url = sheet_url
            if "docs.google.com/spreadsheets" in sheet_url:
                m = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", sheet_url)
                if m:
                    sheet_id = m.group(1)
                    gid_match = re.search(r"[#&?]gid=([0-9]+)", sheet_url)
                    gid_param = f"&gid={gid_match.group(1)}" if gid_match else ""
                    csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv{gid_param}"
            try:
                status, text = make_request(csv_url, method="GET", encoding="utf-8")
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
            mode = "EDIT" if path.endswith("/update") else "REG"
            date_str = str(payload.get("date", "")).replace("/", "-").replace(".", "-")

            parts = date_str.split("-")
            year = parts[0] if len(parts) == 3 else "2026"
            month = parts[1] if len(parts) == 3 else "10"
            day = parts[2] if len(parts) == 3 else "1"


            s_time = payload.get("startTime", "09:00").split(":")
            e_time = payload.get("endTime", "18:00").split(":")
            place_val = str(payload.get("place", "9"))
            if place_val in PLACE_MAP:
                place_val = PLACE_MAP[place_val]

            cc_addr_val = normalize_cc_addr(payload.get("ccAddr", ""))

            form_data = {
                "mode": mode,
                "sIDX": sidx,
                "year": str(int(year)),
                "month": str(int(month)),
                "day": str(int(day)),
                "subject": payload.get("subject", ""),
                "writer": payload.get("writer", "권민섭"),
                "ccAddr": cc_addr_val,
                "place": place_val,
                "sHour": str(int(s_time[0])) if s_time else "9",
                "sMin": str(int(s_time[1])) if len(s_time) > 1 else "0",
                "eHour": str(int(e_time[0])) if e_time else "18",
                "eMin": str(int(e_time[1])) if len(e_time) > 1 else "0",
                "content": payload.get("content", "")
            }
            if (mode in ("MOD", "EDIT")) and "idx" in payload:
                form_data["idx"] = str(payload["idx"])


            try:
                encoded = urllib.parse.urlencode(form_data, encoding="euc-kr").encode("euc-kr")
                status, text = make_request(f"{INTRANET_BASE}/schedule/schedule_proc.asp", method="POST", data=encoded, headers=headers)

                # 1) HTTP 비정상 코드 (500 내부 서버 오류 등)
                if status != 200:
                    self._send_json(status, {
                        "success": False,
                        "message": f"인트라넷 처리 실패 (HTTP {status}) - 참조자 형식 또는 권한을 확인하세요.",
                        "raw": text[:300]
                    })
                    return

                # 2) 본문에 SQL 구문 에러 또는 오류 문자열 포함된 경우
                if any(err_kw in text for err_kw in ["Microsoft OLE DB", "SQL Server", "내부 서버 오류", "오류 유형:", "처리방법을 알수 없습니다"]):
                    self._send_json(500, {
                        "success": False,
                        "message": "인트라넷 SQL 서버 구문 오류 - 참조자 이름/형식이 잘못되었습니다.",
                        "raw": text[:300]
                    })
                    return

                # 3) 자바스크립트 alert 메시지 파싱
                if "alert(" in text:
                    m = re.search(r"alert\(['\"](.*?)['\"]\)", text)
                    alert_msg = m.group(1) if m else "실패"
                    if any(kw in alert_msg for kw in ["완료", "등록", "수정", "성공"]):
                        self._send_json(200, {"success": True, "message": alert_msg, "data": form_data})
                    else:
                        self._send_json(400, {"success": False, "message": alert_msg, "raw": text[:200]})
                    return

                # 4) 정상 처리 스크립트 (window.close 또는 location.reload)
                if "window.close" in text or "location.reload" in text:
                    self._send_json(200, {"success": True, "message": "저장 완료", "data": form_data})
                    return

                self._send_json(200, {"success": True, "message": "저장 요청 완료", "data": form_data})
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
                    msg = m.group(1) if m else "실패"
                    if any(kw in msg for kw in ["삭제", "완료", "성공"]):
                        self._send_json(200, {"success": True, "message": msg})
                    else:
                        self._send_json(400, {"success": False, "message": msg})
                else:
                    self._send_json(200, {"success": True, "message": "삭제 완료"})
            except Exception as e:
                self._send_json(500, {"success": False, "error": str(e)})
            return

        self._send_json(404, {"error": "Not Found"})
