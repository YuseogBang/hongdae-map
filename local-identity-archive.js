/* Hongdae-only discovery: Hongdae-byeong banner, identity profile, and place memories. */
(() => {
  const IDENTITY_KEY = 'hongdaeIdentityV1';
  const QUIZ_KEY = 'hongikCampusQuizV1';
  const MEMORY_KEY = 'hongdaePlaceMemoriesV1';
  const identities = [
    ['art-student', '홍익대 미대생', '🎨'],
    ['hongik-student', '홍익대 재학생', '🎓'],
    ['local', '홍대권 주민', '🏠'],
    ['music', '공연·음악인', '🎸'],
    ['indie-publisher', '독립출판 작업자', '📚'],
    ['night-worker', '새벽 노동자', '🌙'],
    ['vegan', '비건 생활자', '🌱'],
    ['wheelchair', '휠체어 사용자', '♿'],
    ['international', '외국인 유학생', '🌏'],
    ['visitor', '홍대 방문자', '🧭']
  ];
  const axes = [
    { id:'hidden', label:'검색 2페이지부터 진짜라고 믿는 편', copy:'알고리즘 밖에 남은 작은 장소', allTags:['홍대병','로컬단골'] },
    { id:'quiet', label:'혼자 있고 싶지만 집엔 가기 싫은', copy:'말을 걸지 않는 조용한 구석', allTags:['조용한','혼밥'] },
    { id:'loud', label:'음악 때문에 대화를 포기해도 되는', copy:'취향이 소음보다 큰 곳', anyTags:['시끌벅적'] },
    { id:'old', label:'새것보다 낡은 게 더 솔직한', copy:'고치지 않은 시간이 인테리어인 곳', anyTags:['노포'] },
    { id:'local', label:'줄이 생기면 다른 골목으로 가는 편', copy:'관광 코스보다 단골의 반복으로 버티는 곳', anyTags:['로컬단골'] },
    { id:'late', label:'막차가 끊겨야 하루가 시작되는', copy:'새벽 한 시 이후의 목적지', anyTags:['심야영업'], service:'lateNight' }
  ];
  // 배포 전 재학생 검토를 받기 위한 1차 문제안. 정답은 모두 학교 공식 공개 정보로 교차 확인했다.
  const campusQuiz = [
    { q:'캠퍼스에서 R동이라고 부르는 건물은?', options:['홍문관','와우관','가온관','문헌관'], answer:'홍문관' },
    { q:'캠퍼스에서 L동이라고 부르는 건물은?', options:['문헌관','와우관','홍문관','학생회관'], answer:'와우관' },
    { q:'캠퍼스에서 A동이라고 부르는 건물은?', options:['가온관','홍문관','제1강의동','미술학관'], answer:'가온관' },
    { q:'서울캠퍼스가 자리한 산의 이름은?', options:['와우산','안산','성미산','인왕산'], answer:'와우산' },
    { q:'홍익대학교의 교수(校獸)는?', options:['황소','호랑이','독수리','사자'], answer:'황소' }
  ];

  const escapeHtml = (value) => String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const readJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch (_) { return fallback; } };
  const getIdentity = () => readJSON(IDENTITY_KEY, []);
  const isCampusVerified = () => !!readJSON(QUIZ_KEY, null)?.passed;
  const getMemories = () => readJSON(MEMORY_KEY, []);
  const matchesAxis = (store, axis) => {
    const tags = store.tags || [];
    if (axis.allTags && !axis.allTags.every(tag => tags.includes(tag))) return false;
    if (axis.anyTags && !axis.anyTags.some(tag => tags.includes(tag))) return false;
    if (axis.service && !(store.services || []).includes(axis.service) && !tags.includes('심야영업')) return false;
    return true;
  };
  const overlay = (content, className = '') => {
    const root = document.createElement('div');
    root.className = `hla-overlay ${className}`;
    root.innerHTML = `<div class="hla-sheet">${content}</div>`;
    root.addEventListener('click', e => { if (e.target === root || e.target.closest('[data-hla-close]')) root.remove(); });
    document.body.append(root);
    requestAnimationFrame(() => root.classList.add('open'));
    return root;
  };

  function openHongdaeMode() {
    const root = overlay(`
      <div class="hla-head"><span class="hla-kicker">홍대病 · 자가진단 제01호</span><button data-hla-close aria-label="닫기">✕</button></div>
      <h2>유명해지면 안 가는 편인가요?</h2>
      <p class="hla-copy">별점 말고 취향의 핑계를 고르세요. 서로 모순돼도 괜찮습니다. 원래 취향은 설명할수록 이상해지니까.</p>
      <div class="hla-axis-list">${axes.map(a => `<button class="hla-axis" data-axis="${a.id}"><span><b>${a.label}</b><small>${a.copy}</small></span><i>＋</i></button>`).join('')}</div>
      <button class="hla-primary hla-diagnose" data-apply disabled>증상에 맞는 곳 처방받기</button>
      <p class="hla-foot">※ 완치는 지원하지 않습니다 · 최대 3개</p>`);
    const selected = new Set();
    root.querySelectorAll('[data-axis]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.axis;
      if (selected.has(id)) selected.delete(id);
      else if (selected.size < 3) selected.add(id);
      else { if (typeof showToast === 'function') showToast('감성 좌표는 최대 3개까지 고를 수 있어요'); return; }
      button.classList.toggle('on', selected.has(id));
      button.querySelector('i').textContent = selected.has(id) ? '✓' : '＋';
      const apply = root.querySelector('[data-apply]');
      apply.disabled = !selected.size;
      apply.textContent = selected.size ? `증상 ${selected.size}개로 처방받기` : '증상에 맞는 곳 처방받기';
    }));
    root.querySelector('[data-apply]').addEventListener('click', () => {
      const picked = axes.filter(a => selected.has(a.id));
      // 선택 좌표 가운데 하나라도 그 좌표의 최소 근거를 모두 충족한 장소만 보여준다.
      const matched = stores.filter(s => picked.some(axis => matchesAxis(s, axis)) && s.status !== 'closed');
      const reasons = new Map(matched.map(s => [s.id, picked.filter(axis => matchesAxis(s, axis)).map(a => a.label)]));
      window.hongdaeModeResults = matched;
      root.remove();
      openHongdaeResults(matched, reasons);
    });
  }

  function openHongdaeResults(items, reasons) {
    const root = overlay(`
      <div class="hla-head"><span class="hla-kicker">HONGDAE-BYEONG PICKS</span><button data-hla-close aria-label="닫기">✕</button></div>
      <h2>${items.length ? `${items.length}곳이 걸렸어요` : '아직 맞는 곳이 없어요'}</h2>
      <p class="hla-copy">정확한 점수 대신, 왜 이 장소가 걸렸는지만 보여드려요.</p>
      <div class="hla-results">${items.slice(0, 20).map(s => `<button data-place="${s.id}"><span class="hla-place-emoji">${typeof menuEmoji === 'function' ? menuEmoji(s) : '📍'}</span><span><b>${escapeHtml(s.name)}</b><small>${escapeHtml((reasons.get(s.id) || []).join(' · ') || '홍대의 결이 남은 곳')}</small></span><em>${(s.tags || []).includes('로컬단골') ? '아직 조용함' : '서서히 알려지는 중'}</em></button>`).join('') || '<div class="hla-empty">조건을 하나 줄여 다시 골라보세요.</div>'}</div>
      <button class="hla-secondary" data-again>감성 다시 고르기</button>`);
    root.querySelectorAll('[data-place]').forEach(button => button.addEventListener('click', () => { root.remove(); selectStore(Number(button.dataset.place)); }));
    root.querySelector('[data-again]').addEventListener('click', () => { root.remove(); openHongdaeMode(); });
  }

  function openIdentity(afterSave) {
    const saved = new Set(getIdentity());
    const root = overlay(`
      <div class="hla-head"><span class="hla-kicker">홍대生 · LIFE &amp; PEOPLE</span><button data-hla-close aria-label="닫기">✕</button></div>
      <h2>홍대에서 살아가는<br>당신은 누구인가요?</h2>
      <p class="hla-copy">하나의 직업으로 규정하지 않아요. 나를 설명하는 역할을 여러 개 골라보세요.</p>
      <div class="hla-identities">${identities.map(([id,label,emoji]) => `<button data-identity="${id}" class="${saved.has(id)?'on':''}"><span>${emoji}</span>${label}<i>${saved.has(id)?'✓':'＋'}</i></button>`).join('')}</div>
      <button class="hla-primary" data-save-identity>${saved.size ? '내 정체성 업데이트' : '이렇게 시작하기'}</button>
      <p class="hla-foot">선택은 기기에만 저장되며 언제든 바꿀 수 있어요.</p>`);
    root.querySelectorAll('[data-identity]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.identity;
      saved.has(id) ? saved.delete(id) : saved.add(id);
      button.classList.toggle('on', saved.has(id));
      button.querySelector('i').textContent = saved.has(id) ? '✓' : '＋';
    }));
    const commit = () => {
      localStorage.setItem(IDENTITY_KEY, JSON.stringify([...saved]));
      root.remove();
      if (typeof showToast === 'function') showToast('내 홍대 프로필에 반영했어요');
      if (afterSave) afterSave();
    };
    root.querySelector('[data-save-identity]').addEventListener('click', () => {
      const needsQuiz = saved.has('hongik-student') || saved.has('art-student');
      if (needsQuiz && !isCampusVerified()) { openCampusQuiz(commit); return; }
      commit();
    });
  }

  function openCampusQuiz(onPassed) {
    let step = 0;
    let score = 0;
    const root = overlay('', 'hla-quiz-overlay');
    const render = () => {
      const item = campusQuiz[step];
      root.querySelector('.hla-sheet').innerHTML = `
        <div class="hla-head"><span class="hla-kicker">홍대生 · CAMPUS CHECK ${step + 1}/5</span><button data-hla-close aria-label="닫기">✕</button></div>
        <div class="hla-quiz-progress">${campusQuiz.map((_,i)=>`<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>
        <h2>${escapeHtml(item.q)}</h2>
        <p class="hla-copy">에타식 가벼운 캠퍼스 퀴즈예요. 5문제 중 4문제를 맞히면 인증됩니다.</p>
        <div class="hla-quiz-options">${item.options.map(option => `<button data-answer="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join('')}</div>
        <p class="hla-foot">공식 재학증명이 아닌 커뮤니티용 캠퍼스 지식 인증입니다.</p>`;
      root.querySelectorAll('[data-hla-close]').forEach(button => button.addEventListener('click', () => root.remove()));
      root.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => {
        if (button.dataset.answer === item.answer) score += 1;
        step += 1;
        if (step < campusQuiz.length) { render(); return; }
        finish();
      }));
    };
    const finish = () => {
      const passed = score >= 4;
      root.querySelector('.hla-sheet').innerHTML = `
        <div class="hla-head"><span class="hla-kicker">홍대生 · CAMPUS CHECK</span><button data-hla-close aria-label="닫기">✕</button></div>
        <div class="hla-quiz-result">${passed ? '✓' : `${score}/5`}</div>
        <h2>${passed ? '홍대생 인증 완료' : '한 번 더 돌아다녀야겠어요'}</h2>
        <p class="hla-copy">${passed ? `${score}문제를 맞혔어요. 프로필에 캠퍼스 인증 배지가 표시됩니다.` : '4문제 이상 맞히면 통과할 수 있어요. 답은 저장하지 않습니다.'}</p>
        <button class="hla-primary" data-quiz-finish>${passed ? '프로필에 인증 달기' : '다시 풀기'}</button>
        <p class="hla-foot">공식 재학증명이 아닌 커뮤니티용 캠퍼스 지식 인증입니다.</p>`;
      root.querySelector('[data-hla-close]').addEventListener('click', () => root.remove());
      root.querySelector('[data-quiz-finish]').addEventListener('click', () => {
        if (!passed) { step = 0; score = 0; render(); return; }
        localStorage.setItem(QUIZ_KEY, JSON.stringify({ passed:true, score, verifiedAt:new Date().toISOString(), version:1 }));
        root.remove();
        if (typeof showToast === 'function') showToast('캠퍼스 퀴즈 인증을 통과했어요');
        if (onPassed) onPassed();
      });
    };
    render();
  }

  function identitySummary() {
    const selected = getIdentity();
    return identities.filter(([id]) => selected.includes(id)).map(([,label,emoji]) => `${emoji} ${label}`);
  }

  function openProfile() {
    const summary = identitySummary();
    if (!summary.length) { openIdentity(openProfile); return; }
    const root = overlay(`
      <div class="hla-head"><span class="hla-kicker">홍대生 · MY HONGDAE</span><button data-hla-close aria-label="닫기">✕</button></div>
      <h2>나는 이런 방식으로<br>홍대에서 살아갑니다</h2>
      ${isCampusVerified() ? '<div class="hla-campus-badge">✓ 캠퍼스 퀴즈 인증 · 홍대生</div>' : ''}
      <div class="hla-profile-tags">${summary.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div>
      <p class="hla-copy">앞으로 추천과 제보에는 별점 대신 이 관점이 함께 표시됩니다.</p>
      <button class="hla-primary" data-edit-identity>나는 누구인지 다시 선택</button>
      <button class="hla-secondary" data-open-taste>취향 태그와 저장 기록 보기</button>`);
    root.querySelector('[data-edit-identity]').addEventListener('click', () => { root.remove(); openIdentity(openProfile); });
    root.querySelector('[data-open-taste]').addEventListener('click', () => {
      root.remove();
      if (window.HongdaeExperience?.originalOpenProfile) window.HongdaeExperience.originalOpenProfile();
    });
  }

  function memoryCard(store) {
    const memories = getMemories().filter(m => m.placeId === store.id);
    const known = [];
    if (store.memory) known.push({ text:store.memory, identity:store.reporter || '홍대의 기록', date:store.closedYear ? `${store.closedYear}년 기록` : '기록됨' });
    return `<section class="hla-archive-card" data-archive-for="${store.id}">
      <div class="hla-archive-title"><span>홍대史 · 이 자리의 기억</span><b>${known.length + memories.length}</b></div>
      <p>${store.status === 'closed' ? '사라진 장소도 지도에서 지우지 않습니다.' : '지금의 장소 이전과 이곳에서 있었던 일을 모읍니다.'}</p>
      <div class="hla-memory-list">${[...known,...memories].slice(0,3).map(m => `<blockquote>“${escapeHtml(m.text)}”<small>${escapeHtml(m.identity || '익명의 방문자')} · ${escapeHtml(m.date || '')}</small></blockquote>`).join('') || '<div class="hla-memory-empty">아직 기록된 기억이 없어요. 첫 장면을 남겨주세요.</div>'}</div>
      <button data-add-memory="${store.id}">이 장소의 기억 남기기</button>
    </section>`;
  }

  function injectArchive() {
    const host = document.querySelector('#detail-content .detail-body');
    if (!host || typeof selectedId === 'undefined' || !selectedId || host.querySelector('[data-archive-for]')) return;
    const store = stores.find(s => s.id === selectedId);
    if (!store) return;
    host.insertAdjacentHTML('beforeend', memoryCard(store));
    host.querySelector('[data-add-memory]').addEventListener('click', () => openMemoryForm(store));
  }

  function openMemoryForm(store) {
    const identity = identitySummary();
    const root = overlay(`
      <div class="hla-head"><span class="hla-kicker">홍대史 · PLACE MEMORY</span><button data-hla-close aria-label="닫기">✕</button></div>
      <h2>${escapeHtml(store.name)}의<br>어떤 장면을 기억하나요?</h2>
      <p class="hla-copy">홍대의 역사는 거창한 연표보다 누군가의 짧은 기억에서 시작됩니다.</p>
      <textarea class="hla-memory-input" maxlength="240" placeholder="예: 졸업전시 준비를 하다 새벽 두 시에 자주 들르던 곳이에요."></textarea>
      <button class="hla-primary" data-save-memory>기억 남기기</button>`);
    root.querySelector('[data-save-memory]').addEventListener('click', () => {
      const text = root.querySelector('textarea').value.trim();
      if (text.length < 5) { if (typeof showToast === 'function') showToast('기억을 조금 더 들려주세요'); return; }
      const all = getMemories();
      all.unshift({ placeId:store.id, text, identity:identity[0] || '익명의 방문자', date:new Date().toLocaleDateString('ko-KR') });
      localStorage.setItem(MEMORY_KEY, JSON.stringify(all));
      root.remove();
      document.querySelector(`[data-archive-for="${store.id}"]`)?.remove();
      injectArchive();
      if (typeof showToast === 'function') showToast('홍대 아카이브에 기억을 남겼어요');
    });
  }

  function openArchive() {
    const memories = getMemories();
    const closed = stores.filter(s => s.status === 'closed');
    const recordedIds = new Set(memories.map(m => m.placeId));
    const recorded = stores.filter(s => recordedIds.has(s.id));
    const items = [...closed, ...recorded.filter(s => s.status !== 'closed')];
    const root = overlay(`
      <div class="hla-head"><span class="hla-kicker">홍대史 · HONGDAE ARCHIVE</span><button data-hla-close aria-label="닫기">✕</button></div>
      <h2>사라져도<br>지도에서 지우지 않습니다</h2>
      <p class="hla-copy">폐업한 가게와 사람들이 남긴 장소의 기억을 함께 봅니다.</p>
      <div class="hla-results">${items.map(s => `<button data-place="${s.id}"><span class="hla-place-emoji">${s.status === 'closed' ? '🪦' : '📼'}</span><span><b>${escapeHtml(s.name)}</b><small>${s.status === 'closed' ? `${s.closedYear || '기록된'} 폐업 · ` : ''}${getMemories().filter(m=>m.placeId===s.id).length}개의 기억</small></span><em>${s.dong || '홍대'}</em></button>`).join('') || '<div class="hla-empty">아직 모인 기록이 없어요. 장소 상세에서 첫 기억을 남겨보세요.</div>'}</div>`);
    root.querySelectorAll('[data-place]').forEach(button => button.addEventListener('click', () => { root.remove(); selectStore(Number(button.dataset.place)); }));
  }

  function install() {
    const bar = document.getElementById('category-bar');
    if (bar && !document.getElementById('hongdae-mode-banner')) {
      const button = document.createElement('button');
      button.id = 'hongdae-mode-banner';
      button.className = 'hla-banner';
      button.innerHTML = '<span aria-hidden="true">💊</span><b>홍대병</b>';
      button.addEventListener('click', openHongdaeMode);
      bar.prepend(button);
    }
    const menu = document.getElementById('app-menu');
    if (menu && !menu.querySelector('[data-hla-archive]')) {
      const button = document.createElement('button');
      button.className = 'app-menu-item';
      button.dataset.hlaArchive = '1';
      button.innerHTML = '<span style="width:18px;text-align:center">📼</span>홍대史 · 장소 아카이브';
      button.addEventListener('click', () => { menu.classList.remove('open'); openArchive(); });
      menu.insertBefore(button, menu.querySelector('.app-menu-sep'));
    }
    const mapWrap = document.querySelector('.map-wrap');
    if (mapWrap && !document.querySelector('.hla-feedback-fab')) {
      const feedback = document.createElement('button');
      feedback.className = 'hla-feedback-fab';
      feedback.setAttribute('aria-label', '장소 제보하기');
      feedback.setAttribute('title', '장소 제보하기');
      feedback.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg><span>제보</span>';
      feedback.addEventListener('click', () => window.HongdaeFeedback?.open());
      mapWrap.append(feedback);
    }
    if (window.HongdaeExperience && !window.HongdaeExperience.originalOpenProfile) {
      window.HongdaeExperience.originalOpenProfile = window.HongdaeExperience.openProfile;
      window.HongdaeExperience.openProfile = openProfile;
    }
    new MutationObserver(injectArchive).observe(document.getElementById('detail-content'), { childList:true, subtree:true });
    injectArchive();
  }

  const style = document.createElement('style');
  style.textContent = `
    .hla-banner{flex:none;height:36px;padding:0 13px;border:1px solid #7a2534;border-radius:999px;background:#3d0f16;color:#f5ece7;display:flex;align-items:center;gap:6px;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.35);font-family:Pretendard,sans-serif}.hla-banner span{font-size:14px;line-height:1}.hla-banner b{font-size:12px;letter-spacing:-.02em}.hla-feedback-fab{display:none}.hla-overlay{position:fixed;inset:0;z-index:1400;display:flex;align-items:flex-end;justify-content:center;padding:18px;background:rgba(15,2,5,.76);backdrop-filter:blur(10px);opacity:0;transition:.18s}.hla-overlay.open{opacity:1}.hla-sheet{width:min(440px,100%);max-height:88vh;overflow:auto;padding:22px;border:1px solid #7a2534;border-radius:12px;background:#2b070c;color:#f5ece7;box-shadow:8px 8px 0 #14070a,0 28px 70px rgba(0,0,0,.56);font-family:Pretendard,sans-serif}.hla-head{display:flex;align-items:center}.hla-head button{margin-left:auto;width:32px;height:32px;border:1px solid #7a2534;border-radius:50%;background:#3d0f16;color:#c39298}.hla-kicker{font:800 10px DM Mono,monospace;letter-spacing:.12em;color:#ff7084}.hla-sheet h2{margin:10px 0 8px;font-size:25px;line-height:1.25;letter-spacing:-.05em}.hla-copy{margin:0 0 16px;color:#c39298;font-size:12px;line-height:1.65}.hla-axis-list,.hla-identities{display:grid;gap:8px}.hla-axis,.hla-identities button{display:flex;align-items:center;gap:10px;width:100%;padding:13px;border:1px solid #6e2732;border-radius:8px;background:#3d0f16;color:#f5ece7;text-align:left;font-family:inherit}.hla-axis b,.hla-axis small{display:block}.hla-axis small{margin-top:3px;color:#a98288;font-size:10px}.hla-axis i,.hla-identities i{margin-left:auto;color:#ff7084;font-style:normal}.hla-axis.on,.hla-identities button.on{border-color:#ff536c;background:rgba(232,54,42,.16)}.hla-identities{grid-template-columns:1fr 1fr}.hla-identities button{font-size:11px}.hla-identities button>span{font-size:17px}.hla-primary,.hla-secondary{width:100%;margin-top:15px;padding:14px;border-radius:8px;font:750 13px Pretendard,sans-serif}.hla-primary{border:0;background:#e8362a;color:white}.hla-diagnose{border:1px solid #d8c7a1;background:#8e1d24;box-shadow:4px 4px 0 #14070a;letter-spacing:-.02em}.hla-primary:disabled{opacity:.35}.hla-secondary{border:1px solid #7a2534;background:transparent;color:#c39298}.hla-foot{text-align:center;color:#825a61;font-size:10px}.hla-quiz-progress{display:flex;gap:5px;margin:18px 0}.hla-quiz-progress i{height:4px;flex:1;border-radius:99px;background:#4f151e}.hla-quiz-progress i.on{background:#e8362a}.hla-quiz-options{display:grid;gap:8px}.hla-quiz-options button{padding:14px;border:1px solid #6e2732;border-radius:9px;background:#3d0f16;color:#f5ece7;text-align:left;font:700 13px Pretendard,sans-serif}.hla-quiz-options button:hover{border-color:#ff536c;background:#51131d}.hla-quiz-result{width:76px;height:76px;margin:14px auto;display:grid;place-items:center;border:2px solid #ff536c;border-radius:50%;color:#ff7185;font:900 22px DM Mono,monospace}.hla-campus-badge{display:inline-flex;margin-top:15px;padding:7px 10px;border:1px solid #d7bb76;border-radius:999px;background:rgba(215,187,118,.1);color:#e5cb8a;font:800 10px DM Mono,monospace}.hla-results{display:grid;gap:8px}.hla-results>button{display:flex;align-items:center;gap:10px;width:100%;padding:12px;border:1px solid #63222d;border-radius:14px;background:#3d0f16;color:#f5ece7;text-align:left}.hla-results b,.hla-results small{display:block}.hla-results small{margin-top:4px;color:#bc9197;font-size:10px}.hla-results em{margin-left:auto;color:#ff8293;font-size:9px;font-style:normal}.hla-place-emoji{font-size:21px}.hla-empty,.hla-memory-empty{padding:22px;text-align:center;color:#a77d83;font-size:11px}.hla-profile-tags{display:flex;flex-wrap:wrap;gap:7px;margin:17px 0}.hla-profile-tags span{padding:8px 10px;border-radius:999px;background:rgba(232,54,42,.16);color:#ff9aaa;font-size:11px}.hla-archive-card{margin-top:14px;padding:14px;border:1px solid #624650;border-radius:16px;background:linear-gradient(145deg,#342a2d,#211619);color:#eadbdd}.hla-archive-title{display:flex;justify-content:space-between;color:#d6b978;font:800 10px DM Mono,monospace;letter-spacing:.08em}.hla-archive-card>p{color:#ad9398;font-size:11px;line-height:1.5}.hla-archive-card blockquote{margin:8px 0;padding:10px;border-left:2px solid #a98a54;background:rgba(255,255,255,.035);font-size:11px;line-height:1.55}.hla-archive-card blockquote small{display:block;margin-top:6px;color:#947b80;font-size:9px}.hla-archive-card>button{width:100%;padding:10px;border:1px solid #70575c;border-radius:10px;background:transparent;color:#d8c5c8;font:650 11px Pretendard,sans-serif}.hla-memory-input{box-sizing:border-box;width:100%;min-height:130px;padding:13px;border:1px solid #6e2732;border-radius:14px;background:#3d0f16;color:#f5ece7;font:13px/1.6 Pretendard,sans-serif;resize:vertical}.hla-memory-input::placeholder{color:#895f66}@media(min-width:701px){.hla-overlay{align-items:center}.hla-banner{order:-1}}@media(max-width:700px){.hla-banner{width:auto;height:36px;padding:0 12px}.hla-banner b{font-size:12px}.hla-banner span{font-size:14px}.hla-identities{grid-template-columns:1fr}.hla-sheet{padding:20px}.category-bar .hla-banner{display:flex!important}.hla-feedback-fab{display:flex;position:fixed;z-index:39;right:16px;bottom:calc(75px + env(safe-area-inset-bottom));width:48px;height:48px;border:1px solid #ff536c;border-radius:50%;background:#4b0d17;color:#fff;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.45);cursor:pointer}.hla-feedback-fab svg{width:19px;height:19px}.hla-feedback-fab span{position:absolute;right:55px;padding:5px 8px;border:1px solid #7a2534;border-radius:7px;background:#2b070c;color:#e9dfe1;font:700 9px Pretendard,sans-serif;white-space:nowrap;opacity:0;transform:translateX(4px);transition:.15s}.hla-feedback-fab:hover span,.hla-feedback-fab:focus-visible span{opacity:1;transform:none}body.map-results-open .hla-feedback-fab{display:none}}
  `;
  document.head.append(style);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', install) : install();
  window.HongdaeLocal = { openHongdaeMode, openIdentity, openProfile, openArchive };
})();
