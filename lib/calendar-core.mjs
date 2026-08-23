export const MOCK_CALENDARS=[{id:'work',summary:'Arbeit & Pendeln',selected:true},{id:'project',summary:'Project',selected:true},{id:'training',summary:'Training',selected:true},{id:'personal',summary:'Privat',selected:false}];
export const MOCK_EVENTS=[
 {id:'e1',calendarId:'project',title:'Wochenplanung',start:'2026-08-23T11:00:00+02:00',end:'2026-08-23T11:30:00+02:00',kind:'planning'},
 {id:'e2',calendarId:'work',title:'Arbeit + Pendeln',start:'2026-08-24T06:30:00+02:00',end:'2026-08-24T16:00:00+02:00',kind:'work'},
 {id:'e3',calendarId:'training',title:'Krafttraining',start:'2026-08-24T17:00:00+02:00',end:'2026-08-24T18:30:00+02:00',kind:'training'},
 {id:'e4',calendarId:'work',title:'Arbeit + Pendeln',start:'2026-08-26T07:00:00+02:00',end:'2026-08-26T16:30:00+02:00',kind:'work'},
 {id:'e5',calendarId:'training',title:'Training',start:'2026-08-26T17:00:00+02:00',end:'2026-08-26T18:30:00+02:00',kind:'training'},
 {id:'e6',calendarId:'personal',title:'Familienabend',start:'2026-08-28T18:00:00+02:00',end:'2026-08-28T21:00:00+02:00',kind:'relationship'}
];
export function assertBoundedWindow(start,end){const a=new Date(start),b=new Date(end);if(!Number.isFinite(+a)||!Number.isFinite(+b)||b<=a)throw new Error('Ungültiges Zeitfenster');if((+b-+a)>8*864e5)throw new Error('Kalender-Lesezugriff ist auf 8 Tage begrenzt');return {a,b}}
export function readMockEvents({start,end,calendarIds=[]}){const{a,b}=assertBoundedWindow(start,end);return MOCK_EVENTS.filter(e=>new Date(e.start)<b&&new Date(e.end)>a&&(!calendarIds.length||calendarIds.includes(e.calendarId)))}
export function proposeFocusBlocks(events){const trainingDays=new Set(events.filter(e=>e.kind==='training').map(e=>e.start.slice(0,10)));const candidates=[
 {id:'p1',title:'Angebotsseite entwerfen',start:'2026-08-25T17:30:00+02:00',end:'2026-08-25T19:00:00+02:00',calendarId:'project'},
 {id:'p2',title:'Kundensegment validieren',start:'2026-08-27T17:30:00+02:00',end:'2026-08-27T18:30:00+02:00',calendarId:'project'}];
 return candidates.filter(p=>!trainingDays.has(p.start.slice(0,10))).map(p=>({...p,status:'proposal',writesPerformed:false}));
}
export function validateApproval(body){if(!body||body.confirmation!=='APPROVE_CALENDAR_WRITES')throw new Error('Explizite Kalenderfreigabe fehlt');if(!Array.isArray(body.blocks)||body.blocks.length<1||body.blocks.length>3)throw new Error('Freigabe muss 1–3 Fokusblöcke enthalten');return body.blocks}
