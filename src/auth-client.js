import { createAuthClient } from '@neondatabase/auth';

const auth = createAuthClient(new URL('/api/auth',window.location.origin).toString());
const $ = id => document.getElementById(id);
const accountState = $('accountState');
const accountNotice = $('accountNotice');
const onlineStatus = $('onlineStatus');
let currentUser = null;
let signup = false;
let roundRequest = null;
let roundInfo = null;

function text(el, value) { if (el) el.textContent = value; }
function notify(type, message) {
  if (!accountNotice) return;
  accountNotice.hidden = false;
  accountNotice.dataset.type = type;
  accountNotice.setAttribute('role', type === 'error' ? 'alert' : 'status');
  text(accountNotice, message);
}
function clearNotice() {
  if (accountNotice) { accountNotice.hidden = true; accountNotice.textContent = ''; accountNotice.removeAttribute('data-type'); }
}
function friendlyError(err) {
  const raw = String(err?.message || err || 'Erro desconhecido.');
  if (/invalid.origin|origin.not.allowed|untrusted.origin|trusted.origin/i.test(raw)) return 'Este endereço ainda não está autorizado para login. Acesse https://lista-jogo-web.vercel.app e tente novamente.';
  if (/invalid email or password|invalid credentials|invalid password|invalid_email_or_password/i.test(raw)) return 'E-mail ou senha incorretos. Confira os dados e tente novamente.';
  if (/already exists|already registered|user already|email.*taken|email.*in.use/i.test(raw)) return 'Este e-mail já está cadastrado. Entre na conta ou use outro e-mail.';
  if (/password.*(short|length|least|characters)|too_short/i.test(raw)) return 'A senha não atende aos requisitos de segurança. Use ao menos 8 caracteres.';
  if (/too many|rate.limit|429/i.test(raw)) return 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.';
  if (/failed to fetch|networkerror|network request failed/i.test(raw)) return 'Não foi possível acessar o serviço. Verifique sua conexão e tente novamente.';
  return raw.length > 200 ? 'Não foi possível concluir esta ação. Tente novamente.' : raw;
}
function unwrap(result) {
  if (result?.error) throw new Error(result.error.message || 'Falha no serviço de autenticação.');
  return result?.data ?? result;
}
async function getUser() {
  const result = unwrap(await auth.getSession());
  currentUser = result?.user || null;
  return currentUser;
}
async function api(path,method='GET',body=null){
 const response=await fetch('/api/'+path,{method,headers:{'Content-Type':'application/json'},body:body===null?undefined:JSON.stringify(body),credentials:'same-origin',cache:'no-store'});
 const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'HTTP '+response.status);return data;
}
function viewFields(mode) {
  const nicknameOnly = mode === 'nickname';
  const newAccount = mode === 'signup';
  const nick = $('accountNick'), email = $('accountEmail'), pass = $('accountPass');
  nick.parentElement.hidden = !(newAccount || nicknameOnly);
  email.parentElement.hidden = nicknameOnly;
  pass.parentElement.hidden = nicknameOnly;
  nick.required = newAccount || nicknameOnly;
  email.required = !nicknameOnly;
  pass.required = !nicknameOnly;
  pass.autocomplete = newAccount ? 'new-password' : 'current-password';
  pass.minLength = newAccount ? 8 : 6;
  $('accountToggle').hidden = nicknameOnly;
  $('accountSubmit').textContent = nicknameOnly ? 'Salvar apelido' : newAccount ? 'Criar conta' : 'Entrar';
  $('accountToggle').textContent = newAccount ? 'Já tenho conta' : 'Criar conta';
  $('accountForm').dataset.mode = mode;
}
function showTab(name) {
  $('onlineLeaderboard').hidden = name !== 'leaderboard';
  $('onlineAccount').hidden = name !== 'account';
  $('onlineLeaderboardTab').classList.toggle('active', name === 'leaderboard');
  $('onlineAccountTab').classList.toggle('active', name === 'account');
  if (name === 'leaderboard') leaderboard(); else refreshAccount();
}
function open(name) {
  if (!$('onlineDialog').open) $('onlineDialog').showModal();
  showTab(name);
}
for (const id of ['onlineBtn', 'rankCall', 'rankView']) $(id)?.addEventListener('click', () => open('leaderboard'));
$('onlineClose').addEventListener('click', () => $('onlineDialog').close());
$('onlineDialog').addEventListener('click', e => { if (e.target === $('onlineDialog')) $('onlineDialog').close(); });
$('onlineLeaderboardTab').addEventListener('click', () => showTab('leaderboard'));
$('onlineAccountTab').addEventListener('click', () => showTab('account'));
viewFields('login');
$('accountToggle').addEventListener('click', () => {
  signup = !signup;
  viewFields(signup ? 'signup' : 'login');
  clearNotice();
  text(accountState, signup ? 'Cadastre e-mail, senha e um apelido público.' : 'Entre com seu e-mail e senha.');
});

