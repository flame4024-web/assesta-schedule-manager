/**
 * 어세스타 인트라넷 캘린더 매니저 클라이언트 로직 (app.js)
 */

(function () {
  'use strict';

  // --- 99명 사내 주소록 기본 데이터 (즉각 반응 Fallback) ---
  const DEFAULT_ADDR_BOOK = [{"id": "11", "name": "경영관리팀", "category": "team"}, {"id": "799", "name": "고객지원팀", "category": "team"}, {"id": "848", "name": "고성실", "category": "member"}, {"id": "690", "name": "교육솔루션개발팀", "category": "team"}, {"id": "677", "name": "교육일정", "category": "team"}, {"id": "390", "name": "김경주", "category": "member"}, {"id": "734", "name": "김다솜", "category": "member"}, {"id": "611", "name": "김도연", "category": "member"}, {"id": "828", "name": "김미소", "category": "member"}, {"id": "882", "name": "김민주", "category": "member"}, {"id": "884", "name": "김석현", "category": "member"}, {"id": "618", "name": "김성모", "category": "member"}, {"id": "867", "name": "김성연", "category": "member"}, {"id": "830", "name": "김송하", "category": "member"}, {"id": "566", "name": "김수정", "category": "member"}, {"id": "148", "name": "김영재 전무이사", "category": "member"}, {"id": "865", "name": "김예인", "category": "member"}, {"id": "885", "name": "김용대", "category": "member"}, {"id": "798", "name": "김유경", "category": "member"}, {"id": "282", "name": "김은정", "category": "member"}, {"id": "22", "name": "김은주(소장)", "category": "team"}, {"id": "635", "name": "김재국", "category": "member"}, {"id": "846", "name": "김재형", "category": "member"}, {"id": "464", "name": "김지영", "category": "member"}, {"id": "883", "name": "김진욱", "category": "member"}, {"id": "520", "name": "김태진(부대표)", "category": "team"}, {"id": "870", "name": "김하영", "category": "member"}, {"id": "608", "name": "김희선", "category": "member"}, {"id": "871", "name": "남다영", "category": "member"}, {"id": "749", "name": "남보란", "category": "member"}, {"id": "879", "name": "남지민", "category": "member"}, {"id": "872", "name": "남하린", "category": "member"}, {"id": "63", "name": "대구센터", "category": "team"}, {"id": "1", "name": "대표님", "category": "team"}, {"id": "701", "name": "대표님", "category": "team"}, {"id": "633", "name": "마케팅팀", "category": "team"}, {"id": "170", "name": "문경춘", "category": "member"}, {"id": "880", "name": "문서현", "category": "member"}, {"id": "8", "name": "물류팀", "category": "team"}, {"id": "851", "name": "박민주", "category": "member"}, {"id": "727", "name": "박보민", "category": "member"}, {"id": "837", "name": "박예진", "category": "member"}, {"id": "849", "name": "박지혜", "category": "member"}, {"id": "873", "name": "박하", "category": "member"}, {"id": "765", "name": "박형준", "category": "member"}, {"id": "5", "name": "부산센터", "category": "team"}, {"id": "229", "name": "상담일정_서울", "category": "team"}, {"id": "847", "name": "서연교", "category": "member"}, {"id": "631", "name": "서울경기공용", "category": "team"}, {"id": "161", "name": "서울경기센터", "category": "team"}, {"id": "733", "name": "서준희", "category": "member"}, {"id": "729", "name": "선지안", "category": "member"}, {"id": "725", "name": "센터", "category": "team"}, {"id": "151", "name": "손성훈", "category": "member"}, {"id": "630", "name": "손창민", "category": "member"}, {"id": "7", "name": "솔루션엔지니어링팀", "category": "team"}, {"id": "293", "name": "송미리", "category": "member"}, {"id": "716", "name": "스튜디오", "category": "team"}, {"id": "691", "name": "심리솔루션개발팀", "category": "team"}, {"id": "845", "name": "안범현", "category": "member"}, {"id": "478", "name": "여창엽", "category": "member"}, {"id": "715", "name": "역량평가 개발팀", "category": "team"}, {"id": "703", "name": "역량평가 운영팀", "category": "team"}, {"id": "349", "name": "오경민", "category": "member"}, {"id": "655", "name": "오리나", "category": "member"}, {"id": "706", "name": "온라인 교육", "category": "team"}, {"id": "707", "name": "온라인세미나", "category": "team"}, {"id": "746", "name": "유아림", "category": "member"}, {"id": "827", "name": "이동철", "category": "member"}, {"id": "38", "name": "이명수", "category": "member"}, {"id": "875", "name": "이민경", "category": "member"}, {"id": "767", "name": "이민정", "category": "member"}, {"id": "881", "name": "이상범", "category": "member"}, {"id": "869", "name": "이서원", "category": "member"}, {"id": "755", "name": "이선호", "category": "member"}, {"id": "551", "name": "이수린", "category": "member"}, {"id": "797", "name": "이승연", "category": "member"}, {"id": "831", "name": "이윤지", "category": "member"}, {"id": "712", "name": "이재형", "category": "member"}, {"id": "773", "name": "이정림", "category": "member"}, {"id": "878", "name": "임성원", "category": "member"}, {"id": "388", "name": "임희철", "category": "member"}, {"id": "705", "name": "자격교육", "category": "team"}, {"id": "876", "name": "정서연", "category": "member"}, {"id": "788", "name": "정주영", "category": "member"}, {"id": "877", "name": "조수민", "category": "member"}, {"id": "735", "name": "조유라", "category": "member"}, {"id": "801", "name": "주찬미", "category": "member"}, {"id": "742", "name": "최예림", "category": "member"}, {"id": "346", "name": "최윤희", "category": "member"}, {"id": "237", "name": "최화열 전무이사", "category": "member"}, {"id": "467", "name": "최희정", "category": "member"}, {"id": "9", "name": "충청센터", "category": "team"}, {"id": "704", "name": "커리어/진로", "category": "member"}, {"id": "783", "name": "편지연", "category": "member"}, {"id": "171", "name": "호남센터", "category": "team"}, {"id": "702", "name": "MBTI", "category": "team"}, {"id": "800", "name": "UX플랫폼팀", "category": "team"}, {"id": "700", "name": "ZOOM", "category": "team"}];

  // --- 기본 상태 (State) ---
  const state = {
    currentDate: new Date(),
    schedules: [],
    bulkList: [],
    addressBook: [...DEFAULT_ADDR_BOOK],
    selectedCcList: [],
    ccCategoryFilter: 'all',
    ccSearchQuery: '',
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
    regCcInput: document.getElementById('regCcInput'),
    ccChipBox: document.getElementById('ccChipBox'),
    ccChipsList: document.getElementById('ccChipsList'),
    ccOpenDropdownBtn: document.getElementById('ccOpenDropdownBtn'),
    ccClearAllBtn: document.getElementById('ccClearAllBtn'),
    ccDropdownPanel: document.getElementById('ccDropdownPanel'),
    ccFilterKeyword: document.getElementById('ccFilterKeyword'),
    ccFilterTabs: document.querySelectorAll('.cc-tab'),
    ccMembersGrid: document.getElementById('ccMembersGrid'),
    ccSelectedCount: document.getElementById('ccSelectedCount'),
    ccCloseDropdownBtn: document.getElementById('ccCloseDropdownBtn'),
    ccTotalBadge: document.getElementById('ccTotalBadge'),
    ccCountAll: document.getElementById('ccCountAll'),
    ccCountTeam: document.getElementById('ccCountTeam'),
    ccCountMember: document.getElementById('ccCountMember'),
    regContent: document.getElementById('regContent'),

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
    initCcPicker();
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

  // --- 참조자(CC) 멀티셀렉트 컴포넌트 컨트롤러 ---
  function initCcPicker() {
    renderCcChips();
    updateCcCategoryCounts();
    renderCcMembersGrid();

    // 입력창 클릭/포커스 시 드롭다운 열기
    elements.regCcInput.addEventListener('focus', () => {
      openCcDropdown();
    });

    // 칩 박스 클릭 시 인풋에 포커스
    elements.ccChipBox.addEventListener('click', (e) => {
      if (!e.target.closest('.cc-chip-remove')) {
        elements.regCcInput.focus();
      }
    });

    // 직접 텍스트 입력 처리: 엔터, 쉼표, 세미콜론 입력 시 칩으로 추가
    elements.regCcInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
        e.preventDefault();
        const val = elements.regCcInput.value.trim().replace(/[,;]$/, '');
        if (val) {
          addCcMember(val);
          elements.regCcInput.value = '';
        }
      } else if (e.key === 'Backspace' && elements.regCcInput.value === '' && state.selectedCcList.length > 0) {
        removeCcMember(state.selectedCcList[state.selectedCcList.length - 1]);
      }
    });

    // 인풋 입력 시 실시간 검색 연동
    elements.regCcInput.addEventListener('input', (e) => {
      state.ccSearchQuery = e.target.value.trim();
      elements.ccFilterKeyword.value = state.ccSearchQuery;
      openCcDropdown();
      renderCcMembersGrid();
    });

    // 드롭다운 내부 검색창
    elements.ccFilterKeyword.addEventListener('input', (e) => {
      state.ccSearchQuery = e.target.value.trim();
      renderCcMembersGrid();
    });

    // 카테고리 탭 (전체 / 팀·부서 / 임직원)
    elements.ccFilterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        elements.ccFilterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.ccCategoryFilter = tab.getAttribute('data-category');
        renderCcMembersGrid();
      });
    });

    // 드롭다운 토글 버튼
    elements.ccOpenDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCcDropdown();
    });

    elements.ccCloseDropdownBtn.addEventListener('click', () => {
      closeCcDropdown();
    });

    // 전체 비우기 버튼
    elements.ccClearAllBtn.addEventListener('click', () => {
      clearAllCcMembers();
    });

    // 바깥 클릭 시 드롭다운 닫기
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.cc-picker-group')) {
        closeCcDropdown();
      }
    });
  }

  function toggleCcDropdown() {
    if (elements.ccDropdownPanel.style.display === 'none' || !elements.ccDropdownPanel.style.display) {
      openCcDropdown();
    } else {
      closeCcDropdown();
    }
  }

  function openCcDropdown() {
    elements.ccDropdownPanel.style.display = 'block';
    renderCcMembersGrid();
  }

  function closeCcDropdown() {
    elements.ccDropdownPanel.style.display = 'none';
  }

  function updateCcCategoryCounts() {
    const total = state.addressBook.length;
    const teams = state.addressBook.filter(m => m.category === 'team').length;
    const members = state.addressBook.filter(m => m.category !== 'team').length;

    if (elements.ccTotalBadge) elements.ccTotalBadge.textContent = total;
    if (elements.ccCountAll) elements.ccCountAll.textContent = total;
    if (elements.ccCountTeam) elements.ccCountTeam.textContent = teams;
    if (elements.ccCountMember) elements.ccCountMember.textContent = members;
  }

  function renderCcChips() {
    elements.ccChipsList.innerHTML = '';
    state.selectedCcList.forEach(name => {
      const isTeam = state.addressBook.some(m => m.name === name && m.category === 'team');
      const chip = document.createElement('div');
      chip.className = `cc-chip ${isTeam ? 'team' : ''}`;
      chip.innerHTML = `
        <span>${name}</span>
        <span class="cc-chip-remove" title="삭제">&times;</span>
      `;
      chip.querySelector('.cc-chip-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        removeCcMember(name);
      });
      elements.ccChipsList.appendChild(chip);
    });

    // 히든 인풋에 인트라넷 규격 문자열 동기화 (예: '김성진, 최준호, ')
    if (state.selectedCcList.length > 0) {
      elements.regCcAddr.value = state.selectedCcList.join(', ') + ', ';
      elements.ccClearAllBtn.style.display = 'inline-flex';
    } else {
      elements.regCcAddr.value = '';
      elements.ccClearAllBtn.style.display = 'none';
    }

    if (elements.ccSelectedCount) {
      elements.ccSelectedCount.textContent = state.selectedCcList.length;
    }
  }

  function renderCcMembersGrid() {
    elements.ccMembersGrid.innerHTML = '';
    const q = state.ccSearchQuery.toLowerCase();
    const cat = state.ccCategoryFilter;

    const filtered = state.addressBook.filter(m => {
      if (cat === 'team' && m.category !== 'team') return false;
      if (cat === 'member' && m.category === 'team') return false;
      if (q && !m.name.toLowerCase().includes(q)) return false;
      return true;
    });

    if (filtered.length === 0) {
      elements.ccMembersGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 1.5rem 0; font-size: 0.85rem;">검색 결과가 없습니다.</div>';
      return;
    }

    filtered.forEach(m => {
      const isSelected = state.selectedCcList.includes(m.name);
      const item = document.createElement('div');
      item.className = `cc-member-item ${isSelected ? 'selected' : ''}`;
      item.innerHTML = `
        <span class="cc-member-name">${m.name}</span>
        <div style="display: flex; align-items: center;">
          <span class="cc-member-badge">${m.category === 'team' ? '팀' : '직원'}</span>
          <span class="cc-check-icon">✓</span>
        </div>
      `;
      item.addEventListener('click', () => {
        toggleCcMember(m.name);
      });
      elements.ccMembersGrid.appendChild(item);
    });
  }

  function toggleCcMember(name) {
    if (state.selectedCcList.includes(name)) {
      removeCcMember(name);
    } else {
      addCcMember(name);
    }
  }

  function addCcMember(name) {
    name = name.trim();
    if (!name) return;
    if (!state.selectedCcList.includes(name)) {
      state.selectedCcList.push(name);
      renderCcChips();
      renderCcMembersGrid();
    }
  }

  function removeCcMember(name) {
    state.selectedCcList = state.selectedCcList.filter(n => n !== name);
    renderCcChips();
    renderCcMembersGrid();
  }

  function clearAllCcMembers() {
    state.selectedCcList = [];
    renderCcChips();
    renderCcMembersGrid();
  }

  async function fetchAddressBook() {
    updateCcCategoryCounts();
    renderCcMembersGrid();
    try {
      const res = await apiCall(`/address_book?sIDX=${state.config.sIDX}`);
      if (res && res.success && res.address_book && res.address_book.length > 0) {
        state.addressBook = res.address_book;
        updateCcCategoryCounts();
        renderCcMembersGrid();
      }
    } catch (e) {
      console.warn('주소록 라이브 로드 건너뜀 (내장 기본 데이터 사용):', e);
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
        clearAllCcMembers();
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
    elements.singleRegisterForm.addEventListener('reset', () => {
      setTimeout(() => clearAllCcMembers(), 10);
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
