/* 漫步勇者 · Supabase 雲端存檔與帳號（遊客＝匿名登入，綁定信箱後拿到玩家編號） */
'use strict';
/* SB_KEY 是公開的 anon key，可以放前端；絕對不要放 service_role key */
/* ================= cloud save (Supabase) ================= */
const SB_URL='https://eugkdfhkoaxvqhztvptc.supabase.co',SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Z2tkZmhrb2F4dnFoenR2cHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMTQ4MTksImV4cCI6MjEwNzg5MDgxOX0.2-ExM_i01y2BErjIvrfvPVeSsIHP73-6nz2wKHOaLK4';
const CLOUD={sb:null,uid:null,anon:true,email:null,no:null,pending:null,status:'連線中…',busy:false,dirty:false};
const playerTag=()=>CLOUD.no?'#'+String(CLOUD.no).padStart(6,'0'):'(遊客)';
/* 記下目前登入的帳號；正式帳號順便領取（或查回）玩家編號 */
async function cloudUser(user){CLOUD.uid=user.id;CLOUD.anon=!!user.is_anonymous;CLOUD.email=CLOUD.anon?null:user.email;CLOUD.no=null;
  if(!CLOUD.anon){const {data,error}=await CLOUD.sb.rpc('claim_player_no');if(!error&&data)CLOUD.no=data}
  if(typeof socialOnUser==='function')socialOnUser()}
async function cloudFetch(){const {data,error}=await CLOUD.sb.from('saves').select('data').eq('user_id',CLOUD.uid).maybeSingle();if(error)throw error;return data?data.data:null}
async function cloudInit(){try{if(!window.supabase){CLOUD.status='無法載入雲端模組，存檔只在這台裝置';return null}
  CLOUD.sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,...(SLOT?{storageKey:'wayfarer-auth-p'+SLOT}:{})}});
  let {data:{session}}=await CLOUD.sb.auth.getSession();
  if(!session){const r=await CLOUD.sb.auth.signInAnonymously();if(r.error){CLOUD.status='無法登入雲端：'+r.error.message;return null}session=r.data.session}
  await cloudUser(session.user);let save;try{save=await cloudFetch()}catch(e){CLOUD.status='讀取雲端存檔失敗：'+e.message;return null}
  CLOUD.status='已連線雲端';return save}catch(e){CLOUD.status='雲端連線失敗';return null}}
async function cloudPush(){if(!CLOUD.uid||CLOUD.busy||!S)return;CLOUD.busy=true;CLOUD.dirty=false;try{const {error}=await CLOUD.sb.from('saves').upsert({user_id:CLOUD.uid,data:S,game_version:VER,updated_at:new Date().toISOString()});
  const t=new Date();CLOUD.status=error?'同步失敗：'+error.message:`已同步 ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;if(error)CLOUD.dirty=true;else profileSync()}catch(e){CLOUD.status='同步失敗，稍後重試';CLOUD.dirty=true}CLOUD.busy=false}
setInterval(()=>{if(CLOUD.dirty&&!B)cloudPush()},15000);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&CLOUD.dirty)cloudPush()});

/* ================= accounts ================= */
const AUTH_ERR={'Invalid login credentials':'信箱或密碼錯誤','Email not confirmed':'這個信箱還沒完成驗證，請先點確認信裡的連結','User already registered':'這個信箱已經註冊過，請改用登入'};
const authMsg=e=>AUTH_ERR[e.message]||e.message;
/* 註冊：遊客進度會跟著搬到新帳號。需要驗證信時先回傳 'confirm' */
async function authRegister(email,password){if(!CLOUD.sb)throw new Error('雲端尚未連線');
  const {data,error}=await CLOUD.sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw new Error(authMsg(error));
  if(data.user&&data.user.identities&&!data.user.identities.length)throw new Error(AUTH_ERR['User already registered']);
  if(!data.session){CLOUD.pending=email;return'confirm'}
  CLOUD.pending=null;await cloudUser(data.session.user);CLOUD.dirty=true;await cloudPush();return'ok'}
/* 登入：改用該帳號的雲端存檔；帳號還沒有存檔就把目前進度存上去 */
async function authLogin(email,password){if(!CLOUD.sb)throw new Error('雲端尚未連線');
  const {data,error}=await CLOUD.sb.auth.signInWithPassword({email,password});if(error)throw new Error(authMsg(error));
  CLOUD.pending=null;await cloudUser(data.user);const remote=await cloudFetch();
  if(remote){S=migrate(remote);delete S.intro;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}rebuildWorld();return'loaded'}
  CLOUD.dirty=true;await cloudPush();return'uploaded'}
/* 登出：先把進度存上去，這台裝置改回全新的遊客 */
async function authLogout(){if(CLOUD.dirty)await cloudPush();await CLOUD.sb.auth.signOut();const r=await CLOUD.sb.auth.signInAnonymously();if(r.error)throw new Error(r.error.message);await cloudUser(r.data.user)}