async function refreshAccount() {
  try {
    await getUser();
    $('accountForm').hidden = Boolean(currentUser);
    $('accountLogout').hidden = !currentUser;
    if (!currentUser) {
      viewFields(signup ? 'signup' : 'login');
      text(accountState, 'Entre ou cadastre-se para participar do ranking mundial.');window.dispatchEvent(new Event('lista:account'));
      return false;
    }
    const data = await api('profile', 'GET', null, true);
    if (data.profile) {
      $('accountForm').hidden = true;
      text(accountState, `Conectado como ${data.profile.nickname}. Sprint e Turbo valem para o ranking.`);
    } else {
      viewFields('nickname');
      $('accountForm').hidden = false;
      text(accountState, 'Conta autenticada! Falta apenas escolher seu apelido público.');
    }
    window.dispatchEvent(new Event('lista:account'));
    return true;
  } catch (err) {
    text(accountState, 'Não foi possível atualizar sua conta.');
    notify('error', 'Não foi possível verificar a sessão: ' + friendlyError(err));
    window.dispatchEvent(new Event('lista:account'));return false;
  }
}

$('accountForm').addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('accountSubmit');
  if (button.disabled) return;
  button.disabled = true;
  const mode = $('accountForm').dataset.mode;
  const label = button.textContent;
  button.textContent = 'Aguarde…';
  clearNotice();
  try {
    const email = $('accountEmail').value.trim();
    const password = $('accountPass').value;
    const nickname = $('accountNick').value.trim();
    if (mode === 'nickname') {
      await api('profile', 'POST', { nickname }, true);
      await refreshAccount();
      notify('success', `Apelido ${nickname} salvo! Você já pode disputar o ranking.`);
    } else if (mode === 'signup') {
      if (!/^[A-Za-z0-9_]{3,20}$/.test(nickname)) throw new Error('Use um apelido de 3 a 20 caracteres (letras, números e _).');
      if (password.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');
      unwrap(await auth.signUp.email({ email, password, name: nickname }));
      $('accountPass').value = '';
      try {
        await getUser();
        if (currentUser) await api('profile', 'POST', { nickname }, true);
      } catch (profileErr) {
        // A conta foi criada; preservar essa informação quando a sessão/perfil ainda não estiver pronto.
        notify('info', 'Cadastro enviado! Sua conta foi criada, mas ainda falta finalizar o perfil: ' + friendlyError(profileErr));
        return;
      }
      if (currentUser) {
        await refreshAccount();
        notify('success', 'Conta criada com sucesso! Você já está conectado. Seu apelido está pronto para o ranking.');
      } else {
        signup = false;
        viewFields('login');
        notify('success', 'Cadastro realizado! Agora entre com seu e-mail e senha. Se receber um e-mail de confirmação, siga as instruções.');
      }
    } else {
      unwrap(await auth.signIn.email({ email, password }));
      $('accountPass').value = '';
      const ok=await refreshAccount();
      if(ok)notify('success', 'Login realizado! Bem-vindo de volta.');
    }
  } catch (err) {
    notify('error', friendlyError(err));
  } finally {
    button.disabled = false;
    if (button.textContent === 'Aguarde…') button.textContent = label;
    // Se a tela mudou, recuperar o texto correto em vez de manter a ação anterior.
    const activeMode = $('accountForm').dataset.mode;
    const desired = activeMode === 'nickname' ? 'Salvar apelido' : activeMode === 'signup' ? 'Criar conta' : 'Entrar';
    button.textContent = desired;
  }
});
$('accountLogout').addEventListener('click', async () => {
  try {
    unwrap(await auth.signOut());
    currentUser = null;
    signup = false;
    await refreshAccount();
    notify('success', 'Você saiu da conta com segurança. Até a próxima!');
  } catch (err) { notify('error', 'Não foi possível sair: ' + friendlyError(err)); }
});

