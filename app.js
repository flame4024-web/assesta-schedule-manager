/**
 * 어세스타 인트라넷 캘린더 매니저 클라이언트 로직 (app.js)
 */

(function () {
  'use strict';

  // --- 기본 상태 (State) ---
  const state = {
    currentDate: new Date(),
    schedules: [],
    bulkList: [],
    addressBook: [],
    config: {
      sIDX: '669',
      writer: '권민섭',
      cookie: '',
      endpoint: '/api'
    }
  };

  // --- 상수 매핑 ---
  const PLACE_MAP = {
    '1': '내부미팅',
    '2': '외부미팅',
    '3': '업무',
    '4': '외부교육',
    '8': '근태',
    '9': '프로젝트',
    '10': '내부교육',
    '11': '기타'
  };

  const PLACE_NAME_TO_CODE = {
    '내부미팅': '1',
    '외부미팅': '2',
    '업무': '3',
    '외부교육': '4',
    '근태': '8',
    '프로젝트': '9',
    '내부교육': '10',
    '기타': '11'
  };

  // --- DOM 요소 참조 ---
  const elements = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    sessionStatusBadge: document.getElementById('sessionStatusBadge'),
    sessionStatusText: document.getElementById('sessionStatusText'),
    navTabs: document.querySelectorAll('.nav-tab'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    // 캘린더
    calCurrentMonthText: document.getElementById('calCurrentMonthText'),
    calPrevMonthBtn: document.getElementById('calPrevMonthBtn'),
    calNextMonthBtn: document.getElementById('calNextMonthBtn'),
    calTodayBtn: document.getElementById('calTodayBtn'),
    calRefreshBtn: document.getElementById('calRefreshBtn'),
    calQuickAddBtn: document.getElementById('calQuickAddBtn'),
    calendarDaysGrid: document.getElementById('calendarDaysGrid'),

    // 단건 등록
    singleRegisterForm: document.getElementById('singleRegisterForm'),
    regDate: document.getElementById('regDate'),
    regStartTime: document.getElementById('regStartTime'),
    regEndTime: document.getElementById('regEndTime'),
    regPlace: document.getElementById('regPlace'),
    regWriter: document.getElementById('regWriter'),
    regSubject: document.getElementById('regSubject'),
    regCcAddr: document.getElementById('regCcAddr'),
    regContent: document.getElementById('regContent'),
    addrBookSelect: document.getElementById('addrBookSelect'),

    // 일괄 등록
    googleSheetUrlInput: document.getElementById('googleSheetUrlInput'),
    fetchSheetBtn: document.getElementById('fetchSheetBtn'),
    csvDropzone: document.getElementById('csvDropzone'),
    csvFileInput: document.getElementById('csvFileInput'),
    bulkPreviewSection: document.getElementById('bulkPreviewSection'),
    previewCount: document.getElementById('previewCount'),
    selectedCount: document.getElementById('selectedCount'),
    bulkPreviewTbody: document.getElementById('bulkPreviewTbody'),
    checkAllBoxes: document.getElementById('checkAllBoxes'),
    selectAllRowsBtn: document.getElementById('selectAllRowsBtn'),
    startBulkRegisterBtn: document.getElementById('startBulkRegisterBtn'),
    bulkProgressBar: document.getElementById('bulkProgressBar'),
    bulkProgressFill: document.getElementById('bulkProgressFill'),
    bulkProgressText: document.getElementById('bulkProgressText'),

    // 검색 및 관리
    searchKeywordInput: document.getElementById('searchKeywordInput'),
    searchRefreshBtn: document.getElementById('searchRefreshBtn'),
    manageTbody: document.getElementById('manageTbody'),

    // 설정
    settingsForm: document.getElementById('settingsForm'),
    setSidx: document.getElementById('setSidx'),
    setWriter: document.getElementById('setWriter'),
    setCookie: document.getElementById('setCookie'),
    setEndpoint: document.getElementById('setEndpoint'),
    testConnectionBtn: document.getElementById('testConnectionBtn'),

    // 모달 & 토스트
    scheduleModal: document.getElementById('scheduleModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    toastContainer: document.getElementById('toastContainer')
  };

  // --- 초기화 (Init) ---
  function init() {
    loadConfig();
    initTheme();
    bindEvents();
    setDefaultDateValues();
    renderCalendar();
    fetchCalendarData();
    fetchAddressBook();
  }

  const DEFAULT_COOKIE = 'ASPSESSIONIDQSAABDBQ=ELGDCCCDCNPMNFKJHLICMEMG; autologin=1; BP%5FIDX=1; deptIDX=28; IDX=669; Manager%5Fn=N; saveID=mskwon; userGrade=5; userID=mskwon; userIDX=727; userName=%B1%C7%B9%CE%BC%87; userPass=1q2w3e4r1%21';

  function formatCookieInput(rawInput) {
    let val = (rawInput || '').trim().replace(/^["']|["']$/g, '');
    if (!val) return DEFAULT_COOKIE;
    if (val.length === 24 && /^[A-Z0-9]+$/.test(val)) {
      return DEFAULT_COOKIE.replace(/ASPSESSIONIDQSAABDBQ=[A-Z0-9]+/, `ASPSESSIONIDQSAABDBQ=${val}`);
    }
    if (!val.includes('userIDX=')) {
      return `${val}; autologin=1; BP%5FIDX=1; deptIDX=28; IDX=669; Manager%5Fn=N; saveID=mskwon; userGrade=5; userID=mskwon; userIDX=727; userName=%B1%C7%B9%CE%BC%87; userPass=1q2w3e4r1%21`;
    }
    return val;
  }

  // --- 설정 로드 & 저장 ---
  function loadConfig() {
    const saved = localStorage.getItem('assesta_calendar_config');
    if (saved) {
      try {
        state.config = Object.assign(state.config, JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    if (!state.config.cookie) {
      state.config.cookie = DEFAULT_COOKIE;
    } else {
      state.config.cookie = formatCookieInput(state.config.cookie);
    }
    elements.setSidx.value = state.config.sIDX;
    elements.setWriter.value = state.config.writer;
    elements.setCookie.value = state.config.cookie;
    elements.setEndpoint.value = state.config.endpoint;
    elements.regWriter.value = state.config.writer;
  }

  function saveConfig() {
    state.config.sIDX = elements.setSidx.value.trim() || '669';
    state.config.writer = elements.setWriter.value.trim() || '권민섭';
    state.config.cookie = formatCookieInput(elements.setCookie.value);
    state.config.endpoint = elements.setEndpoint.value.trim() || '/api';
    elements.setCookie.value = state.config.cookie;
    localStorage.setItem('assesta_calendar_config', JSON.stringify(state.config));
    elements.regWriter.value = state.config.writer;
    showToast('설정이 브라우저에 저장되었습니다.', 'success');
  }


  // --- 테마 전환 ---
  function initTheme() {
    const savedTheme = localStorage.getItem('assesta_calendar_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('assesta_calendar_theme', next);
  }

  // --- 기본 날짜 세팅 ---
  function setDefaultDateValues() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    elements.regDate.value = `${yyyy}-${mm}-${dd}`;
  }

  // --- 탭 전환 ---
  function switchTab(tabId) {
    elements.navTabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
    });
    elements.tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });
    if (tabId === 'calendarTab') {
      renderCalendar();
    } else if (tabId === 'manageTab') {
      renderManageTable();
    }
  }

  // --- 토스트 알림 ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- API 통신 헬퍼 ---
  async function apiCall(path, method = 'GET', body = null) {
    const baseUrl = state.config.endpoint.replace(/\/+$/, '');
    const url = `${baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Cookie': state.config.cookie,
      'X-Sidx': state.config.sIDX
    };

    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const res = await fetch(url, options);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error(`API Call Error (${path}):`, err);
      throw err;
    }
  }

  // --- 캘린더 렌더링 & 조회 ---
  function renderCalendar() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth(); // 0-indexed

    elements.calCurrentMonthText.textContent = `${year}년 ${month + 1}월`;

    const firstDay = new Date(year, month, 1).getDay(); // 0(Sun) - 6(Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    elements.calendarDaysGrid.innerHTML = '';

    const today = new Date();
    const isThisMonth = today.getFullYear() === year && today.getMonth() === month;

    // 이전 달 패딩 일자
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const cell = createDayCell(prevDay, true);
      elements.calendarDaysGrid.appendChild(cell);
    }

    // 이번 달 일자
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isThisMonth && today.getDate() === day;
      const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month, day).getDay();

      const cell = createDayCell(day, false, isToday, dayOfWeek, cellDateStr);

      // 해당 일자의 일정 주입
      const dayEvents = state.schedules.filter(s => s.date === cellDateStr);
      const eventContainer = cell.querySelector('.day-events');

      dayEvents.forEach(evt => {
        const pill = document.createElement('div');
        pill.className = 'event-pill';
        pill.textContent = evt.title;
        pill.title = `${evt.title} (클릭 시 상세/수정)`;
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          openScheduleDetailModal(evt);
        });
        eventContainer.appendChild(pill);
      });

      // 날짜 빈 공간 클릭 시 해당 날짜로 단건 등록 폼 열기
      cell.addEventListener('click', () => {
        elements.regDate.value = cellDateStr;
        switchTab('singleRegisterTab');
      });

      elements.calendarDaysGrid.appendChild(cell);
    }

    // 다음 달 패딩 일자 (총 그리드 35 or 42 채우기)
    const totalCells = firstDay + daysInMonth;
    const nextPadding = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= nextPadding; day++) {
      const cell = createDayCell(day, true);
      elements.calendarDaysGrid.appendChild(cell);
    }
  }

  function createDayCell(dayNum, isOtherMonth, isToday = false, dayOfWeek = 1, dateStr = '') {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (isOtherMonth) cell.classList.add('other-month');
    if (isToday) cell.classList.add('today');
    if (dayOfWeek === 0) cell.classList.add('sun');
    if (dayOfWeek === 6) cell.classList.add('sat');

    const header = document.createElement('div');
    header.className = 'day-header';
    header.innerHTML = `<span class="day-number">${dayNum}</span>`;

    const events = document.createElement('div');
    events.className = 'day-events';

    cell.appendChild(header);
    cell.appendChild(events);
    return cell;
  }

  async function fetchCalendarData() {
    const year = state.currentDate.getFullYear();
    const month = String(state.currentDate.getMonth() + 1).padStart(2, '0');

    elements.sessionStatusText.textContent = '데이터 동기화 중...';
    try {
      const res = await apiCall(`/calendar?year=${year}&month=${month}&sIDX=${state.config.sIDX}`);
      if (res && res.success) {
        state.schedules = res.schedules || [];
        renderCalendar();
        renderManageTable();
        elements.sessionStatusBadge.classList.add('connected');
        elements.sessionStatusText.textContent = `연결 정상 (${state.schedules.length}건)`;
      } else {
        elements.sessionStatusBadge.classList.remove('connected');
        elements.sessionStatusText.textContent = '조회 실패';
      }
    } catch (err) {
      elements.sessionStatusBadge.classList.remove('connected');
      elements.sessionStatusText.textContent = '서버 미연결';
    }
  }

  async function fetchAddressBook() {
    try {
      const res = await apiCall(`/address_book?sIDX=${state.config.sIDX}`);
      if (res && res.success && res.address_book) {
        state.addressBook = res.address_book;
        elements.addrBookSelect.innerHTML = '<option value="">+ 주소록 선택 추가</option>';
        state.addressBook.forEach(item => {
          const opt = document.createElement('option');
          opt.value = item.name;
          opt.textContent = item.name;
          elements.addrBookSelect.appendChild(opt);
        });
      }
    } catch (e) {
      console.warn('주소록 로드 건너뜀:', e);
    }
  }

  // --- 단건 등록 ---
  async function handleSingleRegister(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('singleSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '등록 진행 중...';

    const payload = {
      date: elements.regDate.value,
      startTime: elements.regStartTime.value,
      endTime: elements.regEndTime.value,
      place: elements.regPlace.value,
      writer: elements.regWriter.value || state.config.writer,
      subject: elements.regSubject.value.trim(),
      ccAddr: elements.regCcAddr.value.trim(),
      content: elements.regContent.value.trim(),
      sIDX: state.config.sIDX,
      cookie: state.config.cookie
    };

    try {
      const res = await apiCall('/register', 'POST', payload);
      if (res.success) {
        showToast('일정이 인트라넷에 성공적으로 등록되었습니다!', 'success');
        elements.regSubject.value = '';
        elements.regContent.value = '';
        fetchCalendarData();
        switchTab('calendarTab');
      } else {
        showToast(`등록 실패: ${res.message || '서버 응답 오류'}`, 'error');
      }
    } catch (err) {
      showToast('네트워크 오류 또는 프록시 서버 확인 필요', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        인트라넷에 일정 등록
      `;
    }
  }

  // --- 다건 일괄 등록 (CSV / Google Sheets) ---
  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      // 콤마 구분자 처리 (따옴표 내부 콤마 보호)
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length >= 4) {
        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        rows.push(rowObj);
      }
    }
    return rows;
  }

  function displayBulkPreview(rows) {
    state.bulkList = rows.map((r, index) => {
      const date = r['일자'] || r['date'] || '';
      const sTime = r['시작시간'] || r['startTime'] || '09:00';
      const eTime = r['종료시간'] || r['endTime'] || '18:00';
      const placeText = r['구분'] || r['place'] || '프로젝트';
      const placeCode = PLACE_NAME_TO_CODE[placeText] || '9';
      const subject = r['제목'] || r['subject'] || '';
      const content = r['내용'] || r['content'] || '';
      const ccAddr = r['참조'] || r['ccAddr'] || '';

      return {
        id: index,
        date,
        startTime: sTime,
        endTime: eTime,
        place: placeCode,
        placeText,
        subject,
        content,
        ccAddr,
        selected: true,
        status: 'pending' // pending, success, failed
      };
    });

    elements.previewCount.textContent = state.bulkList.length;
    elements.selectedCount.textContent = state.bulkList.length;
    renderBulkTable();
    elements.bulkPreviewSection.style.display = 'block';
  }

  function renderBulkTable() {
    elements.bulkPreviewTbody.innerHTML = '';
    state.bulkList.forEach(item => {
      const tr = document.createElement('tr');
      const statusBadge = item.status === 'success' 
        ? '<span class="status-badge success">성공</span>'
        : item.status === 'failed' 
        ? '<span class="status-badge failed">실패</span>'
        : '<span class="status-badge pending">대기</span>';

      tr.innerHTML = `
        <td><input type="checkbox" data-id="${item.id}" ${item.selected ? 'checked' : ''}></td>
        <td>${item.date}</td>
        <td>${item.startTime}~${item.endTime}</td>
        <td><span class="status-badge pending">${item.placeText}</span></td>
        <td><strong>${item.subject}</strong></td>
        <td>${item.content}</td>
        <td>${item.ccAddr}</td>
        <td>${statusBadge}</td>
      `;

      tr.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
        item.selected = e.target.checked;
        updateSelectedCount();
      });

      elements.bulkPreviewTbody.appendChild(tr);
    });
  }

  function updateSelectedCount() {
    const count = state.bulkList.filter(item => item.selected).length;
    elements.selectedCount.textContent = count;
  }

  async function handleFetchGoogleSheet() {
    const url = elements.googleSheetUrlInput.value.trim();
    if (!url) {
      showToast('구글 스프레드시트 URL을 입력하세요.', 'error');
      return;
    }

    elements.fetchSheetBtn.disabled = true;
    elements.fetchSheetBtn.textContent = '불러오는 중...';

    try {
      const res = await apiCall(`/fetch_sheet?url=${encodeURIComponent(url)}`);
      if (res.success && res.csv_data) {
        const rows = parseCSV(res.csv_data);
        if (rows.length === 0) {
          showToast('시트에서 유효한 데이터 행을 찾을 수 없습니다.', 'warning');
        } else {
          displayBulkPreview(rows);
          showToast(`${rows.length}건의 일정을 불러왔습니다. 확인 후 일괄 등록을 누르세요.`, 'success');
        }
      } else {
        showToast('시트 데이터를 가져오지 못했습니다. 링크 공유 권한을 확인하세요.', 'error');
      }
    } catch (err) {
      showToast('시트 로드 실패: ' + err.message, 'error');
    } finally {
      elements.fetchSheetBtn.disabled = false;
      elements.fetchSheetBtn.textContent = '시트 불러오기';
    }
  }

  async function startBulkRegister() {
    const targets = state.bulkList.filter(item => item.selected && item.status !== 'success');
    if (targets.length === 0) {
      showToast('등록할 대상 일정이 선택되지 않았습니다.', 'warning');
      return;
    }

    elements.startBulkRegisterBtn.disabled = true;
    elements.bulkProgressBar.style.display = 'block';

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      const percent = Math.round(((i + 1) / targets.length) * 100);
      elements.bulkProgressFill.style.width = `${percent}%`;
      elements.bulkProgressText.textContent = `등록 진행 중: ${i + 1} / ${targets.length}`;

      const payload = {
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        place: item.place,
        writer: state.config.writer,
        subject: item.subject,
        content: item.content,
        ccAddr: item.ccAddr,
        sIDX: state.config.sIDX,
        cookie: state.config.cookie
      };

      try {
        const res = await apiCall('/register', 'POST', payload);
        if (res.success) {
          item.status = 'success';
          successCount++;
        } else {
          item.status = 'failed';
          failCount++;
        }
      } catch (e) {
        item.status = 'failed';
        failCount++;
      }

      renderBulkTable();
      // 인트라넷 서버 부하 방지 및 안정적인 처리를 위한 딜레이
      await new Promise(r => setTimeout(r, 150));
    }

    elements.startBulkRegisterBtn.disabled = false;
    showToast(`일괄 등록 완료! 성공: ${successCount}건, 실패: ${failCount}건`, successCount > 0 ? 'success' : 'error');
    fetchCalendarData();
  }

  // --- 일정 관리 & 검색 ---
  function renderManageTable() {
    const keyword = elements.searchKeywordInput.value.trim().toLowerCase();
    const filtered = state.schedules.filter(s => {
      if (!keyword) return true;
      return (s.title && s.title.toLowerCase().includes(keyword)) ||
             (s.date && s.date.includes(keyword));
    });

    elements.manageTbody.innerHTML = '';
    if (filtered.length === 0) {
      elements.manageTbody.innerHTML = `
        <tr><td colspan="4" class="text-center py-4">검색 조건에 맞는 일정이 없습니다.</td></tr>
      `;
      return;
    }

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>#${item.idx}</code></td>
        <td>${item.date || '-'}</td>
        <td><strong>${item.title}</strong></td>
        <td>
          <button class="btn btn-outline btn-sm edit-btn" data-idx="${item.idx}">수정</button>
          <button class="btn btn-danger btn-sm delete-btn" data-idx="${item.idx}">삭제</button>
        </td>
      `;

      tr.querySelector('.edit-btn').addEventListener('click', () => openScheduleDetailModal(item, true));
      tr.querySelector('.delete-btn').addEventListener('click', () => handleDeleteSchedule(item.idx, item.title));

      elements.manageTbody.appendChild(tr);
    });
  }

  async function handleDeleteSchedule(idx, title) {
    if (!confirm(`'${title}' 일정을 정말로 삭제하시겠습니까?`)) return;

    try {
      const res = await apiCall('/delete', 'POST', {
        idx: idx,
        sIDX: state.config.sIDX,
        cookie: state.config.cookie
      });
      if (res.success) {
        showToast(`일정이 삭제되었습니다.`, 'success');
        fetchCalendarData();
      } else {
        showToast(`삭제 실패: ${res.message || '서버 오류'}`, 'error');
      }
    } catch (e) {
      showToast('삭제 요청 중 통신 오류가 발생했습니다.', 'error');
    }
  }

  function openScheduleDetailModal(item, isEdit = false) {
    elements.modalTitle.textContent = isEdit ? `일정 수정 (ID: ${item.idx})` : `일정 상세 (ID: ${item.idx})`;
    elements.modalBody.innerHTML = `
      <form id="modalEditForm">
        <input type="hidden" id="modalIdx" value="${item.idx}">
        <div class="form-group">
          <label>제목</label>
          <input type="text" id="modalSubject" class="input-control" value="${item.title || ''}" required>
        </div>
        <div class="form-group">
          <label>일자</label>
          <input type="date" id="modalDate" class="input-control" value="${item.date || ''}" required>
        </div>
        <div class="form-row grid-2">
          <div class="form-group">
            <label>시작 시간</label>
            <input type="time" id="modalStartTime" class="input-control" value="09:00">
          </div>
          <div class="form-group">
            <label>종료 시간</label>
            <input type="time" id="modalEndTime" class="input-control" value="18:00">
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-danger btn-sm" id="modalDeleteBtn">삭제하기</button>
          <button type="button" class="btn btn-secondary" id="modalCancelBtn">취소</button>
          <button type="submit" class="btn btn-primary">변경사항 저장</button>
        </div>
      </form>
    `;

    document.getElementById('modalCancelBtn').onclick = closeModal;
    document.getElementById('modalDeleteBtn').onclick = () => {
      closeModal();
      handleDeleteSchedule(item.idx, item.title);
    };

    document.getElementById('modalEditForm').onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        idx: item.idx,
        subject: document.getElementById('modalSubject').value.trim(),
        date: document.getElementById('modalDate').value,
        startTime: document.getElementById('modalStartTime').value,
        endTime: document.getElementById('modalEndTime').value,
        writer: state.config.writer,
        sIDX: state.config.sIDX,
        cookie: state.config.cookie
      };

      try {
        const res = await apiCall('/update', 'POST', payload);
        if (res.success) {
          showToast('일정이 수정되었습니다.', 'success');
          closeModal();
          fetchCalendarData();
        } else {
          showToast('수정 실패: ' + (res.message || '오류'), 'error');
        }
      } catch (err) {
        showToast('수정 통신 실패', 'error');
      }
    };

    elements.scheduleModal.style.display = 'flex';
  }

  function closeModal() {
    elements.scheduleModal.style.display = 'none';
  }

  // --- 이벤트 바인딩 ---
  function bindEvents() {
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    elements.navTabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab')));
    });

    // 캘린더 네비게이션
    elements.calPrevMonthBtn.addEventListener('click', () => {
      state.currentDate.setMonth(state.currentDate.getMonth() - 1);
      renderCalendar();
      fetchCalendarData();
    });

    elements.calNextMonthBtn.addEventListener('click', () => {
      state.currentDate.setMonth(state.currentDate.getMonth() + 1);
      renderCalendar();
      fetchCalendarData();
    });

    elements.calTodayBtn.addEventListener('click', () => {
      state.currentDate = new Date();
      renderCalendar();
      fetchCalendarData();
    });

    elements.calRefreshBtn.addEventListener('click', fetchCalendarData);
    elements.calQuickAddBtn.addEventListener('click', () => switchTab('singleRegisterTab'));

    // 단건 등록 폼
    elements.singleRegisterForm.addEventListener('submit', handleSingleRegister);

    // 주소록 선택 시 자동 추가
    elements.addrBookSelect.addEventListener('change', () => {
      const name = elements.addrBookSelect.value;
      if (name) {
        const current = elements.regCcAddr.value.trim();
        elements.regCcAddr.value = current ? `${current}, ${name}, ` : `${name}, `;
        elements.addrBookSelect.value = '';
      }
    });

    // 다건 일괄 등록 이벤트
    elements.fetchSheetBtn.addEventListener('click', handleFetchGoogleSheet);

    elements.csvDropzone.addEventListener('click', () => elements.csvFileInput.click());
    elements.csvFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const rows = parseCSV(evt.target.result);
          displayBulkPreview(rows);
          showToast(`CSV 파일에서 ${rows.length}건을 읽었습니다.`, 'success');
        };
        reader.readAsText(file, 'utf-8');
      }
    });

    // 드래그 앤 드롭
    elements.csvDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      elements.csvDropzone.classList.add('dragover');
    });
    elements.csvDropzone.addEventListener('dragleave', () => {
      elements.csvDropzone.classList.remove('dragover');
    });
    elements.csvDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      elements.csvDropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const reader = new FileReader();
        reader.onload = (evt) => {
          const rows = parseCSV(evt.target.result);
          displayBulkPreview(rows);
          showToast(`CSV 파일에서 ${rows.length}건을 읽었습니다.`, 'success');
        };
        reader.readAsText(file, 'utf-8');
      }
    });

    elements.checkAllBoxes.addEventListener('change', (e) => {
      const checked = e.target.checked;
      state.bulkList.forEach(item => item.selected = checked);
      renderBulkTable();
      updateSelectedCount();
    });

    elements.selectAllRowsBtn.addEventListener('click', () => {
      state.bulkList.forEach(item => item.selected = true);
      renderBulkTable();
      updateSelectedCount();
    });

    elements.startBulkRegisterBtn.addEventListener('click', startBulkRegister);

    // 검색 & 관리
    elements.searchKeywordInput.addEventListener('input', renderManageTable);
    elements.searchRefreshBtn.addEventListener('click', fetchCalendarData);

    // 환경 설정
    elements.settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveConfig();
      fetchCalendarData();
    });

    elements.testConnectionBtn.addEventListener('click', async () => {
      saveConfig();
      showToast('서버 연결 상태를 확인 중입니다...', 'info');
      await fetchCalendarData();
    });

    // 모달 닫기
    elements.modalCloseBtn.addEventListener('click', closeModal);
    elements.scheduleModal.addEventListener('click', (e) => {
      if (e.target === elements.scheduleModal) closeModal();
    });
  }

  // 앱 가동
  document.addEventListener('DOMContentLoaded', init);
})();
