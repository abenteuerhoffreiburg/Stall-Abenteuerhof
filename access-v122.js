/* Stall Abenteuerhof · individuelle Zugriffe · v1.24.3
   ----------------------------------------------------
   Dieses Modul erweitert die bestehende App um personenspezifische Zugriffe.
   Es ist rückwärtskompatibel: bestehende Pferdeteam-Accounts ohne Profil
   behalten zunächst den bisherigen Vollzugriff.

   Sicherheit:
   - Mit AccessControl.gs + angepasstem Apps-Script-Router werden Rechte serverseitig geprüft.
   - Ohne Backend-Update greift weiterhin die UI-/Client-Begrenzung für Team-Accounts,
     ist aber KEIN vollständiger Schutz gegen absichtlich manipulierte Requests.
*/
(function () {
  'use strict';

  const ACCESS_VERSION = 2;
  const LOCAL_PROFILE_KEY = 'settings:access-profiles-v122';
  const ACTIVITY_CONTEXTS = ['Ponygruppen', 'Therapiereiten', 'Bildungsprojekt', 'Offenes / Ferienprogramm'];
  const PONY_GROUP_IDS = ['mo-ponybande','di-1','di-2','mi-1','mi-2','do-1','do-2'];
  const PONY_GROUP_LABELS = {
    'mo-ponybande':'Montag · Ponybande',
    'di-1':'Dienstag · Gruppe 1 · 14:30–16:00',
    'di-2':'Dienstag · Gruppe 2 · 16:00–17:30',
    'mi-1':'Mittwoch · Gruppe 1 · 14:30–16:00',
    'mi-2':'Mittwoch · Gruppe 2 · 16:00–17:30',
    'do-1':'Donnerstag · Gruppe 1 · 14:30–16:00',
    'do-2':'Donnerstag · Gruppe 2 · 16:00–17:30'
  };

  function cleanName(value) {
    return String(value || '').trim().toLocaleLowerCase('de-DE').replace(/\s+/g, ' ');
  }

  function deepClone(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch (e) { return value; }
  }

  function fullTeamAccess() {
    return {
      version: ACCESS_VERSION,
      ponywork: { level:'edit', contexts:['*'] },
      health: 'edit',
      stall: 'edit',
      ponygroups: { level:'edit', grants:[{groupId:'*',validFrom:'',validUntil:''}], groups:['*'], validFrom:'', validUntil:'' },
      tasks: 'all'
    };
  }

  function restrictedTeamAccess() {
    return {
      version: ACCESS_VERSION,
      ponywork: { level:'none', contexts:[] },
      health: 'none',
      stall: 'none',
      ponygroups: { level:'none', grants:[], groups:[], validFrom:'', validUntil:'' },
      tasks: 'none'
    };
  }

  function volunteerExtraAccess() {
    return {
      version: ACCESS_VERSION,
      ponygroups: { level:'none', grants:[], groups:[], validFrom:'', validUntil:'' }
    };
  }

  function normalizeLevel(value, fallback) {
    return ['none','read','edit'].includes(String(value)) ? String(value) : fallback;
  }

  function normalizeDate(value) {
    value = String(value || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
    const date = new Date(value + 'T12:00:00Z');
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value ? value : '';
  }

  function normalizePonygroupAccess(raw, fallbackLevel = 'none') {
    raw = raw && typeof raw === 'object' ? raw : {};
    const result = { level:normalizeLevel(raw.level, fallbackLevel), grants:[], groups:[], validFrom:'', validUntil:'' };
    let grants = Array.isArray(raw.grants) ? raw.grants.slice() : [];
    if (!grants.length && Array.isArray(raw.groups)) {
      grants = raw.groups.map(groupId => ({groupId, validFrom:raw.validFrom || '', validUntil:raw.validUntil || ''}));
    }
    const seen = new Set();
    for (const item of grants) {
      const groupId = String(item && item.groupId || '');
      if (!(groupId === '*' || PONY_GROUP_IDS.includes(groupId))) continue;
      let validFrom = normalizeDate(item.validFrom);
      let validUntil = normalizeDate(item.validUntil);
      if (validFrom && validUntil && validFrom > validUntil) [validFrom,validUntil] = [validUntil,validFrom];
      const key = `${groupId}|${validFrom}|${validUntil}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.grants.push({groupId,validFrom,validUntil});
    }
    if (result.grants.some(g => g.groupId === '*' && !g.validFrom && !g.validUntil)) {
      result.grants = [{groupId:'*',validFrom:'',validUntil:''}];
    }
    result.groups = result.grants.some(g => g.groupId === '*') ? ['*'] : [...new Set(result.grants.map(g => g.groupId))];
    if (result.grants.length === 1) {
      result.validFrom = result.grants[0].validFrom;
      result.validUntil = result.grants[0].validUntil;
    }
    if (!result.grants.length) result.level = 'none';
    return result;
  }

  function normalizeTeamAccess(raw, legacyFull = true) {
    if (!raw || typeof raw !== 'object') return legacyFull ? fullTeamAccess() : restrictedTeamAccess();
    const result = restrictedTeamAccess();
    const ponywork = raw.ponywork && typeof raw.ponywork === 'object' ? raw.ponywork : {};
    result.ponywork.level = normalizeLevel(ponywork.level, 'none');
    result.ponywork.contexts = Array.isArray(ponywork.contexts)
      ? [...new Set(ponywork.contexts.map(String).filter(value => value === '*' || ACTIVITY_CONTEXTS.includes(value)))]
      : [];
    if (result.ponywork.contexts.includes('*')) result.ponywork.contexts = ['*'];
    result.health = normalizeLevel(raw.health, 'none');
    result.stall = normalizeLevel(raw.stall, 'none');
    result.ponygroups = normalizePonygroupAccess(raw.ponygroups, 'none');
    result.tasks = ['none','own','all'].includes(String(raw.tasks)) ? String(raw.tasks) : 'none';
    return result;
  }

  function normalizeVolunteerAccess(raw) {
    const result = volunteerExtraAccess();
    if (!raw || typeof raw !== 'object') return result;
    result.ponygroups = normalizePonygroupAccess(raw.ponygroups, 'none');
    return result;
  }

  function readLocalProfiles() {
    try {
      const raw = cache && cache[LOCAL_PROFILE_KEY];
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (e) { return {}; }
  }

  function localProfileFor(name) {
    return readLocalProfiles()[cleanName(name)] || null;
  }

  function teamAuthAccess() {
    const auth = typeof getTeamAuth === 'function' ? getTeamAuth() : null;
    const name = (auth && auth.user) || currentUserName || (typeof getRememberedUserName === 'function' ? getRememberedUserName() : '');
    const explicit = auth && auth.access && typeof auth.access === 'object' ? auth.access : localProfileFor(name);
    return normalizeTeamAccess(explicit, !explicit);
  }

  function volunteerAuthAccess() {
    const auth = typeof getVolunteerAuth === 'function' ? getVolunteerAuth() : null;
    return {
      personal: !!(auth && auth.personal),
      access: normalizeVolunteerAccess(auth && auth.access)
    };
  }

  function currentTeamIsRestricted() {
    if (typeof getRole !== 'function' || getRole() !== 'pferdeteam') return false;
    if (currentTeamIsAdmin) return false;
    const auth = typeof getTeamAuth === 'function' ? getTeamAuth() : null;
    const name = (auth && auth.user) || currentUserName || (typeof getRememberedUserName === 'function' ? getRememberedUserName() : '');
    return !!((auth && auth.access) || localProfileFor(name));
  }

  function pgGrantActive(pg, groupId, dateStr) {
    if (!pg || pg.level === 'none') return false;
    const grants = Array.isArray(pg.grants) ? pg.grants : normalizePonygroupAccess(pg).grants;
    const date = dateStr || (typeof todayStr === 'function' ? todayStr() : new Date().toISOString().slice(0,10));
    return grants.some(grant => {
      if (!(grant.groupId === '*' || grant.groupId === groupId)) return false;
      if (grant.validFrom && date < grant.validFrom) return false;
      if (grant.validUntil && date > grant.validUntil) return false;
      return true;
    });
  }

  function canArea(area) {
    const role = typeof getRole === 'function' ? getRole() : '';
    if (role === 'pferdeteam') {
      if (currentTeamIsAdmin) return true;
      const access = teamAuthAccess();
      if (area === 'ponys') return access.ponywork.level !== 'none' || access.health !== 'none';
      if (area === 'activities') return access.ponywork.level !== 'none';
      if (area === 'health') return access.health !== 'none';
      if (area === 'stall') return access.stall !== 'none';
      if (area === 'ponygroups') return access.ponygroups.level !== 'none' && access.ponygroups.grants.some(grant => pgGrantActive(access.ponygroups, grant.groupId, ''));
      if (area === 'tasks') return access.tasks !== 'none';
      if (area === 'admin') return !!currentTeamIsAdmin;
      return true;
    }
    if (role === 'ehrenamt') {
      // Der bestehende Ehrenamt-Basiszugang bleibt unverändert. Nur Ponygruppen
      // sind eine personenbezogene Zusatzfreigabe und brauchen einen persönlichen Zugang.
      if (area === 'ponygroups') {
        const extra = volunteerAuthAccess();
        const pg = extra.access.ponygroups;
        return extra.personal && pg.level !== 'none' && pg.grants.some(grant => pgGrantActive(pg, grant.groupId, ''));
      }
      if (area === 'tasks' || area === 'admin') return false;
      return true;
    }
    return false;
  }

  function canActivityContext(context, write = false) {
    if (typeof getRole !== 'function' || getRole() !== 'pferdeteam' || currentTeamIsAdmin) return true;
    const pw = teamAuthAccess().ponywork;
    if (pw.level === 'none' || (write && pw.level !== 'edit')) return false;
    return pw.contexts.includes('*') || pw.contexts.includes(String(context || ''));
  }

  function canHealth(write = false) {
    if (typeof getRole !== 'function' || getRole() !== 'pferdeteam' || currentTeamIsAdmin) return true;
    const level = teamAuthAccess().health;
    return level !== 'none' && (!write || level === 'edit');
  }

  function canStall(write = false) {
    if (typeof getRole !== 'function' || getRole() !== 'pferdeteam' || currentTeamIsAdmin) return true;
    const level = teamAuthAccess().stall;
    return level !== 'none' && (!write || level === 'edit');
  }

  function canPonyGroup(groupId, dateStr = '', write = false) {
    const role = typeof getRole === 'function' ? getRole() : '';
    if (role === 'pferdeteam') {
      if (currentTeamIsAdmin) return true;
      const pg = teamAuthAccess().ponygroups;
      return (!write || pg.level === 'edit') && pgGrantActive(pg, String(groupId || ''), dateStr);
    }
    if (role === 'ehrenamt') {
      const extra = volunteerAuthAccess();
      if (!extra.personal) return false;
      const pg = extra.access.ponygroups;
      return (!write || pg.level === 'edit') && pgGrantActive(pg, String(groupId || ''), dateStr);
    }
    return false;
  }

  function canTasks(mode = 'view', item = null) {
    if (typeof getRole !== 'function' || getRole() !== 'pferdeteam') return false;
    if (currentTeamIsAdmin) return true;
    const level = teamAuthAccess().tasks;
    if (level === 'all') return true;
    if (level !== 'own') return false;
    const me = cleanName(currentUserName || (typeof getRememberedUserName === 'function' ? getRememberedUserName() : ''));
    if (!item) return mode === 'view';
    const assignee = cleanName(item.assignee || '');
    return !!me && assignee === me;
  }

  function groupIdFromPonyGroupKey(key) {
    const parts = String(key || '').split(':');
    if (parts[0] !== 'ponygroup') return '';
    if (['attendance','roster','schedule','plan'].includes(parts[1])) return parts[2] || '';
    if (parts[1] === 'leitung') return '*';
    return parts[1] || '';
  }

  function dateFromPonyGroupKey(key) {
    const parts = String(key || '').split(':');
    if (parts[0] !== 'ponygroup') return '';
    if (['attendance','schedule','plan'].includes(parts[1])) return parts[3] || '';
    if (parts[1] === 'roster' || parts[1] === 'leitung') return '';
    return parts[2] || '';
  }

  function ponyGroupKeyAllowedForCurrentUser(key, write = false) {
    key = String(key || '');
    if (getRole() === 'pferdeteam' && (currentTeamIsAdmin || !currentTeamIsRestricted())) return true;
    const groupId = groupIdFromPonyGroupKey(key);
    const date = dateFromPonyGroupKey(key);
    if (!PONY_GROUP_IDS.includes(groupId)) return false;
    const roster = key === `ponygroup:roster:${groupId}`;
    const schedule = key.startsWith(`ponygroup:schedule:${groupId}:`);
    const attendance = key.startsWith(`ponygroup:attendance:${groupId}:`);
    const plan = key.startsWith(`ponygroup:plan:${groupId}:`);
    const content = key.startsWith(`ponygroup:${groupId}:`);
    if (!roster && (!(schedule || attendance || plan || content) || !normalizeDate(date))) return false;
    const expected = roster ? `ponygroup:roster:${groupId}` : schedule ? `ponygroup:schedule:${groupId}:${date}` : attendance ? `ponygroup:attendance:${groupId}:${date}` : plan ? `ponygroup:plan:${groupId}:${date}` : `ponygroup:${groupId}:${date}`;
    if (key !== expected) return false;
    if (write && getRole() === 'ehrenamt' && !(attendance || plan || content)) return false;
    if (write && roster && getRole() === 'pferdeteam' && !currentTeamIsAdmin && currentTeamIsRestricted()) {
      const pg = teamAuthAccess().ponygroups;
      if (!pg.grants.some(grant => grant.groupId === '*' && !grant.validFrom && !grant.validUntil)) return false;
    }
    return canPonyGroup(groupId, date, write);
  }

  function stallKey(key) {
    key = String(key || '');
    return key === 'pastures:status' || key === 'customFerienWeeks' ||
      key.startsWith('pasturecomments:') || key.startsWith('shop:') ||
      key.startsWith('schicht:') || key === 'settings:schicht-days' ||
      key.startsWith('responsibility:') || key.startsWith('important-contact:') ||
      key.startsWith('ponyinfo:') || key.startsWith('ponyinfo-history:') ||
      key.startsWith('pony-locations:');
  }

  function keyAllowedForCurrentUser(key, value, write = false) {
    key = String(key || '');
    const role = typeof getRole === 'function' ? getRole() : '';
    if (role !== 'pferdeteam') {
      if (key.startsWith('ponygroup:')) return ponyGroupKeyAllowedForCurrentUser(key, write);
      return true; // bestehende Ehrenamt-Regeln bleiben zusätzlich aktiv
    }
    if (currentTeamIsAdmin) return true;
    if (key === LOCAL_PROFILE_KEY) return false;
    if (key.startsWith('gesundheit:') || key.startsWith('gesphoto:') || key.startsWith('healthack:')) return canHealth(write);
    if (key.startsWith('belastung:')) {
      try {
        const entry = typeof value === 'string' ? JSON.parse(value) : value;
        return canActivityContext(entry && entry.kontext, write);
      } catch (e) { return false; }
    }
    if (key.startsWith('ponygroup:')) return ponyGroupKeyAllowedForCurrentUser(key, write);
    if (key.startsWith('todo:')) {
      try { return canTasks(write ? 'edit' : 'view', typeof value === 'string' ? JSON.parse(value) : value); }
      catch (e) { return false; }
    }
    if (key === 'settings:todo-assignees' || key === 'settings:foej-plan') return teamAuthAccess().tasks === 'all';
    if (stallKey(key)) return canStall(write);
    if (key === 'ponies' || key.startsWith('photo:')) return canArea('ponys');
    if (key === 'settings:ponygroup-leads-v1') return false;
    if (key === 'settings:theme-colors' || key === 'settings:last-backup' || key === 'settings:data-retention-policy') return false;
    return true;
  }

  function pruneCache() {
    if (typeof cache !== 'object' || !cache) return;
    const source = {...cache};
    for (const [key, value] of Object.entries(source)) {
      const visible = typeof keyVisibleInCurrentScope_ === 'function' ? keyVisibleInCurrentScope_(key, value, source) : keyAllowedForCurrentUser(key, value, false);
      if (!visible) delete cache[key];
    }
  }

  function applyActivityContextUi() {
    const role = typeof getRole === 'function' ? getRole() : '';
    if (role !== 'pferdeteam' || currentTeamIsAdmin) return;
    document.querySelectorAll('#belKontext .chip[data-val]').forEach(chip => {
      const allowed = canActivityContext(chip.dataset.val, false);
      chip.hidden = !allowed;
      chip.style.display = allowed ? '' : 'none';
      if (!allowed) chip.classList.remove('selected');
    });
  }

  function applyPonyGroupRows() {
    document.querySelectorAll('.pony-group-row[data-group-id]').forEach(row => {
      const allowed = canPonyGroup(row.dataset.groupId, '', false);
      row.hidden = !allowed;
      row.style.display = allowed ? '' : 'none';
    });
    document.querySelectorAll('#ponyGroupsOverview .pony-group-day-block').forEach(block => {
      const any = [...block.querySelectorAll('.pony-group-row[data-group-id]')].some(row => !row.hidden && row.style.display !== 'none');
      block.hidden = !any;
      block.style.display = any ? '' : 'none';
    });

    const role = typeof getRole === 'function' ? getRole() : '';
    const fullPgTeam = role === 'pferdeteam' && (currentTeamIsAdmin || teamAuthAccess().ponygroups.grants.some(g => g.groupId === '*' && !g.validFrom && !g.validUntil));
    const roster = document.getElementById('ponyGroupRosterInlineEntry');
    const helfi = document.getElementById('helfiPlanInlineEntry');
    const lead = document.getElementById('ponyGroupLeadInlineEntry');
    if (roster) roster.style.display = fullPgTeam ? 'block' : 'none';
    if (helfi) helfi.style.display = fullPgTeam ? 'block' : 'none';
    if (lead && !fullPgTeam) lead.style.display = 'none';

    const scope = document.getElementById('ponyGroupAccessScope');
    if (scope && canArea('ponygroups')) {
      const pill = scope.querySelector('.access-scope-pill');
      const copy = scope.querySelector('span:last-child');
      if (role === 'ehrenamt') {
        if (pill) { pill.textContent = 'Ehrenamt · Zusatzfreigabe'; pill.className = 'access-scope-pill shared'; }
        if (copy) copy.textContent = 'Nur freigegebene Ponygruppe(n)';
      } else if (!fullPgTeam) {
        if (pill) { pill.textContent = 'Team · eingeschränkt'; pill.className = 'access-scope-pill team'; }
        if (copy) copy.textContent = 'Nur freigegebene Ponygruppe(n)';
      }
    }
  }

  function applyAccessUi() {
    const role = typeof getRole === 'function' ? getRole() : '';
    document.body.classList.toggle('access-v122-restricted-team', role === 'pferdeteam' && currentTeamIsRestricted());
    document.body.classList.toggle('access-v122-no-health', role === 'pferdeteam' && !canArea('health'));
    document.body.classList.toggle('access-v122-no-stall', role === 'pferdeteam' && !canArea('stall'));
    document.body.classList.toggle('access-v122-no-activities', role === 'pferdeteam' && !canArea('activities'));
    document.body.classList.toggle('access-v122-no-tasks', !canArea('tasks'));
    document.body.classList.toggle('access-v122-extra-ponygroups', role === 'ehrenamt' && canArea('ponygroups'));

    const ponyGroupsBtn = document.getElementById('ponyGroupsBtn');
    if (ponyGroupsBtn) { ponyGroupsBtn.style.display = canArea('ponygroups') ? '' : 'none'; ponyGroupsBtn.hidden = !canArea('ponygroups'); }
    const todosBtn = document.getElementById('openTodos');
    if (todosBtn) { todosBtn.style.display = canArea('tasks') ? '' : 'none'; todosBtn.hidden = !canArea('tasks'); }
    const todayTodoBtn = document.getElementById('todayTodoBtn');
    if (todayTodoBtn) todayTodoBtn.style.display = canArea('tasks') ? 'block' : 'none';
    const healthFolder = document.getElementById('openGesundheit');
    if (healthFolder && role === 'pferdeteam') healthFolder.style.display = canArea('health') ? '' : 'none';
    const healthHub = document.getElementById('ponysHubHealthBtn');
    if (healthHub && role === 'pferdeteam') healthHub.style.display = canArea('health') ? '' : 'none';

    applyActivityContextUi();
    applyPonyGroupRows();
    if (typeof applyPersonalNavigation === 'function') applyPersonalNavigation();
  }

  function accessSummary(access) {
    const parts = [];
    if (access.ponywork.level !== 'none') {
      const contexts = access.ponywork.contexts.includes('*') ? 'alle Kontexte' : access.ponywork.contexts.join(', ');
      parts.push(`Ponyarbeit · ${contexts || 'keine Kontexte'}`);
    }
    if (access.health !== 'none') parts.push('Gesundheit');
    if (access.stall !== 'none') parts.push('Stall');
    if (access.ponygroups.level !== 'none' && access.ponygroups.grants.length) {
      const grantText = access.ponygroups.grants.map(grant => {
        const group = grant.groupId === '*' ? 'alle Gruppen' : (PONY_GROUP_LABELS[grant.groupId] || grant.groupId);
        let period = '';
        if (grant.validFrom && grant.validUntil && grant.validFrom === grant.validUntil) period = ' am ' + grant.validFrom.split('-').reverse().join('.');
        else if (grant.validFrom && grant.validUntil) period = ' ' + grant.validFrom.split('-').reverse().join('.') + '–' + grant.validUntil.split('-').reverse().join('.');
        else if (grant.validFrom) period = ' ab ' + grant.validFrom.split('-').reverse().join('.');
        else if (grant.validUntil) period = ' bis ' + grant.validUntil.split('-').reverse().join('.');
        return group + period;
      }).join('; ');
      parts.push(`Ponygruppen · ${grantText}`);
    }
    if (access.tasks !== 'none') parts.push(access.tasks === 'all' ? 'Aufgaben · alle' : 'Aufgaben · eigene');
    return parts.length ? parts.join(' · ') : 'Kein zusätzlicher interner Zugriff';
  }

  async function secureAccessCall(action, payload = {}) {
    const token = typeof getTeamToken === 'function' ? getTeamToken() : '';
    if (!token) return {ok:false,error:'unauthorized'};
    try {
      if (typeof RUNNING_IN_GAS !== 'undefined' && RUNNING_IN_GAS) {
        const map = {
          accessCapabilities: 'serverAccessCapabilitiesV122',
          listAccessAccounts: 'serverAccessAdminListAccountsV122',
          saveAccessProfile: 'serverAccessAdminSaveProfileV122',
          addPersonalVolunteer: 'serverAccessAdminAddVolunteerV122',
          updatePersonalVolunteerPin: 'serverAccessAdminUpdateVolunteerPinV122',
          removePersonalVolunteer: 'serverAccessAdminRemoveVolunteerV122',
          accessAudit: 'serverAccessAdminAuditV123',
          hardenMediaSharing: 'serverHardenExistingMediaSharingV123'
        };
        const fn = map[action];
        if (!fn) return {ok:false,error:'unknown_action'};
        if (action === 'accessCapabilities') return await gasCall(fn, token);
        if (action === 'listAccessAccounts') return await gasCall(fn, token);
        if (action === 'saveAccessProfile') return await gasCall(fn, token, payload.name, payload.accountType, payload.access);
        if (action === 'addPersonalVolunteer') return await gasCall(fn, token, payload.name, payload.pin, payload.access);
        if (action === 'updatePersonalVolunteerPin') return await gasCall(fn, token, payload.name, payload.pin);
        if (action === 'removePersonalVolunteer') return await gasCall(fn, token, payload.name);
        if (action === 'accessAudit') return await gasCall(fn, token, payload.limit || 50);
        if (action === 'hardenMediaSharing') return await gasCall(fn, token);
      }
      const res = await fetch(GAS_URL, {
        method:'POST',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({action, teamToken:token, ...payload})
      });
      if (!res.ok) throw new Error('http ' + res.status);
      return await res.json();
    } catch (e) {
      return {ok:false,error:'backend'};
    }
  }

  async function saveFallbackProfile(name, access) {
    const profiles = readLocalProfiles();
    profiles[cleanName(name)] = normalizeTeamAccess(access, false);
    return await storageSet(LOCAL_PROFILE_KEY, JSON.stringify(profiles));
  }

  function createEditor() {
    if (document.getElementById('accessV122Overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'accessV122Overlay';
    overlay.className = 'access-v122-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="access-v122-sheet" role="dialog" aria-modal="true" aria-labelledby="accessV122Title">
        <div class="access-v122-sheet-head">
          <div><div class="detail-header" id="accessV122Title">Zugriff bearbeiten</div><div class="detail-sub" id="accessV122Subtitle"></div></div>
          <button type="button" class="access-v122-close" aria-label="Schließen">×</button>
        </div>
        <div id="accessV122TeamFields">
          <section class="access-v122-section">
            <div class="access-v122-section-title">Ponys &amp; Aktivitäten</div>
            <label class="access-v122-switch-row"><span><strong>Zugriff</strong><small>Ponys öffnen und Aktivitäten dokumentieren</small></span><input type="checkbox" id="accessV122Ponywork"></label>
            <div id="accessV122Contexts" class="access-v122-subgroup">
              <div class="access-v122-hint">Arbeitskontexte</div>
              ${ACTIVITY_CONTEXTS.map(value => `<label><input type="checkbox" data-access-context="${value.replace(/"/g,'&quot;')}"> ${value}</label>`).join('')}
              <label><input type="checkbox" id="accessV122AllContexts"> Alle Kontexte</label>
            </div>
          </section>
          <section class="access-v122-section access-v122-grid-two">
            <label class="access-v122-switch-row"><span><strong>Gesundheit</strong><small>Gesundheitsdokumentation</small></span><input type="checkbox" id="accessV122Health"></label>
            <label class="access-v122-switch-row"><span><strong>Stall</strong><small>Standorte, Zuständigkeiten, Kontakte usw.</small></span><input type="checkbox" id="accessV122Stall"></label>
          </section>
        </div>
        <section class="access-v122-section">
          <div class="access-v122-section-title">Ponygruppen</div>
          <label class="access-v122-switch-row"><span><strong>Zugriff</strong><small id="accessV122PonygroupHelp">Anwesenheit, Ponyeinteilung und Inhalte</small></span><input type="checkbox" id="accessV122Ponygroups"></label>
          <div id="accessV122Groups" class="access-v122-subgroup">
            <div class="access-v122-hint">Freigaben</div>
            <div id="accessV123GrantList"></div>
            <button type="button" class="access-action-btn access-v123-add-grant" id="accessV123AddGrant">Freigabe hinzufügen</button>
            <div class="access-v122-help">Jede Freigabe kann dauerhaft oder zeitlich begrenzt sein. So kann z. B. eine Gruppe dauerhaft und eine zweite nur für einen Vertretungstag freigegeben werden.</div>
          </div>
        </section>
        <section class="access-v122-section" id="accessV122TasksSection">
          <div class="access-v122-section-title">Aufgaben</div>
          <select id="accessV122Tasks">
            <option value="none">Kein Zugriff</option>
            <option value="own">Nur eigene Aufgaben</option>
            <option value="all">Alle Aufgaben</option>
          </select>
        </section>
        <div class="access-v122-footer">
          <div class="save-status" id="accessV122Status"></div>
          <button type="button" class="toggle-details" id="accessV122Cancel">Abbrechen</button>
          <button type="button" class="submit-btn" id="accessV122Save">Speichern</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.access-v122-close').onclick = closeEditor;
    document.getElementById('accessV122Cancel').onclick = closeEditor;
    overlay.addEventListener('click', event => { if (event.target === overlay) closeEditor(); });
    document.getElementById('accessV122AllContexts').onchange = event => {
      overlay.querySelectorAll('[data-access-context]').forEach(input => { input.checked = event.target.checked; input.disabled = event.target.checked; });
    };
    document.getElementById('accessV123AddGrant').onclick = () => addGrantRow();
  }

  function grantRowHtml(grant = {}) {
    const groupId = String(grant.groupId || '');
    const options = [`<option value="">Gruppe wählen</option>`,`<option value="*"${groupId==='*'?' selected':''}>Alle Ponygruppen</option>`]
      .concat(PONY_GROUP_IDS.map(id => `<option value="${id}"${groupId===id?' selected':''}>${PONY_GROUP_LABELS[id]}</option>`)).join('');
    return `<div class="access-v123-grant-row">
      <select class="access-v123-grant-group" aria-label="Ponygruppe">${options}</select>
      <div class="access-v122-date-grid">
        <label class="access-v122-date"><span>Gültig von</span><input type="date" class="access-v123-grant-from" value="${escapeHtml(grant.validFrom || '')}"></label>
        <label class="access-v122-date"><span>Gültig bis</span><input type="date" class="access-v123-grant-until" value="${escapeHtml(grant.validUntil || '')}"></label>
      </div>
      <button type="button" class="access-v123-remove-grant" aria-label="Freigabe entfernen">Entfernen</button>
    </div>`;
  }

  function wireGrantRows() {
    document.querySelectorAll('#accessV123GrantList .access-v123-remove-grant').forEach(button => {
      button.onclick = () => {
        button.closest('.access-v123-grant-row')?.remove();
        if (!document.querySelector('#accessV123GrantList .access-v123-grant-row')) addGrantRow();
      };
    });
  }

  function addGrantRow(grant = {}) {
    const list = document.getElementById('accessV123GrantList');
    if (!list) return;
    list.insertAdjacentHTML('beforeend', grantRowHtml(grant));
    wireGrantRows();
  }

  function renderGrantRows(grants) {
    const list = document.getElementById('accessV123GrantList');
    if (!list) return;
    const values = Array.isArray(grants) && grants.length ? grants : [{}];
    list.innerHTML = values.map(grantRowHtml).join('');
    wireGrantRows();
  }

  function collectGrantRows() {
    return [...document.querySelectorAll('#accessV123GrantList .access-v123-grant-row')].map(row => ({
      groupId: row.querySelector('.access-v123-grant-group')?.value || '',
      validFrom: row.querySelector('.access-v123-grant-from')?.value || '',
      validUntil: row.querySelector('.access-v123-grant-until')?.value || ''
    })).filter(grant => grant.groupId);
  }

  let editorState = null;

  function closeEditor() {
    const overlay = document.getElementById('accessV122Overlay');
    if (overlay) overlay.hidden = true;
    editorState = null;
  }

  function openEditor(account) {
    createEditor();
    const overlay = document.getElementById('accessV122Overlay');
    const isVolunteer = account.accountType === 'volunteer';
    const access = isVolunteer ? normalizeVolunteerAccess(account.access) : normalizeTeamAccess(account.access, account.legacyFull !== false);
    editorState = {name:account.name, accountType:account.accountType || 'team'};
    document.getElementById('accessV122Title').textContent = `Zugriff · ${account.name}`;
    document.getElementById('accessV122Subtitle').textContent = isVolunteer ? 'Ehrenamt · persönlicher Zugang' : 'Team';
    document.getElementById('accessV122TeamFields').hidden = isVolunteer;
    document.getElementById('accessV122TasksSection').hidden = isVolunteer;
    document.getElementById('accessV122PonygroupHelp').textContent = isVolunteer
      ? 'Operative Mitarbeit in freigegebenen Gruppen'
      : 'Anwesenheit, Ponyeinteilung und Inhalte';

    if (!isVolunteer) {
      const ponyEnabled = access.ponywork.level !== 'none';
      document.getElementById('accessV122Ponywork').checked = ponyEnabled;
      document.getElementById('accessV122Health').checked = access.health !== 'none';
      document.getElementById('accessV122Stall').checked = access.stall !== 'none';
      const allContexts = access.ponywork.contexts.includes('*');
      document.getElementById('accessV122AllContexts').checked = allContexts;
      overlay.querySelectorAll('[data-access-context]').forEach(input => {
        input.checked = allContexts || access.ponywork.contexts.includes(input.dataset.accessContext);
        input.disabled = allContexts;
      });
      document.getElementById('accessV122Tasks').value = access.tasks || 'none';
    }

    const pg = access.ponygroups || volunteerExtraAccess().ponygroups;
    document.getElementById('accessV122Ponygroups').checked = pg.level !== 'none';
    renderGrantRows(pg.grants);
    document.getElementById('accessV122Status').textContent = '';
    overlay.hidden = false;
    document.getElementById('accessV122Save').onclick = saveEditor;
  }

  async function saveEditor() {
    if (!editorState) return;
    const status = document.getElementById('accessV122Status');
    const save = document.getElementById('accessV122Save');
    const isVolunteer = editorState.accountType === 'volunteer';
    const pgEnabled = document.getElementById('accessV122Ponygroups').checked;
    const grants = collectGrantRows();
    let access;
    if (isVolunteer) {
      access = normalizeVolunteerAccess({
        ponygroups:{level:pgEnabled ? 'edit':'none', grants:pgEnabled ? grants:[]}
      });
    } else {
      const ponyEnabled = document.getElementById('accessV122Ponywork').checked;
      const allContexts = document.getElementById('accessV122AllContexts').checked;
      const contexts = allContexts ? ['*'] : [...document.querySelectorAll('[data-access-context]:checked')].map(input => input.dataset.accessContext);
      access = normalizeTeamAccess({
        ponywork:{level:ponyEnabled ? 'edit':'none', contexts:ponyEnabled ? contexts:[]},
        health:document.getElementById('accessV122Health').checked ? 'edit':'none',
        stall:document.getElementById('accessV122Stall').checked ? 'edit':'none',
        ponygroups:{level:pgEnabled ? 'edit':'none', grants:pgEnabled ? grants:[]},
        tasks:document.getElementById('accessV122Tasks').value
      }, false);
    }
    if (pgEnabled && !grants.length) {
      status.className = 'save-status error'; status.textContent = 'Bitte mindestens eine Ponygruppen-Freigabe anlegen.'; return;
    }
    const invalidGrant = grants.find(grant => grant.validFrom && grant.validUntil && grant.validFrom > grant.validUntil);
    if (invalidGrant) {
      status.className = 'save-status error'; status.textContent = 'Bei einer Freigabe liegt „Gültig von“ nach „Gültig bis“.'; return;
    }
    if (!isVolunteer && access.ponywork.level !== 'none' && !access.ponywork.contexts.length) {
      status.className = 'save-status error'; status.textContent = 'Bitte mindestens einen Arbeitskontext auswählen.'; return;
    }
    save.disabled = true;
    status.className = 'save-status saving'; status.textContent = 'Speichert …';
    const secure = await secureAccessCall('saveAccessProfile', {name:editorState.name, accountType:editorState.accountType, access});
    let ok = !!secure.ok;
    if (!ok && !isVolunteer) ok = await saveFallbackProfile(editorState.name, access);
    save.disabled = false;
    if (!ok) {
      status.className = 'save-status error';
      status.textContent = isVolunteer
        ? 'Nicht gespeichert. Für persönliche Ehrenamt-Zugänge muss AccessControl.gs im Backend aktiv sein.'
        : 'Zugriff konnte nicht gespeichert werden.';
      return;
    }
    status.className = 'save-status ok'; status.textContent = 'Zugriff gespeichert.';
    setTimeout(async () => { closeEditor(); await renderAccessManagerV122(); }, 350);
  }

  function injectVolunteerAdminUi() {
    const screen = document.getElementById('accessManageScreen');
    if (!screen || document.getElementById('accessV122VolunteerCard')) return;
    const list = document.getElementById('accessList');
    if (!list) return;
    const section = document.createElement('div');
    section.id = 'accessV122VolunteerCard';
    section.innerHTML = `
      <div class="section-label access-v122-volunteer-label">Ehrenamt · persönliche Zusatzfreigaben</div>
      <div class="card access-v122-volunteer-card">
        <div class="admin-note">Nur nötig, wenn eine einzelne Ehrenamtsperson z. B. punktuell eine Ponygruppe sehen soll. Der normale gemeinsame Ehrenamt-Code bleibt bestehen.</div>
        <label for="accessV122VolunteerName" style="margin-top:0;">Persönlichen Ehrenamt-Zugang anlegen</label>
        <div class="admin-form-grid">
          <input type="text" id="accessV122VolunteerName" autocomplete="off" placeholder="Name">
          <label for="accessV122VolunteerPin">Persönliche PIN</label>
          <input type="password" id="accessV122VolunteerPin" autocomplete="new-password" placeholder="mindestens 6 Zeichen">
        </div>
        <button type="button" class="submit-btn" id="accessV122VolunteerAdd">Ehrenamt-Zugang hinzufügen</button>
        <div class="save-status" id="accessV122VolunteerStatus"></div>
      </div>
      <div id="accessV122VolunteerList" class="access-list"></div>
      <div class="section-label access-v122-volunteer-label">Sicherheit</div>
      <div class="card access-v123-security-card">
        <div class="admin-note">Bestehende Anhänge aus älteren Versionen können noch als „Jeder mit Link“ freigegeben sein. Dieser Schritt stellt sie auf privat um.</div>
        <button type="button" class="access-action-btn" id="accessV123HardenMedia">Bestehende Anhänge schützen</button>
        <button type="button" class="access-action-btn" id="accessV123LoadAudit">Berechtigungsprotokoll anzeigen</button>
        <div class="save-status" id="accessV123HardenStatus"></div>
        <div id="accessV123AuditList" class="access-v123-audit-list" hidden></div>
      </div>`;
    list.insertAdjacentElement('afterend', section);
    document.getElementById('accessV122VolunteerAdd').onclick = addPersonalVolunteer;
    const harden = document.getElementById('accessV123HardenMedia');
    if (harden) harden.onclick = hardenExistingMedia;
    const audit = document.getElementById('accessV123LoadAudit');
    if (audit) audit.onclick = loadAccessAudit;
  }

  function accessAuditActionLabel(action) {
    return ({
      access_profile_saved:'Zugriff geändert',
      personal_volunteer_added:'Persönlichen Ehrenamt-Zugang angelegt',
      personal_volunteer_pin_changed:'Ehrenamt-PIN geändert',
      personal_volunteer_removed:'Persönlichen Ehrenamt-Zugang entfernt',
      team_account_added:'Team-Zugang angelegt',
      team_account_updated:'Team-Zugang geändert',
      team_account_removed:'Team-Zugang entfernt'
    })[action] || action || 'Änderung';
  }

  async function loadAccessAudit() {
    const button = document.getElementById('accessV123LoadAudit');
    const list = document.getElementById('accessV123AuditList');
    if (!button || !list) return;
    button.disabled = true; button.textContent = 'Lädt …';
    const result = await secureAccessCall('accessAudit',{limit:40});
    button.disabled = false; button.textContent = list.hidden ? 'Berechtigungsprotokoll anzeigen' : 'Protokoll aktualisieren';
    if (!result.ok) { list.hidden=false; list.innerHTML='<div class="admin-empty">Protokoll konnte nicht geladen werden.</div>'; return; }
    const events = Array.isArray(result.events) ? result.events : [];
    list.hidden = false;
    list.innerHTML = events.length ? events.map(event => {
      const when = event.timestamp ? new Date(event.timestamp).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}) : '';
      return `<div class="access-v123-audit-item"><strong>${escapeHtml(accessAuditActionLabel(event.action))}</strong><span>${escapeHtml(event.targetName || '–')}</span><small>${escapeHtml(when)} · ${escapeHtml(event.actorName || 'System')}</small></div>`;
    }).join('') : '<div class="admin-empty">Noch keine Berechtigungsänderungen protokolliert.</div>';
  }

  async function hardenExistingMedia() {
    const button = document.getElementById('accessV123HardenMedia');
    const status = document.getElementById('accessV123HardenStatus');
    if (!button || !status) return;
    button.disabled = true; status.className='save-status saving'; status.textContent='Anhänge werden geschützt …';
    const result = await secureAccessCall('hardenMediaSharing');
    button.disabled = false;
    if (!result.ok && result.failed !== 0) { status.className='save-status error'; status.textContent='Nicht vollständig abgeschlossen. Bitte erneut versuchen.'; return; }
    status.className='save-status ok'; status.textContent=`${Number(result.protected || 0)} Anhänge geprüft/geschützt${result.failed ? ` · ${result.failed} fehlgeschlagen` : ''}.`;
  }

  async function addPersonalVolunteer() {
    const name = document.getElementById('accessV122VolunteerName').value.trim();
    const pin = document.getElementById('accessV122VolunteerPin').value.trim();
    const status = document.getElementById('accessV122VolunteerStatus');
    if (!name) { status.className='save-status error'; status.textContent='Bitte einen Namen eingeben.'; return; }
    if (pin.length < 6) { status.className='save-status error'; status.textContent='Die persönliche PIN muss mindestens 6 Zeichen lang sein.'; return; }
    status.className='save-status saving'; status.textContent='Wird angelegt …';
    const result = await secureAccessCall('addPersonalVolunteer', {name, pin, access:volunteerExtraAccess()});
    if (!result.ok) {
      status.className='save-status error';
      status.textContent = result.error === 'unknown_action' || result.error === 'backend'
        ? 'Backend-Update fehlt: AccessControl.gs muss aktiv sein.'
        : (result.message || 'Zugang konnte nicht angelegt werden.');
      return;
    }
    document.getElementById('accessV122VolunteerName').value='';
    document.getElementById('accessV122VolunteerPin').value='';
    status.className='save-status ok'; status.textContent=`${name} hat jetzt einen persönlichen Ehrenamt-Zugang.`;
    await renderAccessManagerV122();
  }

  function teamCardHtml(user, current) {
    const fallback = localProfileFor(user.name);
    const accessRaw = user.access || fallback;
    const access = normalizeTeamAccess(accessRaw, !accessRaw);
    const legacy = !accessRaw;
    return `<div class="access-user" data-access-v122-name="${escapeHtml(user.name || '')}" data-access-v122-type="team">
      <div class="access-user-head"><div>
        <div class="access-user-name">${escapeHtml(user.name || '')}</div>
        <div class="access-user-meta">
          <span class="access-pill">Team</span>
          ${user.admin ? '<span class="access-pill admin">Admin</span>' : ''}
          ${current ? '<span class="access-pill self">Du</span>' : ''}
          ${legacy ? '<span class="access-pill">Bestand · Vollzugriff</span>' : ''}
        </div>
        <div class="access-v122-summary">${escapeHtml(accessSummary(access))}</div>
      </div></div>
      <div class="access-actions">
        <button class="access-action-btn access-v122-edit">Zugriff bearbeiten</button>
        <button class="access-action-btn" data-legacy-action="pin">PIN ändern</button>
        <button class="access-action-btn" data-legacy-action="admin" ${current ? 'disabled' : ''}>${user.admin ? 'Admin-Rechte entziehen' : 'Zu Admin machen'}</button>
        <button class="access-action-btn danger" data-legacy-action="remove" ${current ? 'disabled' : ''}>Zugang entfernen</button>
      </div>
    </div>`;
  }

  function volunteerCardHtml(user) {
    const access = normalizeVolunteerAccess(user.access);
    return `<div class="access-user" data-access-v122-name="${escapeHtml(user.name || '')}" data-access-v122-type="volunteer">
      <div class="access-user-head"><div>
        <div class="access-user-name">${escapeHtml(user.name || '')}</div>
        <div class="access-user-meta"><span class="access-pill">Ehrenamt · persönlich</span></div>
        <div class="access-v122-summary">${escapeHtml(accessSummary({ponywork:{level:'none',contexts:[]},health:'none',stall:'none',ponygroups:access.ponygroups,tasks:'none'}))}</div>
      </div></div>
      <div class="access-actions">
        <button class="access-action-btn access-v122-edit">Zugriff bearbeiten</button>
        <button class="access-action-btn" data-volunteer-action="pin">PIN ändern</button>
        <button class="access-action-btn danger" data-volunteer-action="remove">Persönlichen Zugang entfernen</button>
      </div>
    </div>`;
  }

  async function renderAccessManagerV122() {
    injectVolunteerAdminUi();
    const list = document.getElementById('accessList');
    const volunteerList = document.getElementById('accessV122VolunteerList');
    if (!list || !currentTeamIsAdmin || !getTeamToken()) return;
    list.innerHTML = '<div class="admin-empty">Lade Zugänge …</div>';
    if (volunteerList) volunteerList.innerHTML = '';

    let teamUsers = [];
    let volunteers = [];
    let current = cleanName(currentUserName || getRememberedUserName());
    const secure = await secureAccessCall('listAccessAccounts');
    if (secure.ok) {
      teamUsers = Array.isArray(secure.team) ? secure.team : [];
      volunteers = Array.isArray(secure.volunteers) ? secure.volunteers : [];
      if (secure.currentUser) current = cleanName(secure.currentUser);
    } else {
      const legacy = await adminBackendCall('listTeamUsers');
      if (!legacy.ok) {
        list.innerHTML = '<div class="admin-empty">Zugänge konnten gerade nicht geladen werden.</div>';
        return;
      }
      teamUsers = Array.isArray(legacy.users) ? legacy.users : [];
      if (legacy.currentUser) current = cleanName(legacy.currentUser);
      const status = document.getElementById('accessV122VolunteerStatus');
      if (status) {
        status.className='save-status';
        status.textContent='Persönliche Ehrenamt-Zugänge werden nach dem Backend-Update verfügbar.';
      }
    }

    list.innerHTML = teamUsers.length
      ? teamUsers.map(user => teamCardHtml(user, cleanName(user.name) === current)).join('')
      : '<div class="admin-empty">Noch keine Team-Zugänge eingerichtet.</div>';
    if (volunteerList) volunteerList.innerHTML = volunteers.length
      ? volunteers.map(volunteerCardHtml).join('')
      : '<div class="admin-empty">Noch keine persönlichen Ehrenamt-Zugänge.</div>';

    document.querySelectorAll('[data-access-v122-name] .access-v122-edit').forEach(button => {
      button.onclick = () => {
        const card = button.closest('[data-access-v122-name]');
        const type = card.dataset.accessV122Type;
        const name = card.dataset.accessV122Name;
        const source = type === 'volunteer'
          ? volunteers.find(item => item.name === name)
          : teamUsers.find(item => item.name === name);
        if (source) openEditor({...source, accountType:type, legacyFull:!source.access});
      };
    });

    list.querySelectorAll('[data-legacy-action]').forEach(button => {
      button.onclick = async () => {
        const card = button.closest('[data-access-v122-name]');
        const name = card.dataset.accessV122Name;
        const user = teamUsers.find(item => item.name === name);
        if (!user) return;
        const action = button.dataset.legacyAction;
        if (action === 'pin') {
          const pin = await appPrompt(`Neue persönliche PIN für ${name}`, {title:'PIN ändern', inputType:'password', placeholder:'mindestens 6 Zeichen', confirmText:'PIN ändern'});
          if (pin === null) return;
          if (String(pin).trim().length < 6) { appAlert('Die PIN muss mindestens 6 Zeichen lang sein.'); return; }
          const result = await adminBackendCall('updateTeamUser',{name,pin:String(pin).trim(),admin:!!user.admin,helfiCoordinator:!!user.helfiCoordinator});
          if (!result.ok) appAlert(result.message || 'PIN konnte nicht geändert werden.');
        } else if (action === 'admin') {
          const makeAdmin = !user.admin;
          if (!await appConfirm(`${name} ${makeAdmin ? 'Admin-Rechte geben' : 'Admin-Rechte entziehen'}?`)) return;
          const result = await adminBackendCall('updateTeamUser',{name,pin:'',admin:makeAdmin,helfiCoordinator:!!user.helfiCoordinator});
          if (!result.ok) { appAlert(result.message || 'Admin-Rechte konnten nicht geändert werden.'); return; }
          await renderAccessManagerV122();
        } else if (action === 'remove') {
          if (!await appConfirm(`Team-Zugang von ${name} wirklich entfernen?`)) return;
          const result = await adminBackendCall('removeTeamUser',{name});
          if (!result.ok) { appAlert(result.message || 'Zugang konnte nicht entfernt werden.'); return; }
          await renderAccessManagerV122();
        }
      };
    });

    if (volunteerList) volunteerList.querySelectorAll('[data-volunteer-action]').forEach(button => {
      button.onclick = async () => {
        const card = button.closest('[data-access-v122-name]');
        const name = card.dataset.accessV122Name;
        const action = button.dataset.volunteerAction;
        if (action === 'pin') {
          const pin = await appPrompt(`Neue persönliche PIN für ${name}`, {title:'Ehrenamt-PIN ändern', inputType:'password', placeholder:'mindestens 6 Zeichen', confirmText:'PIN ändern'});
          if (pin === null) return;
          if (String(pin).trim().length < 6) { appAlert('Die PIN muss mindestens 6 Zeichen lang sein.'); return; }
          const result = await secureAccessCall('updatePersonalVolunteerPin',{name,pin:String(pin).trim()});
          if (!result.ok) appAlert(result.message || 'PIN konnte nicht geändert werden.');
        } else if (action === 'remove') {
          if (!await appConfirm(`Persönlichen Ehrenamt-Zugang von ${name} wirklich entfernen? Der gemeinsame Ehrenamt-Code bleibt davon unberührt.`)) return;
          const result = await secureAccessCall('removePersonalVolunteer',{name});
          if (!result.ok) { appAlert(result.message || 'Zugang konnte nicht entfernt werden.'); return; }
          await renderAccessManagerV122();
        }
      };
    });
  }

  async function refreshCurrentAccess() {
    const role = typeof getRole === 'function' ? getRole() : '';
    if (!navigator.onLine) { pruneCache(); applyAccessUi(); return; }
    try {
      if (role === 'pferdeteam' && getTeamToken()) {
        const result = await describeTeamSessionWithBackend();
        if (result && result.valid === true) {
          const auth = getTeamAuth();
          if (auth) {
            if (result.access) auth.access = result.access;
            if (result.accountType) auth.accountType = result.accountType;
            if (result.profileId !== undefined) auth.profileId = result.profileId;
            if (result.accessUpdatedAt !== undefined) auth.accessUpdatedAt = result.accessUpdatedAt;
            localStorage.setItem(TEAM_AUTH_KEY, JSON.stringify(auth));
          }
        }
      } else if (role === 'ehrenamt') {
        const auth = getVolunteerAuth();
        if (auth && auth.token) {
          const result = await volunteerBackendCall('describeVolunteerSession',{teamToken:auth.token});
          if (result && result.valid === true) {
            if (result.access) auth.access = result.access;
            auth.personal = !!result.personal;
            auth.accountType = result.accountType || 'volunteer';
            if (result.profileId !== undefined) auth.profileId = result.profileId;
            if (result.accessUpdatedAt !== undefined) auth.accessUpdatedAt = result.accessUpdatedAt;
            safeLocalStorageSet(VOLUNTEER_AUTH_KEY, JSON.stringify(auth));
          }
        }
      }
    } catch (e) {}
    purgeForeignOfflineSnapshotsV123_();
    pruneCache();
    applyAccessUi();
  }

  function currentAccessOwnerKeyV123_() {
    const role = typeof getRole === 'function' ? getRole() : 'none';
    if (role === 'pferdeteam') {
      const auth = typeof getTeamAuth === 'function' ? getTeamAuth() : null;
      return `team:${auth?.profileId || cleanName(auth?.user || currentUserName || '')}:${Number(auth?.accessUpdatedAt || 0)}`;
    }
    if (role === 'ehrenamt') {
      const auth = typeof getVolunteerAuth === 'function' ? getVolunteerAuth() : null;
      return auth?.personal ? `volunteer:${auth.profileId || cleanName(auth.user || currentUserName || '')}:${Number(auth.accessUpdatedAt || 0)}` : 'volunteer:shared';
    }
    return 'none';
  }
  window.currentAccessOwnerKeyV123_ = currentAccessOwnerKeyV123_;

  if (typeof currentDataScope_ === 'function') {
    currentDataScope_ = function() { return currentAccessOwnerKeyV123_(); };
  }

  function purgeForeignOfflineSnapshotsV123_() {
    try {
      if (typeof OFFLINE_CACHE_PREFIX === 'undefined' || typeof offlineCacheStorageKey_ !== 'function') return;
      const keep = offlineCacheStorageKey_();
      const remove = [];
      for (let i=0;i<localStorage.length;i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(OFFLINE_CACHE_PREFIX + ':') && key !== keep) remove.push(key);
      }
      remove.forEach(key => localStorage.removeItem(key));
    } catch (e) {}
  }

  if (typeof setPendingOps === 'function') {
    const oldSetPendingOpsV123 = setPendingOps;
    setPendingOps = function(ops) {
      const owner = currentAccessOwnerKeyV123_();
      return oldSetPendingOpsV123((ops || []).map(op => op && op.accessOwnerV123 ? op : {...op,accessOwnerV123:owner}));
    };
    try {
      const existing = typeof getPendingOps === 'function' ? getPendingOps() : [];
      if (existing.some(op => !op.accessOwnerV123)) setPendingOps(existing);
    } catch (e) {}
  }

  if (typeof queuePendingBatch_ === 'function') {
    const oldQueuePendingBatchV123 = queuePendingBatch_;
    queuePendingBatch_ = function(entries) {
      const owner = currentAccessOwnerKeyV123_();
      return oldQueuePendingBatchV123((entries || []).map(entry => ({...entry,accessOwnerV123:owner})));
    };
  }

  // Persönliche Gruppenfreigaben gelten auch beim Lesen und für Offline-Kopien.
  if (typeof keyVisibleInCurrentScope_ === 'function') {
    const oldKeyVisible = keyVisibleInCurrentScope_;
    keyVisibleInCurrentScope_ = function(key, value = cache?.[key], source = cache) {
      if (String(key || '').startsWith('ponygroup:') && getRole() === 'ehrenamt') {
        return ponyGroupKeyAllowedForCurrentUser(key, false);
      }
      return oldKeyVisible(key, value, source) && keyAllowedForCurrentUser(key, value, false);
    };
  }

  /* --- Bestehende Funktionen zugriffsbewusst machen --- */
  if (typeof areaAccessAllowed === 'function') {
    const oldAreaAccessAllowed = areaAccessAllowed;
    areaAccessAllowed = function(id) {
      if (id === 'ponygroups') return canArea('ponygroups');
      if (id === 'todos') return canArea('tasks');
      return oldAreaAccessAllowed(id);
    };
  }

  if (typeof applyPersonalNavigation === 'function') {
    const oldApplyPersonalNavigation = applyPersonalNavigation;
    applyPersonalNavigation = function() {
      oldApplyPersonalNavigation();
      const role = getRole();
      const ponys = document.getElementById('mainNavPonys');
      const stall = document.getElementById('mainNavStall');
      const todos = document.getElementById('mainNavTodos');
      const groups = document.getElementById('mainNavPonygroups');
      if (role === 'pferdeteam') {
        if (ponys) ponys.hidden = !canArea('ponys');
        if (stall) stall.hidden = !canArea('stall');
      }
      if (todos) todos.hidden = !canArea('tasks');
      if (groups) {
        if (role === 'ehrenamt' && canArea('ponygroups')) groups.hidden = false;
        else if (!canArea('ponygroups')) groups.hidden = true;
      }
    };
  }

  if (typeof applyRoleRestrictions === 'function') {
    const oldApplyRoleRestrictions = applyRoleRestrictions;
    applyRoleRestrictions = function() {
      oldApplyRoleRestrictions();
      applyAccessUi();
    };
  }

  if (typeof showScreen === 'function') {
    const oldShowScreen = showScreen;
    showScreen = function(id) {
      const restricted = {
        gesundheitDetailScreen:'health',
        infosScreen:'stall',
        ponyInfoScreen:'stall',
        schichtenScreen:'stall',
        todoScreen:'tasks',
        ponyGroupsScreen:'ponygroups'
      };
      if (restricted[id] && !canArea(restricted[id])) {
        if (typeof showActionToast === 'function') showActionToast('Dieser Bereich ist für deinen Zugang nicht freigegeben.');
        return;
      }
      return oldShowScreen(id);
    };
  }

  if (typeof navigateToAppArea === 'function') {
    const oldNavigateToAppArea = navigateToAppArea;
    navigateToAppArea = function(id) {
      const map = {stall:'stall',todos:'tasks',ponygroups:'ponygroups',health:'health',movement:'activities'};
      if (map[id] && !canArea(map[id])) { showActionToast('Dieser Bereich ist für deinen Zugang nicht freigegeben.'); return; }
      return oldNavigateToAppArea(id);
    };
  }

  if (typeof openGesundheitDetail === 'function') {
    const oldOpenHealth = openGesundheitDetail;
    openGesundheitDetail = async function(...args) {
      if (!canArea('health')) { showActionToast('Gesundheit ist für deinen Zugang nicht freigegeben.'); return; }
      return await oldOpenHealth.apply(this,args);
    };
  }

  if (typeof openBewegungDetail === 'function') {
    const oldOpenMovement = openBewegungDetail;
    openBewegungDetail = async function(...args) {
      if (!canArea('activities')) { showActionToast('Aktivitäten sind für deinen Zugang nicht freigegeben.'); return; }
      const result = await oldOpenMovement.apply(this,args);
      applyActivityContextUi();
      return result;
    };
  }

  if (typeof openPonyGroup === 'function') {
    const oldOpenPonyGroup = openPonyGroup;
    openPonyGroup = async function(groupId, rangeOffset = 0, focusDateStr = '') {
      if (!canPonyGroup(groupId, focusDateStr, false)) { showActionToast('Diese Ponygruppe ist für deinen Zugang nicht freigegeben.'); return; }
      return await oldOpenPonyGroup.call(this,groupId,rangeOffset,focusDateStr);
    };
  }

  if (typeof getEntries === 'function') {
    const oldGetEntries = getEntries;
    getEntries = async function(kind, ponyId) {
      let entries = await oldGetEntries(kind,ponyId);
      if (getRole() === 'pferdeteam' && !currentTeamIsAdmin) {
        if (kind === 'gesundheit' && !canArea('health')) return [];
        if (kind === 'belastung') entries = entries.filter(entry => canActivityContext(entry && entry.kontext, false));
      }
      return entries;
    };
  }

  if (typeof addEntry === 'function') {
    const oldAddEntry = addEntry;
    addEntry = async function(kind, ponyId, entry, options = {}) {
      if (getRole() === 'pferdeteam' && !currentTeamIsAdmin) {
        if (kind === 'gesundheit' && !canHealth(true)) { showActionToast('Du darfst Gesundheitsdaten nicht bearbeiten.'); return false; }
        if (kind === 'belastung' && !canActivityContext(entry && entry.kontext, true)) { showActionToast('Dieser Arbeitskontext ist für deinen Zugang nicht freigegeben.'); return false; }
      }
      return await oldAddEntry(kind,ponyId,entry,options);
    };
  }

  if (typeof getTodos === 'function') {
    const oldGetTodos = getTodos;
    getTodos = async function() {
      const items = await oldGetTodos();
      if (getRole() !== 'pferdeteam' || currentTeamIsAdmin) return items;
      const mode = teamAuthAccess().tasks;
      if (mode === 'all') return items;
      if (mode === 'none') return [];
      return items.filter(item => canTasks('view',item));
    };
  }

  if (typeof addTodo === 'function') {
    const oldAddTodo = addTodo;
    addTodo = async function(item, options = {}) {
      if (!canTasks('edit',item)) { showActionToast('Du darfst nur deine eigenen Aufgaben bearbeiten.'); return false; }
      return await oldAddTodo(item,options);
    };
  }

  if (typeof deleteTodo === 'function') {
    const oldDeleteTodo = deleteTodo;
    deleteTodo = async function(itemId) {
      const raw = cache && cache[`todo:${itemId}`];
      let item = null; try { item = raw ? JSON.parse(raw) : null; } catch (e) {}
      if (!canTasks('edit',item)) { showActionToast('Du darfst diese Aufgabe nicht löschen.'); return false; }
      return await oldDeleteTodo(itemId);
    };
  }

  if (typeof pendingOpAllowedForCurrentRole_ === 'function') {
    const oldPendingAllowed = pendingOpAllowedForCurrentRole_;
    pendingOpAllowedForCurrentRole_ = function(op) {
      if (!op || (op.accessOwnerV123 && op.accessOwnerV123 !== currentAccessOwnerKeyV123_())) return false;
      if (op.entryMutationOwner && (typeof entryMutationOwnerMatches_ !== 'function' || !entryMutationOwnerMatches_(op.entryMutationOwner))) return false;
      const writes = Array.isArray(op.atomicWrites) && op.atomicWrites.length ? op.atomicWrites : [op];
      const guards = writes.map(write => ({key:write?.writeOptions?.expectedKey || write?.key, value:write?.writeOptions?.expectedValue}));
      if (Object.prototype.hasOwnProperty.call(op, 'expectedValue')) guards.push({key:op.expectedKey || op.key,value:op.expectedValue});
      if (getRole() === 'ehrenamt' && writes.some(write => String(write?.key || '').startsWith('ponygroup:'))) {
        // Ein persönliches Ehrenamt darf ausschließlich seine freigegebenen
        // operativen Termine übertragen, niemals gemischte oder strukturelle Writes.
        if (!String(op.key || '').startsWith('ponygroup:')) return false;
        if (writes.some(write => !String(write?.key || '').startsWith('ponygroup:') || !ponyGroupKeyAllowedForCurrentUser(write.key, true))) return false;
        if (guards.some(guard => guard.value !== undefined && !ponyGroupKeyAllowedForCurrentUser(guard.key, true))) return false;
        return true;
      }
      if (getRole() === 'pferdeteam' && currentTeamIsRestricted()) {
        if (writes.some(write => !keyAllowedForCurrentUser(write?.key, write?.value, true))) return false;
        if (guards.some(guard => guard.value != null && !keyAllowedForCurrentUser(guard.key, guard.value, true))) return false;
      }
      return oldPendingAllowed(op);
    };
  }

  if (typeof loadAllData === 'function') {
    const oldLoadAllData = loadAllData;
    loadAllData = async function(...args) {
      const result = await oldLoadAllData(...args);
      if (result) { pruneCache(); applyAccessUi(); }
      return result;
    };
  }

  if (typeof globalSearchStaticEntries === 'function') {
    const oldStaticSearch = globalSearchStaticEntries;
    globalSearchStaticEntries = function() {
      return oldStaticSearch().filter(entry => {
        if (entry.target === 'health') return canArea('health');
        if (['pastures','responsibilities','contacts','purchases','shifts','notices'].includes(entry.target)) return getRole() !== 'pferdeteam' || canArea('stall');
        if (entry.target === 'groups') return canArea('ponygroups');
        if (entry.target === 'todos') return canArea('tasks');
        if (entry.target === 'activities') return getRole() !== 'pferdeteam' || canArea('activities');
        return true;
      });
    };
  }

  // Admin-Verwaltung v1.22 übernehmen.
  if (typeof renderAccessManager === 'function') renderAccessManager = renderAccessManagerV122;

  // Neue Team-Accounts starten ohne sensible Freigaben (Least Privilege).
  const addBtn = document.getElementById('accessAddBtn');
  if (addBtn) {
    const existing = addBtn.onclick;
    addBtn.onclick = async function(event) {
      if (existing) await existing.call(this,event);
      // Bei Backend v1.23 wird serverseitig zunächst ein leeres Zugriffsprofil angelegt.
      // Danach vergibt ein Admin bewusst die benötigten Bereiche.
      setTimeout(() => renderAccessManagerV122(), 120);
    };
  }

  const accessManageBtn = document.getElementById('accessManageBtn');
  if (accessManageBtn) {
    const old = accessManageBtn.onclick;
    accessManageBtn.onclick = async function(event) {
      if (old) await old.call(this,event);
      injectVolunteerAdminUi();
      await renderAccessManagerV122();
    };
  }

  // Identitätsanzeige präzisieren.
  if (typeof renderSettingsScreen === 'function') {
    const oldRenderSettings = renderSettingsScreen;
    renderSettingsScreen = function() {
      oldRenderSettings();
      const role = getRole();
      const summary = document.getElementById('identitySummary');
      if (summary && role === 'pferdeteam' && currentTeamIsRestricted()) summary.textContent = `${currentUserName || getRememberedUserName() || 'Unbekannt'} · Team · individueller Zugriff`;
      if (summary && role === 'ehrenamt' && volunteerAuthAccess().personal) summary.textContent = `${currentUserName || getRememberedUserName() || 'Unbekannt'} · Ehrenamt · persönlicher Zugang`;
      applyAccessUi();
    };
  }

  window.StallAccessV122 = {
    version:'1.24.3',
    canArea,
    canPonyGroup,
    canActivityContext,
    currentTeamAccess:teamAuthAccess,
    currentVolunteerAccess:volunteerAuthAccess,
    refresh:refreshCurrentAccess,
    apply:applyAccessUi
  };

  createEditor();
  injectVolunteerAdminUi();
  setTimeout(() => { purgeForeignOfflineSnapshotsV123_(); refreshCurrentAccess(); }, 0);
  window.addEventListener('focus', () => { if (navigator.onLine) refreshCurrentAccess(); });
})();
