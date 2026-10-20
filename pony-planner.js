/* Pony-Pass 1: lokal erzeugte, bearbeitbare Vorschläge. Kein externer KI-Dienst. */
(function (global) {
  'use strict';
  const VERSION = '1.24.2';
  const goals = [
    ['stall-rules','Im Stall',2,'Die wichtigsten Stallregeln kennen.'],
    ['stall-clothes','Im Stall',2,'Schützende Kleidung und Schuhe kennen.'],
    ['stall-equipment','Im Stall',2,'Halfter, Putzzeug und wichtige Sachen finden.'],
    ['stall-tidy','Im Stall',2,'Den Putzplatz ordentlich hinterlassen.'],
    ['stall-clean','Im Stall',2,'Erklären, warum ein sauberer Stall wichtig ist.'],
    ['stall-care','Im Stall',2,'Beim Ausmisten und Versorgen mithelfen.'],
    ['pony-rules','Ich & das Pony',3,'Erklären, warum die Ponyregeln wichtig sind.'],
    ['pony-greet','Ich & das Pony',3,'Ein Pony begrüßen und auf seine Reaktion achten.'],
    ['pony-halter','Ich & das Pony',3,'Mit Unterstützung ein Halfter anlegen und abnehmen.'],
    ['pony-lead','Ich & das Pony',3,'Mit Unterstützung zum Putzplatz führen.'],
    ['pony-knot','Ich & das Pony',3,'Mit Unterstützung mit dem Pferdeknoten anbinden und lösen.'],
    ['pony-brushes','Ich & das Pony',3,'Die wichtigsten Putzsachen benennen und richtig benutzen.'],
    ['pony-groom','Ich & das Pony',3,'Mit Unterstützung sorgfältig putzen.'],
    ['pony-hooves','Ich & das Pony',3,'Mit Unterstützung sicher Hufe auskratzen.'],
    ['pony-ttouch','Ich & das Pony',3,'Drei verschiedene TTouches kennen und üben.'],
    ['know-needs','Wissen über Ponys',4,'Wissen, was ein Pony jeden Tag braucht.'],
    ['know-friends','Wissen über Ponys',4,'Erklären, warum Ponys andere Ponys brauchen.'],
    ['know-feed','Wissen über Ponys',4,'Raufutter, Kraftfutter und Saftfutter unterscheiden.'],
    ['know-our-feed','Wissen über Ponys',4,'Wissen, welches Futter die Hofponys bekommen.'],
    ['know-permission','Wissen über Ponys',4,'Ponys nur nach Absprache füttern.'],
    ['know-relaxed','Wissen über Ponys',4,'Entspannung und Anspannung erkennen.'],
    ['know-body','Wissen über Ponys',4,'Wichtige Körperteile benennen.'],
    ['know-space','Wissen über Ponys',4,'Erkennen, wann ein Pony Abstand oder eine Pause braucht.'],
    ['know-colours','Wissen über Ponys',4,'Fellfarben erkennen.'],
    ['know-markings','Wissen über Ponys',4,'Abzeichen erkennen.'],
    ['check-observe','Pony-Check',5,'Vor dem Kontakt Ohren, Augen, Haltung und Bewegung beobachten.'],
    ['check-communicate','Pony-Check',5,'Beobachten, wie Ponys miteinander kommunizieren.'],
    ['check-distance','Pony-Check',5,'Verstehen, warum Ponys Nähe oder Abstand suchen.'],
    ['move-line','Unterwegs mit dem Pony',8,'Mit Unterstützung eine Lamaleine anbringen.'],
    ['move-stop','Unterwegs mit dem Pony',8,'Mit Unterstützung losgehen und anhalten lassen.'],
    ['move-hold','Unterwegs mit dem Pony',8,'Lamaleine oder Führstrick sicher halten.'],
    ['move-slalom','Unterwegs mit dem Pony',8,'Mit Unterstützung durch einen Slalom führen.'],
    ['move-mount-block','Unterwegs mit dem Pony',8,'Mit Hilfe an der Aufstiegshilfe aufstellen.'],
    ['move-mount','Unterwegs mit dem Pony',8,'Mit Hilfe ponyfreundlich auf- und absteigen.'],
    ['move-balance','Unterwegs mit dem Pony',8,'Im Schritt ruhig und ausbalanciert sitzen.'],
    ['move-reactions','Unterwegs mit dem Pony',8,'Beim Führen und Reiten auf die Reaktionen des Ponys achten.']
  ].map(([id,area,page,text]) => ({id,area,page,text}));
  const goalMap = new Map(goals.map(item => [item.id,item]));
  const topics = [
    {id:'welcome',title:'Sicher ankommen und den Hof kennenlernen',ids:['stall-rules','stall-clothes','stall-equipment','pony-rules'],tags:['Spiel / Theorie','Stallarbeit'],keywords:['stall','regeln','hof','sicherheit'],task:'Hof-Rundgang in Kleingruppen: Kleidung, Wege und Materialplätze entdecken. Die Kinder erklären sich gegenseitig eine Stallregel.',easy:'Jüngere oder neue Kinder suchen mit Bildkarten und einer Begleitperson.',more:'Erfahrenere Kinder begründen Regeln und unterstützen beim Rundgang.',kit:'Pony-Pass, Stifte, Bild- oder Suchkarten'},
    {id:'observe',title:'Pony-Check: Wie geht es dem Pony heute?',ids:['pony-greet','check-observe','check-communicate','check-distance','know-relaxed','know-space'],tags:['Spiel / Theorie','Putzen / Pflege','Stallarbeit'],keywords:['beobacht','körpersprache','ohren','pause','abstand','begrüß'],task:'Zuerst aus Abstand beobachten: Ohren, Augen, Haltung und Bewegung beschreiben. Anschließend unter Anleitung Kontakt aufnehmen; Rückzug und Pausen des Ponys berücksichtigen.',easy:'Zu zweit zwei sichtbare Beobachtungen sammeln, ohne sie sofort zu bewerten.',more:'Beobachtung und Deutung unterscheiden und passende Handlungen begründen.',kit:'Pony-Pass Seite 5, Stifte, Beobachtungskarten'},
    {id:'care',title:'Putzzeug kennen und sorgfältig pflegen',ids:['pony-brushes','pony-groom','stall-tidy'],tags:['Putzen / Pflege','Stallarbeit'],keywords:['putz','pflege','bürst','striegel'],task:'Putzsachen benennen und ihrer Aufgabe zuordnen. Unter Anleitung in kleinen Teams putzen, die Reaktionen des Ponys beobachten und den Platz gemeinsam aufräumen.',easy:'Wenige Putzsachen auswählen und eine Aufgabe mit Begleitung übernehmen.',more:'Eine kleine Pflegestation erklären und auf Reihenfolge und Rücksicht achten.',kit:'Passendes Putzzeug, Pony-Pass, Materialkörbe'},
    {id:'needs',title:'Was braucht ein Pony jeden Tag?',ids:['know-needs','know-friends','know-feed','know-our-feed','know-permission','stall-clean','stall-care'],tags:['Spiel / Theorie','Stallarbeit'],keywords:['futter','heu','wasser','bedürfn','versorgung','ausmist'],task:'Hof-Suche zu Wasser, Raufutter, Ponyfreunden, Bewegung sowie Ruhe und Schutz. Fundstellen auf dem Arbeitsblatt festhalten. Futterarten mit vorbereiteten Beispielen zuordnen; Füttern erfolgt nur nach Absprache.',easy:'Ein Bedürfnis suchen, zeigen und mit einem Bild verbinden.',more:'Zusammenhänge zwischen Versorgung, Stallarbeit und Wohlbefinden erklären.',kit:'Pony-Pass Seite 7, Stifte, vorbereitete Futterbeispiele'},
    {id:'halter',title:'Halfter und Führstrick kennenlernen',ids:['pony-halter','pony-lead','move-hold','move-reactions'],tags:['Bodenarbeit','Stallarbeit'],keywords:['halfter','führstrick','führen','leine'],task:'Zuerst ohne Pony die Handhabung zeigen lassen und üben. Anschließend mit direkter Unterstützung Halfter anlegen und eine kurze Strecke zum Putzplatz führen; auf die Reaktion des Ponys achten.',easy:'Einen einzelnen Schritt mit enger Begleitung wiederholen.',more:'Ablauf in eigenen Worten erklären und ruhige Übergänge üben.',kit:'Passende Halfter und Führstricke, markierter kurzer Weg'},
    {id:'start-stop',title:'Gemeinsam losgehen und anhalten',ids:['move-line','move-stop','move-hold','move-reactions'],tags:['Bodenarbeit','Stallarbeit'],keywords:['anhalten','losgehen','stopp','lamaleine'],task:'Die vereinbarte Strickhaltung und das Anbringen einer Lamaleine unter Anleitung wiederholen. Auf einer übersichtlichen Strecke gemeinsam starten und halten; kurze Durchgänge mit Beobachtungspausen wechseln.',easy:'Eine kurze gerade Strecke mit Start- und Haltepunkt nutzen.',more:'Ruhige Übergänge und das eigene Tempo bewusster abstimmen.',kit:'Passende Ausrüstung, Start-/Haltemarkierungen'},
    {id:'body',title:'Von Kopf bis Huf',ids:['know-body','know-colours','know-markings','pony-groom'],tags:['Spiel / Theorie','Putzen / Pflege','Stallarbeit'],keywords:['körper','fell','abzeichen','farbe','kopf','huf'],task:'Körperteile am Bild und aus sicherem Abstand am Pony zuordnen. Fellfarben und Abzeichen vergleichen und einen Pony-Steckbrief gestalten. Beim Putzen bekannte Körperteile wiederfinden.',easy:'Wenige gut erkennbare Körperteile und eine Fellfarbe zuordnen.',more:'Genau beschreiben und Unterschiede zwischen Ponys festhalten.',kit:'Pony-Pass Seite 6 und Steckbrief, Stifte, Putzzeug'},
    {id:'hooves-knot',title:'Hufe und Pferdeknoten mit Unterstützung',ids:['pony-hooves','pony-knot','stall-tidy'],tags:['Putzen / Pflege','Spiel / Theorie','Stallarbeit'],keywords:['hufe','hufpflege','auskratz','knoten','anbinden'],task:'Pferdeknoten zunächst an einem geeigneten Übungsplatz ohne Pony zeigen lassen und üben. Hufpflege wird von der Leitung demonstriert und nur mit direkter Unterstützung am geeigneten Pony geübt.',easy:'Einen Teilschritt am Übungsstrick wiederholen oder die Demonstration beobachten.',more:'Die Reihenfolge beschreiben und erklären, wann Unterstützung gebraucht wird.',kit:'Übungsstricke, geeigneter Übungsplatz, Hufkratzer'},
    {id:'slalom',title:'Ruhig durch den Slalom führen',ids:['move-slalom','move-stop','move-hold','move-reactions'],tags:['Bodenarbeit','Stallarbeit'],keywords:['slalom','parcours','hütchen','hindernis'],task:'Einen übersichtlichen Hütchenweg zuerst ohne Pony abgehen. Dann mit Unterstützung kurze Slalomstrecken führen, anhalten und auf die Reaktionen des Ponys achten. Rollen und Pausen abwechseln.',easy:'Mit wenigen weit auseinanderstehenden Hütchen und direkter Begleitung beginnen.',more:'Gleichmäßiges Tempo und vorausschauende Wegeführung beobachten.',kit:'Hütchen, Führmaterial, freie übersichtliche Fläche'},
    {id:'balance',title:'Reiten: Ponyfreundlich aufsteigen und Balance finden',ids:['move-mount-block','move-mount','move-balance','move-reactions'],tags:['Reiten','Stallarbeit'],keywords:['reiten','aufsteigen','absteigen','balance','schritt','sitzen'],task:'Mit Hilfe an der Aufstiegshilfe aufstellen und ponyfreundliches Auf- und Absteigen üben. Geeignete Kinder sitzen unter Begleitung im Schritt ruhig und ausbalanciert; die Leitung entscheidet vor Ort über die passende Umsetzung.',easy:'Aufstieg und Sitz zunächst kleinschrittig begleiten; bei Bedarf Bodenübungen nutzen.',more:'Die eigene Balance und die Reaktion des Ponys bewusst beschreiben.',kit:'Geeignetes Pony und Ausrüstung, Reithelm, Aufstiegshilfe'},
    {id:'touch',title:'Ruhige Berührung und Ponyreaktionen',ids:['pony-ttouch','pony-greet','know-space','know-relaxed'],tags:['Putzen / Pflege','Stallarbeit'],keywords:['ttouch','berühr','entspann','tellington'],task:'Die Leitung zeigt die drei im Pony-Pass vorgesehenen TTouches. Unter Anleitung behutsam üben und Reaktionen beobachten. Bei Abstandssignalen innehalten und dem Pony eine Pause ermöglichen.',easy:'Zunächst beobachten und eine gezeigte Berührung begleitet ausprobieren.',more:'Unterschiedliche Reaktionen beschreiben, ohne Wohlbefinden automatisch anzunehmen.',kit:'Pony-Pass, ruhiger geeigneter Platz'},
    {id:'review',title:'Unser Pony-Pass: Wiederholen und zurückblicken',ids:['stall-care','know-needs','move-reactions'],tags:['Spiel / Theorie','Putzen / Pflege','Stallarbeit'],keywords:['wiederhol','rückblick','ponyjahr','abschluss','steckbrief'],task:'Gemeinsam bekannte Stationen auswählen und unter Anleitung wiederholen. Zum Abschluss festhalten: Darauf bin ich stolz, mein schönster Pony-Moment und das möchte ich weiter üben.',easy:'Mit Bildern oder einem kurzen Satz zurückblicken.',more:'Eigene Lernschritte und einen konkreten nächsten Wunsch formulieren.',kit:'Pony-Pass Seite 15, Stifte, Material der gewählten Stationen'}
  ];
  const normalizeText = value => String(value || '').toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss');
  const dateValid = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && !isNaN(new Date(value+'T12:00:00Z').getTime()) && new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
  const cleanIds = value => [...new Set((Array.isArray(value)?value:[]).filter(id=>goalMap.has(id)))];
  const keyFor = (group,date) => `ponygroup:plan:${group}:${date}`;
  function focusPlan(value) {
    const legacy = Array.isArray(value?.phases) ? value.phases : [];
    const phase = legacy.find(item => /^Schwerpunkt:/i.test(String(item?.title || ''))) || legacy[3];
    const {phases, duration, ...rest} = value || {};
    const materials = legacy.length ? String(rest.materials || '').replace(/; passendes Stallwerkzeug für die gemeinsame Versorgung$/, '') : String(rest.materials || '');
    if(legacy.length&&rest.topicId!=='needs'&&Array.isArray(rest.tags))rest.tags=rest.tags.filter(tag=>tag!=='Stallarbeit');
    return {...rest, version:2, focusText:typeof rest.focusText === 'string' ? rest.focusText : String(phase?.text || ''), materials};
  }
  function planFromTopic(topic, group, date, custom='') {
    return {version:2,source:'pony-pass-1',groupId:group,date,ageMin:8,ageMax:14,topicId:topic.id,
      title:custom || topic.title,goalIds:topic.ids.slice(),tags:topic.tags.filter(tag=>tag!=='Stallarbeit'||topic.id==='needs'),materials:topic.kit,
      younger:topic.easy,older:topic.more,ownIdeas:custom,
      focusText:custom ? custom+'\nGemeinsam mit der Leitung eine passende praktische oder theoretische Aufgabe auswählen, in kleinen Teams erproben und anschließend besprechen.' : topic.task};
  }
  // Kalenderwochen halten den Rhythmus auch bei verschobenen oder ausgefallenen Terminen stabil.
  function isRidingDate(date,anchor) {
    if(!dateValid(date)||!dateValid(anchor)||date<anchor)return false;
    const monday=value=>{const day=new Date(value+'T12:00:00Z');return day.getTime()-((day.getUTCDay()+6)%7)*86400000;};
    return Math.round((monday(date)-monday(anchor))/604800000)%2===0;
  }
  function ridingAnchorFrom(plans) {
    return plans.filter(p=>p&&!p._archived&&dateValid(p.ridingAnchor)).slice()
      .sort((a,b)=>(Number(b.updated)||0)-(Number(a.updated)||0)||String(b.date||'').localeCompare(String(a.date||'')))[0]?.ridingAnchor || '';
  }
  function buildPlans({groupId,dates=[],history=[],existing=[],focus='auto',ownIdeas='',ridingAnchor=''}) {
    const validDates=[...new Set(dates.filter(dateValid))].sort();
    const occupied=new Set(existing.filter(p=>p&&p.groupId===groupId).map(p=>p.date));
    const counts=new Map(),topicCounts=new Map();
    for(const session of history) {
      if(!session || session._archived || session.groupId!==groupId || !dateValid(session.date) || session.date>=validDates[0])continue;
      for(const id of cleanIds(session.learningGoalIds))counts.set(id,(counts.get(id)||0)+1);
    }
    for(const plan of existing)if(plan&&plan.groupId===groupId)topicCounts.set(plan.topicId,(topicCounts.get(plan.topicId)||0)+1);
    const recent=history.filter(session=>session&&!session._archived&&session.groupId===groupId&&dateValid(session.date)&&session.date<validDates[0]&&String(session.wishes||'').trim()).slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
    const wishes=String(ownIdeas||recent?.wishes||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const result=[];let wishIndex=0;
    const anchor=dateValid(ridingAnchor)?ridingAnchor:ridingAnchorFrom(existing.filter(p=>p?.groupId===groupId));
    for(const date of validDates) {
      if(occupied.has(date))continue;
      const riding=!!anchor&&isRidingDate(date,anchor);
      const wish=riding?'':wishes[wishIndex++] || '';
      const matching=topics.filter(topic=>topic.keywords.some(word=>normalizeText(wish).includes(normalizeText(word))));
      const requested=topics.find(topic=>topic.id===focus);
      const eligible=anchor?topics.filter(topic=>topic.tags.includes('Reiten')===riding):topics;
      const matchingEligible=matching.filter(topic=>eligible.includes(topic));
      let candidates=requested&&eligible.includes(requested)?[requested]:matchingEligible.length?matchingEligible:eligible;
      const score=topic=>topic.ids.reduce((sum,id)=>sum+(counts.get(id)||0),0)/Math.max(1,topic.ids.length)+5*(topicCounts.get(topic.id)||0);
      candidates=candidates.slice().sort((a,b)=>score(a)-score(b)||topics.indexOf(a)-topics.indexOf(b));
      const topic=candidates[0];
      const plan=planFromTopic(topic,groupId,date,wish);
      if(wish){plan.tags=['Sonstiges'];if(!matching.length&&!requested)plan.goalIds=[];}
      if(anchor)plan.ridingAnchor=anchor;
      plan.ownIdeas=wish;result.push(plan);
      topicCounts.set(topic.id,(topicCounts.get(topic.id)||0)+1);
    }
    return result;
  }
  function normalizePlan(value) {
    if(!value || typeof value!=='object' || !dateValid(value.date) || !String(value.groupId||''))throw Error('Der Schwerpunkt braucht eine gültige Gruppe und ein Datum.');
    const plan=focusPlan(value),title=String(plan.title||'').trim();
    if(!title)throw Error('Bitte den heutigen Schwerpunkt eintragen.');
    return {...plan,title,ageMin:8,ageMax:14,goalIds:cleanIds(plan.goalIds),focusText:String(plan.focusText||''),
      younger:String(plan.younger||''),older:String(plan.older||''),ownIdeas:String(plan.ownIdeas||'')};
  }
  const memory=new Map();let sequence=0;const PREFIX='stallPonyPlannerDraftV1:';
  const owner=()=>typeof global.currentAccessOwnerKeyV123_==='function'?global.currentAccessOwnerKeyV123_():JSON.stringify(pushNotificationOwner_());
  const draftKey=(g,d)=>PREFIX+JSON.stringify([owner(),g,d]);
  function readOptions(g) {
    const key=draftKey(g,'options');
    try {const item=memory.get(key)||JSON.parse(localStorage.getItem(key)||'null');if(item&&item.owner===owner()&&item.at>Date.now()-14*86400000)return item.options||{};}catch(e){}
    return {};
  }
  function keepOptions(g,options) {
    const key=draftKey(g,'options'),item={owner:owner(),at:Date.now(),options};memory.set(key,item);
    if(typeof demoMode!=='undefined'&&demoMode)return;
    try{localStorage.setItem(key,JSON.stringify(item));}catch(e){showActionToast('Die Ideen bleiben sichtbar. Der Gerätespeicher ist voll oder gesperrt.');}
  }
  function readDraft(g,d) {
    const key=draftKey(g,d);if(memory.has(key))return memory.get(key);
    if(typeof demoMode!=='undefined'&&demoMode)return null;
    try {const item=JSON.parse(localStorage.getItem(key)||'null');if(item&&item.owner===owner()&&item.at>Date.now()-14*86400000&&item.plan?.groupId===g&&item.plan?.date===d&&(typeof item.plan.focusText==='string'||Array.isArray(item.plan.phases))&&Array.isArray(item.plan.goalIds)){item.plan=focusPlan(item.plan);memory.set(key,item);return item;}}catch(e){}
    return null;
  }
  function keepDraft(g,d,plan,base) {
    const key=draftKey(g,d),item={owner:owner(),at:Date.now(),plan,base};memory.set(key,item);
    if(typeof demoMode!=='undefined'&&demoMode)return true;
    try {localStorage.setItem(key,JSON.stringify(item));return true;}catch(e){showActionToast('Der Plan bleibt sichtbar. Der Gerätespeicher ist voll oder gesperrt; bitte vor dem Schließen speichern.');return false;}
  }
  function dropDraft(g,d) {const key=draftKey(g,d);memory.delete(key);try{localStorage.removeItem(key);}catch(e){}}
  function permitted(g,d,write=false) {return !!global.StallAccessV122?.canPonyGroup(g,d,write);}
  function currentDate() {return String(ponyGroupFocusDate_ || document.getElementById('ponyGroupDateSelect')?.selectedOptions?.[0]?.dataset.date || '');}
  function parse(raw) {try {return raw?JSON.parse(raw):null;}catch(e){return null;}}
  function storedPlan(g,d) {const item=parse(cache[keyFor(g,d)]);if(!item||item.groupId!==g||item.date!==d||item._archived)return null;try{return normalizePlan(item);}catch(e){return null;}}
  function historyFor(g) {return Object.entries(cache).filter(([key])=>key.startsWith(`ponygroup:${g}:`)).map(([key,raw])=>({...parse(raw),groupId:g,date:key.split(':')[2]}));}
  function visibleDates(g,start,count) {
    return [...document.getElementById('ponyGroupDateSelect').options].map(option=>option.dataset.date).filter(date=>dateValid(date)&&date>=start&&permitted(g,date,false))
      .filter(date=>![...document.querySelectorAll('#ponyGroupAppointments .pony-group-appointment')].some(el=>el.dataset.date===date&&el.classList.contains('cancelled')))
      .filter((date,i,all)=>all.indexOf(date)===i).sort().slice(0,count);
  }
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const label=date=>new Date(date+'T12:00:00').toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
  function renderCard(plan,base,isDraft,write) {
    return `<article class="planner-card" data-plan-date="${esc(plan.date)}" data-plan-base="${esc(JSON.stringify(base))}">
      <header><h3>${esc(label(plan.date))}</h3><span class="planner-state">${isDraft?'Entwurf':getPendingOps().some(op=>(op.atomicWrites||[op]).some(w=>w.key===keyFor(plan.groupId,plan.date)))?'Lokal vorgemerkt':'Gespeicherter Plan'}</span></header><p class="planner-title-preview">${esc(plan.title)}</p><details class="planner-editor" ${plan.date===currentDate()?'open':''}><summary>Plan ansehen & bearbeiten</summary>
      <label>Heutiger Schwerpunkt<input data-plan-field="title" value="${esc(plan.title)}" ${write?'':'disabled'}></label>
      <details class="planner-goals"><summary>Lernziele aus dem Pony-Pass</summary><div>${goals.map(goal=>`<label><input type="checkbox" data-plan-goal="${esc(goal.id)}" ${plan.goalIds.includes(goal.id)?'checked':''} ${write?'':'disabled'}><span>${esc(goal.text)} <small>Seite ${goal.page}</small></span></label>`).join('')}</div></details>
      <label>Ideen zur Umsetzung<textarea data-plan-field="focusText" ${write?'':'disabled'}>${esc(plan.focusText)}</textarea></label>
      <label>Material<textarea data-plan-field="materials" ${write?'':'disabled'}>${esc(plan.materials)}</textarea></label>
      <details><summary>An unterschiedliche Erfahrung anpassen</summary><label>Für jüngere oder neue Kinder<textarea data-plan-field="younger" ${write?'':'disabled'}>${esc(plan.younger)}</textarea></label><label>Für erfahrenere Kinder<textarea data-plan-field="older" ${write?'':'disabled'}>${esc(plan.older)}</textarea></label></details>
      <div class="planner-actions"><button type="button" class="submit-btn" data-plan-save ${write?'':'disabled'}>Plan speichern</button><button type="button" class="secondary-btn" data-plan-document ${write?'':'disabled'}>Inhalte vorbereiten</button><button type="button" class="secondary-btn" data-plan-new ${write?'':'disabled'}>Neuer Vorschlag</button><button type="button" class="secondary-btn" data-plan-reset ${write?'':'disabled'}>Gespeicherten Stand laden</button></div>
      <p class="save-status" data-plan-status role="status">${isDraft?'Entwurf auf diesem Gerät. Noch nicht für das Team gespeichert.':'Nach der Stunde in „Inhalte & Ponys“ dokumentieren, was tatsächlich stattgefunden hat.'}</p></details>
    </article>`;
  }
  function readCard(card) {
    const g=card.dataset.planGroup || activePonyGroupId,d=card.dataset.planDate;
    const draft=readDraft(g,d),original=draft?.plan || storedPlan(g,d);
    if(!original)throw Error('Bitte den Plan erneut öffnen.');
    const result={...original};
    card.querySelectorAll('[data-plan-field]').forEach(el=>result[el.dataset.planField]=el.value);
    result.goalIds=[...card.querySelectorAll('[data-plan-goal]:checked')].map(el=>el.dataset.planGoal);
    return result;
  }
  async function queuePlans(entries, reviewed=false) {
    const prepared=entries.map(entry=>({...entry}));
    for(const entry of prepared) {
      const pending=getPendingOps().find(op=>op.key===entry.key);
      if(pending&&!pendingOpAllowedForCurrentRole_(pending)){showActionToast('Für diesen Termin sind noch Änderungen eines anderen Zugangs vorgemerkt.');return false;}
      if(pending&&!reviewed&&Object.prototype.hasOwnProperty.call(pending,'expectedValue')) {
        const known=[pending.value,pending.expectedValue,...(pending.queuePredecessorValues?.[entry.key]||[])];
        if(!known.includes(entry.expectedValue)){showActionToast('Dieser Plan hat noch einen anderen Entwurf. Bitte zuerst die Stände vergleichen.');return false;}
        entry.expectedValue=pending.expectedValue;
      }
      entry.entryCreate=entry.expectedValue===null;
    }
    return storageSetAtomicMany_(prepared);
  }
  function savedPlansFor(g) {
    return Object.entries(cache).filter(([key])=>key.startsWith(`ponygroup:plan:${g}:`)).map(([,raw])=>parse(raw)).filter(plan=>plan&&plan.groupId===g&&!plan._archived);
  }
  async function render() {
    const g=activePonyGroupId,d=currentDate(),container=document.getElementById('ponyGroupPlanningView');
    if(!g||!dateValid(d)||!container)return;
    const request=++sequence,currentOwner=owner();
    if(!permitted(g,d,false)){container.innerHTML='<p class="planner-empty">Für diesen Termin ist keine Planung freigegeben.</p>';return;}
    const dates=visibleDates(g,d,8),entries=[];
    for(const day of dates){const draft=readDraft(g,day),saved=storedPlan(g,day);if(draft?.plan||saved)entries.push({plan:draft?.plan||saved,base:draft?draft.base:cache[keyFor(g,day)]??null,draft:!!draft});}
    if(request!==sequence||currentOwner!==owner())return;
    container.innerHTML=`<div class="planner-intro"><h2>Heutigen Schwerpunkt planen</h2><p>Für 8–14-Jährige</p><p>Vorschläge aus dem Pony-Pass 1. Geübte Lernziele aus früheren Stunden und eure eigenen Ideen fließen ein.</p></div>
      <div class="planner-controls"><label>Vorschläge für<select id="ponyPlannerCount"><option value="1">Den gewählten Termin</option><option value="4">Die nächsten 4 Termine</option><option value="8">Die nächsten 8 Termine</option></select></label>
      <label>Schwerpunkt<select id="ponyPlannerFocus"><option value="auto">Passend zu bisherigen Lernzielen</option>${topics.map(t=>`<option value="${t.id}">${esc(t.title)}</option>`).join('')}</select></label>
      <label>Erster Reittermin dieser Gruppe<input type="date" id="ponyPlannerRidingStart" required ${permitted(g,d,true)?'':'disabled'}></label><p class="detail-sub">Ab diesem Termin ist alle 14 Tage Reiten vorgesehen. Dazwischen werden andere Schwerpunkte vorgeschlagen. Ferien und Absagen verschieben den Rhythmus nicht. Der Start wird mit den neuen Plänen fürs Team gespeichert; vorhandene Pläne bleiben erhalten.</p>
      <label class="planner-wide">Eigene Inhalte / Wünsche<textarea id="ponyPlannerIdeas" placeholder="Eine Idee pro Zeile, zum Beispiel: Hufe kennenlernen oder Slalom wiederholen"></textarea></label>
      <button type="button" class="submit-btn" id="ponyPlannerGenerate" ${permitted(g,d,true)?'':'disabled'}>Vorschläge erstellen</button><p class="detail-sub">Es werden die geladenen, nicht abgesagten Termine ab dem gewählten Datum verwendet. Vorhandene Pläne bleiben erhalten. Vorschläge könnt ihr vor dem Speichern anpassen.</p></div>
      <p role="status" id="ponyPlannerMessage"></p><div id="ponyPlannerCards">${entries.length?entries.map(item=>renderCard(item.plan,item.base,item.draft,permitted(g,item.plan.date,true))).join(''):'<p class="planner-empty">Für diesen Zeitraum gibt es noch keinen Plan. Erstelle einen Vorschlag für den gewählten Termin oder eine Stundenreihe.</p>'}</div>`;
    container.dataset.owner=currentOwner;container.dataset.groupId=g;
    const options=readOptions(g);
    const countInput=document.getElementById('ponyPlannerCount'),focusInput=document.getElementById('ponyPlannerFocus'),ideasInput=document.getElementById('ponyPlannerIdeas'),ridingInput=document.getElementById('ponyPlannerRidingStart');
    const sharedAnchor=ridingAnchorFrom(savedPlansFor(g));
    ridingInput.value=dateValid(options.ridingAnchor)&&(!sharedAnchor||options.ridingAnchor===sharedAnchor||options.sharedAnchor===sharedAnchor)?options.ridingAnchor:sharedAnchor||d;
    countInput.value=['1','4','8'].includes(String(options.count))?String(options.count):'1';
    focusInput.value=topics.some(topic=>topic.id===options.focus)?options.focus:'auto';ideasInput.value=String(options.ownIdeas||'');
    const keep=()=>{if(container.dataset.owner===owner()&&activePonyGroupId===g)keepOptions(g,{count:countInput.value,focus:focusInput.value,ownIdeas:ideasInput.value,ridingAnchor:ridingInput.value,sharedAnchor:ridingAnchorFrom(savedPlansFor(g))});};
    for(const input of [countInput,focusInput,ideasInput,ridingInput]){input.addEventListener('input',keep);input.addEventListener('change',keep);}
    document.getElementById('ponyPlannerGenerate').onclick=async()=>{
      if(container.dataset.owner!==owner()||activePonyGroupId!==g)return;
      keep();
      const count=Number(document.getElementById('ponyPlannerCount').value),focus=document.getElementById('ponyPlannerFocus').value,ideas=document.getElementById('ponyPlannerIdeas').value;
      if(!dateValid(ridingInput.value)){document.getElementById('ponyPlannerMessage').textContent='Bitte den ersten Reittermin dieser Gruppe wählen.';return;}
      const selected=visibleDates(g,d,count).filter(day=>permitted(g,day,true));
      const selectedPlans=selected.map(day=>readDraft(g,day)?.plan||storedPlan(g,day)).filter(Boolean);
      const existing=[...savedPlansFor(g).filter(plan=>!selectedPlans.some(p=>p.date===plan.date)),...selectedPlans];
      const made=buildPlans({groupId:g,dates:selected,history:historyFor(g),existing,focus,ownIdeas:ideas,ridingAnchor:ridingInput.value});
      for(const plan of made)keepDraft(g,plan.date,plan,cache[keyFor(g,plan.date)]??null);
      await render();
      const msg=document.getElementById('ponyPlannerMessage');if(msg)msg.textContent=made.length?`${made.length} Vorschlag${made.length===1?'':'e'} als Entwurf erstellt. Vor dem Speichern gemeinsam prüfen und anpassen.`:'Für die gewählten Termine sind bereits Pläne vorhanden. Du kannst sie unten bearbeiten oder einen späteren Termin wählen.';
    };
    container.querySelectorAll('[data-plan-date]').forEach(card=>{
      card.dataset.planGroup=g;
      const validOwner=()=>container.dataset.owner===owner()&&activePonyGroupId===g&&permitted(g,card.dataset.planDate,true);
      card.addEventListener('input',()=>{if(!validOwner())return;const plan=readCard(card);keepDraft(g,plan.date,plan,JSON.parse(card.dataset.planBase));
        card.querySelector('[data-plan-status]').textContent='Änderung als Entwurf auf diesem Gerät gesichert.';});
      card.querySelector('[data-plan-save]').onclick=async()=>{
        if(!validOwner())return;
        let plan;try{plan=normalizePlan(readCard(card));}catch(e){card.querySelector('[data-plan-status]').textContent=e.message;return;}
        const savingOwner=owner();
        const inputSnapshot=JSON.stringify(readCard(card)),btn=card.querySelector('[data-plan-save]');btn.disabled=true;
        const key=keyFor(g,plan.date),value=JSON.stringify({...plan,updated:Date.now(),by:currentUserName||getRememberedUserName()||''});
        const base=JSON.parse(card.dataset.planBase);
        const ok=await queuePlans([{key,value,expectedKey:key,expectedValue:base,entryCreate:base===null,ponyGroupPlanner:true,entryMutationOwner:pushNotificationOwner_()}]);
        if(savingOwner!==owner()||activePonyGroupId!==g)return;
        btn.disabled=false;if(!ok){card.querySelector('[data-plan-status]').textContent='Noch nicht gespeichert. Dein Entwurf bleibt erhalten.';return;}
        card.dataset.planBase=JSON.stringify(value);
        if(JSON.stringify(readCard(card))!==inputSnapshot){keepDraft(g,plan.date,readCard(card),value);card.querySelector('[data-plan-status]').textContent='Stand vorgemerkt; neuere Eingaben bleiben als Entwurf erhalten.';return;}
        dropDraft(g,plan.date);card.querySelector('[data-plan-status]').textContent='Plan lokal vorgemerkt; Übertragung wird im Verbindungsstatus angezeigt.';card.querySelector('.planner-state').textContent='Lokal vorgemerkt';
        installGoalControls();
      };
      card.querySelector('[data-plan-new]').onclick=async()=>{
        const previousOwner=owner();
        if(!validOwner()||!await appConfirm('Den sichtbaren Entwurf durch einen neuen Vorschlag ersetzen? Der gespeicherte Plan bleibt bis zum nächsten Speichern erhalten.')||previousOwner!==owner()||!validOwner())return;
        const focus=document.getElementById('ponyPlannerFocus').value,ownIdeas=document.getElementById('ponyPlannerIdeas').value;
        if(!dateValid(ridingInput.value)){document.getElementById('ponyPlannerMessage').textContent='Bitte den ersten Reittermin dieser Gruppe wählen.';return;}
        const others=Object.entries(cache).filter(([key])=>key.startsWith(`ponygroup:plan:${g}:`)&&key!==keyFor(g,card.dataset.planDate)).map(([,raw])=>parse(raw)).filter(Boolean);
        const plan=buildPlans({groupId:g,dates:[card.dataset.planDate],history:historyFor(g),existing:others,focus,ownIdeas,ridingAnchor:ridingInput.value})[0];
        if(plan){keepDraft(g,plan.date,plan,JSON.parse(card.dataset.planBase));await render();}
      };
      card.querySelector('[data-plan-reset]').onclick=async()=>{const previousOwner=owner();if(!validOwner()||!await appConfirm('Den Entwurf verwerfen und den zuletzt gespeicherten beziehungsweise vorgemerkten Stand laden?')||previousOwner!==owner()||!validOwner())return;dropDraft(g,card.dataset.planDate);await render();};
      card.querySelector('[data-plan-document]').onclick=async()=>{
        if(!validOwner())return;
        const previousOwner=owner(),plan=readCard(card);
        await openPonyGroupAppointment_(g,plan.date);
        if(previousOwner!==owner()||!validOwner())return;
        const wrapper=[...document.querySelectorAll('#ponyGroupAppointments .pony-group-appointment')].find(el=>el.dataset.date===plan.date);
        const area=wrapper?.querySelector('.pony-group-content-textarea');if(!area)return;
        if(area.value.trim()&&!await appConfirm('Die aktuelle Inhaltsnotiz durch eine Vorlage aus diesem Plan ersetzen?'))return;
        if(previousOwner!==owner()||!validOwner())return;
        area.value=[plan.title,plan.focusText].filter(Boolean).join('\n');
        wrapper.querySelectorAll('.pony-group-content-tag').forEach(chip=>chip.classList.toggle('selected',plan.tags.includes(chip.dataset.tag)));
        area.dispatchEvent(new Event('input',{bubbles:true}));installGoalControls();
        showActionToast('Vorlage übernommen. An das tatsächlich Durchgeführte anpassen, geübte Ziele markieren und dann speichern.');
      };
    });
  }
  function installGoalControls() {
    const g=activePonyGroupId;if(!g)return;
    document.querySelectorAll('#ponyGroupAppointments .pony-group-appointment').forEach(wrapper=>{
      const date=wrapper.dataset.date;if(!permitted(g,date,false))return;
      const place=wrapper.querySelector('.pony-group-content-workflow');if(!place)return;
      let box=place.querySelector('[data-pony-practice]');
      const existing=parse(cache[`ponygroup:${g}:${date}`]);
      const draft=typeof getPonyGroupEditorDraft_==='function'?getPonyGroupEditorDraft_(g,date):null;
      const selected=box?[...box.querySelectorAll('[data-practiced-goal]:checked')].map(el=>el.dataset.practicedGoal):cleanIds(draft?.learningGoalIds||existing?.learningGoalIds);
      const plan=readDraft(g,date)?.plan||storedPlan(g,date),featured=new Set([...(plan?.goalIds||[]),...selected]);
      if(!box){box=document.createElement('details');box.dataset.ponyPractice='';box.className='planner-practice';place.appendChild(box);}
      const item=goal=>`<label><input type="checkbox" data-practiced-goal="${goal.id}" ${selected.includes(goal.id)?'checked':''} ${permitted(g,date,true)?'':'disabled'}><span>${esc(goal.text)}</span></label>`;
      box.innerHTML='<summary>Pony-Pass: Was habt ihr tatsächlich geübt?</summary><p>Nur durchgeführte Ziele markieren. Das hilft bei den nächsten Vorschlägen; es ist keine automatische Bewertung einzelner Kinder.</p>'+goals.filter(goal=>featured.has(goal.id)).map(item).join('')+'<details><summary>Weitere Lernziele auswählen</summary>'+goals.filter(goal=>!featured.has(goal.id)).map(item).join('')+'</details>';
      box.querySelectorAll('[data-practiced-goal]').forEach(input=>input.onchange=()=>wrapper.querySelector('.pony-group-content-textarea').dispatchEvent(new Event('input',{bubbles:true})));
    });
  }
  function practicedGoals(g,d) {
    if(activePonyGroupId!==g)return null;
    const wrapper=[...document.querySelectorAll('#ponyGroupAppointments .pony-group-appointment')].find(el=>el.dataset.date===d);
    if(!wrapper?.querySelector('[data-pony-practice]'))return null;
    return cleanIds([...wrapper.querySelectorAll('[data-practiced-goal]:checked')].map(el=>el.dataset.practicedGoal));
  }
  async function resolve(opId) {
    const op=getPendingOps().find(item=>item.opId===opId&&item.ponyGroupPlanner&&pendingOpAllowedForCurrentRole_(item));if(!op)return;
    if(!navigator.onLine){showActionToast('Für den Vergleich bitte eine Verbindung herstellen.');return;}
    const resolvingOwner=owner();
    try {
      const data=await readServerDataForEdit_(),writes=op.atomicWrites||[op];
      if(resolvingOwner!==owner())return;
      const text=raw=>{const original=parse(raw),p=original?focusPlan(original):null;return p?[p.title,'Lernziele: '+cleanIds(p.goalIds).map(id=>goalMap.get(id).text).join('; '),p.focusText,'Material: '+(p.materials||''),'Jüngere / neue Kinder: '+(p.younger||''),'Erfahrenere Kinder: '+(p.older||'')].join('\n\n'):'Kein gespeicherter Plan';};
      const approved=await appConfirm(writes.map(w=>'Aktueller Stand:\n'+text(data[w.key])+'\n\nDein Stand:\n'+text(w.value)).join('\n\n'),{title:'Planänderungen vergleichen',confirmText:'Meinen Stand übernehmen',cancelText:'Entwurf behalten'});
      if(!approved||resolvingOwner!==owner()||!getPendingOps().some(item=>item.opId===opId&&pendingOpAllowedForCurrentRole_(item)))return;
      const ok=await queuePlans(writes.map(w=>({key:w.key,value:w.value,expectedKey:w.key,expectedValue:data[w.key]??null,entryCreate:data[w.key]==null,ponyGroupPlanner:true,entryMutationOwner:pushNotificationOwner_()})),true);
      if(ok)showActionToast('Der gewählte Planstand ist zur Synchronisierung vorgemerkt.');
    } catch(e){showActionToast('Der Vergleich ist gerade nicht möglich. Dein Plan bleibt erhalten.');}
  }
  global.StallPonyPlanner={version:VERSION,goals,topics,isRidingDate,ridingAnchorFrom,buildPlans,normalizePlan,focusPlan,keyFor,dateValid,queuePlans,render,installGoalControls,practicedGoals,resolve};
  if(typeof updateConnectionBanner==='function') {
    const previous=updateConnectionBanner;
    updateConnectionBanner=function(){previous();const el=document.getElementById('connectionBanner'),op=getPendingOps().find(item=>item.ponyGroupPlanner&&item.syncError&&pendingOpAllowedForCurrentRole_(item));if(!el||!op)return;
      const button=document.createElement('button');button.type='button';button.className='secondary-btn pony-group-conflict-review';button.textContent='Planänderungen vergleichen';button.onclick=()=>resolve(op.opId);el.appendChild(button);};
  }
})(window);