async function leaderboard() {
  const root = $('rankRows');
  root.replaceChildren();
  text(onlineStatus, 'Carregando classificação mundial…');
  try {
    const audience=$('rankAudience')?.value||'casual',mode=$('rankMode')?.value||'sprint';
    const result = await api('leaderboard?audience='+encodeURIComponent(audience)+'&mode='+encodeURIComponent(mode));
    if (!result.rows?.length) { text(onlineStatus, 'Ainda não há partidas classificadas. Você pode ser o primeiro!'); return; }
    text(onlineStatus, 'Ranking por '+({casual:'Casual',fandom:'Fãs',specialist:'Especialista',all:'Geral'}[result.audience]||'Casual')+' / '+({sprint:'Sprint',turbo:'Turbo',all:'todos os modos'}[result.mode]||'Sprint')+'. Recordes validados por desafio.');
    result.rows.forEach((row, index) => {
      const div = document.createElement('div'); div.className = 'rank-line';
      const position = document.createElement('b'), nick = document.createElement('span'), pts = document.createElement('strong');
      position.textContent = '#' + (index + 1);
      nick.textContent = row.nickname;
      pts.textContent = Number(row.total_score || 0).toLocaleString('pt-BR') + ' pts';
      div.append(position, nick, pts); root.append(div);
    });
  } catch (err) { text(onlineStatus, 'Ranking indisponível: ' + friendlyError(err)); }
}
for(const id of ['rankAudience','rankMode'])$(id)?.addEventListener('change',leaderboard);
window.addEventListener('lista:roundstart', event => {
  const d = event.detail;
  roundRequest = null; roundInfo = null;
  if (!currentUser || d.custom || !['sprint', 'turbo'].includes(d.mode)) return;
  roundInfo = { topicId: d.topicId, mode: d.mode, challengeCode:d.challengeCode||null };
  roundRequest = api('round', 'POST', { action: 'start', topicId: d.topicId, mode: d.mode, challengeCode:d.challengeCode||null }, true).catch(err => ({ error: err.message }));
});
window.addEventListener('lista:roundend', async event => {
  const d = event.detail, request = roundRequest, info = roundInfo;
  roundRequest = null; roundInfo = null;
  if (!request || !info || d.custom || d.mode !== info.mode || d.topicId !== info.topicId) return;
  const resultText = $('resultText');
  try {
    const started = await request;
    if (started.error) throw new Error(started.error);
    const outcome = await api('round', 'POST', { action: 'finish', roundId: started.roundId, guesses: d.guesses, hints:d.hints||0 }, true);
    if (resultText) resultText.textContent += ' • Ranking global: ' + outcome.score.toLocaleString('pt-BR') + ' pontos validados!';
    window.dispatchEvent(new CustomEvent('lista:roundsaved',{detail:{challengeCode:info.challengeCode,score:outcome.score}}));
  } catch (err) {
    if (resultText) resultText.textContent += ' • Pontuação local salva; ranking: ' + friendlyError(err);
  }
});
refreshAccount();
