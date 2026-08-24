import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
export const calendarScopes=[
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];
export function calendarConfig(){const clientId=process.env.GOOGLE_CLIENT_ID,clientSecret=process.env.GOOGLE_CLIENT_SECRET,appUrl=process.env.APP_URL,authSecret=process.env.AUTH_SECRET;return {configured:Boolean(clientId&&clientSecret&&appUrl&&authSecret),clientId,clientSecret,appUrl,authSecret}}
export function oauthUrl(state:string){const c=calendarConfig();if(!c.configured)throw new Error('Google OAuth ist noch nicht konfiguriert');const q=new URLSearchParams({client_id:c.clientId!,redirect_uri:`${c.appUrl}/api/calendar/callback`,response_type:'code',scope:calendarScopes.join(' '),access_type:'offline',prompt:'consent',include_granted_scopes:'false',state});return `https://accounts.google.com/o/oauth2/v2/auth?${q}`}
export function seal(value:string){const c=calendarConfig();if(!c.authSecret)throw new Error('AUTH_SECRET fehlt');const key=crypto.createHash('sha256').update(c.authSecret).digest(),iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv),data=Buffer.concat([cipher.update(value),cipher.final()]);return [iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),data.toString('base64url')].join('.')}
export function open(value:string){const c=calendarConfig();if(!c.authSecret)throw new Error('AUTH_SECRET fehlt');const[iv,tag,data]=value.split('.');const key=crypto.createHash('sha256').update(c.authSecret).digest(),d=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(iv,'base64url'));d.setAuthTag(Buffer.from(tag,'base64url'));return Buffer.concat([d.update(Buffer.from(data,'base64url')),d.final()]).toString()}
function localTokenPath(){return path.join(process.cwd(),'local-state','google-calendar-token.enc')}
export function storeTokenBundle(value:string){const file=localTokenPath();fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,seal(value),{encoding:'utf8',mode:0o600})}
export function persistTokenCookie(cookie?:string){if(!cookie)throw new Error('Keine Google-Sitzung verfügbar');storeTokenBundle(open(cookie))}
export function hasStoredToken(){return fs.existsSync(localTokenPath())}
function tokenBundle(cookie?:string){try{if(cookie)return JSON.parse(open(cookie));const encrypted=fs.readFileSync(localTokenPath(),'utf8');return JSON.parse(open(encrypted))}catch{return null}}
export function accessToken(cookie?:string){return tokenBundle(cookie)?.access_token||null}
export function tokenScopes(cookie?:string){return String(tokenBundle(cookie)?.scope||'').split(/\s+/).filter(Boolean)}
