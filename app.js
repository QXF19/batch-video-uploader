const state = {
  files: [],
  cover: null,
  selectedPlatforms: new Set(['抖音', '快手', '哔哩哔哩']),
  accounts: [
    { name: '旅行研究所', platform: '抖音', icon: '音', cls: 'dy', avatar: '旅', theme: 'sunset', followers: '82.6万', posts: 126, status: '正常' },
    { name: '小满的科技频道', platform: '哔哩哔哩', icon: 'B', cls: 'bi', avatar: '科', theme: 'blue', followers: '35.1万', posts: 84, status: '正常' },
    { name: '人间食味', platform: '快手', icon: '快', cls: 'ks', avatar: '食', theme: 'violet', followers: '19.8万', posts: 58, status: '7天后过期' },
    { name: '城市散步指南', platform: '抖音', icon: '音', cls: 'dy', avatar: '城', theme: 'blue', followers: '12.4万', posts: 39, status: '正常' },
    { name: '小满好物', platform: '快手', icon: '快', cls: 'ks', avatar: '好', theme: 'sunset', followers: '8.9万', posts: 47, status: '正常' },
    { name: '生活实验室', platform: '哔哩哔哩', icon: 'B', cls: 'bi', avatar: '生', theme: 'violet', followers: '6.3万', posts: 31, status: '正常' },
  ]
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function icon(id) {
  return `<svg><use href="#${id}"/></svg>`;
}

function showToast(title, message) {
  const toast = $('#toast');
  $('strong', toast).textContent = title;
  $('span', toast).textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function switchView(view) {
  $$('.nav-item[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  $$('.view').forEach((section) => section.classList.remove('active'));
  $(`#${view}View`)?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$$('.nav-item[data-view]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
$$('[data-view-target]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.viewTarget)));
$$('[data-go-publish]').forEach((button) => button.addEventListener('click', () => switchView('publish')));

const videoInput = $('#videoInput');
const dropzone = $('#dropzone');
['#browseFile', '#libraryUpload', '#emptyUpload'].forEach((selector) => $(selector)?.addEventListener('click', (event) => {
  event.stopPropagation();
  videoInput.click();
}));
dropzone.addEventListener('click', () => videoInput.click());
dropzone.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') videoInput.click(); });
['dragenter', 'dragover'].forEach((name) => dropzone.addEventListener(name, (event) => { event.preventDefault(); dropzone.classList.add('dragover'); }));
['dragleave', 'drop'].forEach((name) => dropzone.addEventListener(name, (event) => { event.preventDefault(); dropzone.classList.remove('dragover'); }));
dropzone.addEventListener('drop', (event) => addFiles(event.dataTransfer.files));
videoInput.addEventListener('change', () => addFiles(videoInput.files));

function addFiles(fileList) {
  const accepted = [...fileList].filter((file) => file.type.startsWith('video/') || /\.(mp4|mov|mkv)$/i.test(file.name));
  if (!accepted.length) return showToast('无法添加文件', '请选择 MP4、MOV 或 MKV 视频');
  state.files.push(...accepted.slice(0, 20 - state.files.length));
  renderFiles();
  showToast('视频已添加', `已加入 ${accepted.length} 个视频，准备智能分析`);
}

function renderFiles() {
  const list = $('#fileList');
  list.hidden = state.files.length === 0;
  dropzone.style.display = state.files.length ? 'none' : 'flex';
  list.innerHTML = state.files.map((file, index) => `
    <div class="file-item">
      <div class="file-thumb">VIDEO</div>
      <div><strong>${escapeHtml(file.name)}</strong><small>${formatSize(file.size)} · 正在读取视频信息</small></div>
      <button class="remove-file" data-remove-file="${index}" title="移除">${icon('i-close')}</button>
    </div>`).join('');
  $$('[data-remove-file]', list).forEach((button) => button.addEventListener('click', () => {
    state.files.splice(Number(button.dataset.removeFile), 1);
    renderFiles();
  }));
}

function formatSize(bytes) {
  if (!bytes) return '0 MB';
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

$$('.platform-option').forEach((button) => button.addEventListener('click', () => {
  const platform = button.dataset.platform;
  button.classList.toggle('selected');
  button.classList.contains('selected') ? state.selectedPlatforms.add(platform) : state.selectedPlatforms.delete(platform);
  $('#selectedPlatformCount').textContent = state.selectedPlatforms.size;
}));

function openEditor() {
  if (!state.files.length) return showToast('请先添加视频', '发布任务至少需要一个视频文件');
  if (!state.selectedPlatforms.size) return showToast('请选择平台', '至少选择一个发布平台');
  $('#editorModal').hidden = false;
}

$('#continuePublish').addEventListener('click', openEditor);
$('#newPublish').addEventListener('click', () => { switchView('dashboard'); setTimeout(() => dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); });
$$('[data-new-publish]').forEach((button) => button.addEventListener('click', () => { switchView('dashboard'); setTimeout(() => dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); }));
$$('[data-close-editor]').forEach((button) => button.addEventListener('click', () => $('#editorModal').hidden = true));

$$('input[name="mode"]').forEach((radio) => radio.addEventListener('change', () => {
  $('#scheduleFields').hidden = radio.value !== 'schedule' || !radio.checked;
}));

$('#postTitle').addEventListener('input', (event) => {
  $('.field > span b', event.target.parentElement).textContent = `${event.target.value.length} / 30`;
});

$('#selectCover').addEventListener('click', () => $('#coverInput').click());
$('#coverInput').addEventListener('change', () => {
  const file = $('#coverInput').files[0];
  if (!file) return;
  state.cover = file;
  $('#coverName').textContent = file.name;
  const preview = $('#coverPreview');
  preview.textContent = '';
  preview.style.backgroundImage = `url(${URL.createObjectURL(file)})`;
});

$('#submitTask').addEventListener('click', () => {
  const title = $('#postTitle').value.trim();
  if (!title) return showToast('请填写标题', '标题不能为空');
  if (!$('#postDescription').value.trim()) return showToast('请填写简介', '视频简介不能为空');
  if (!$('#postCategory').value) return showToast('请选择分区', '发布前必须选择内容分区');
  if (!state.cover) return showToast('请上传封面', '发布前必须选择 JPG 或 PNG 封面');
  if (!$('#rightsConfirm').checked) return showToast('请确认内容权利', '勾选版权与平台规范确认后才能继续');
  const scheduled = $('input[name="mode"]:checked').value === 'schedule';
  $('#editorModal').hidden = true;
  $('#pendingCount').textContent = String(Number($('#pendingCount').textContent) + 1);
  const card = document.createElement('article');
  card.className = 'task-card featured';
  card.innerHTML = `<div class="task-preview gradient-a">NEW<small>--:--</small></div><div class="task-info"><div><span class="task-state processing"><i></i>等待处理</span><h3>${escapeHtml(title)}</h3><p>${scheduled ? '将在指定时间自动发布' : '即将开始智能适配'}</p></div><div class="task-progress"><i style="width:8%"></i></div><div class="task-meta"><div class="platform-stack small">${platformBadges()}</div><span>${state.selectedPlatforms.size} 个平台</span></div></div>`;
  $('#taskBoard').prepend(card);
  switchView('publish');
  showToast('任务创建成功', '视频已进入智能适配队列');
  animateTask(card);
  setTimeout(openRelay, 350);
});

function buildPublishCopy(platform) {
  const title = $('#postTitle').value.trim();
  const description = $('#postDescription').value.trim();
  const category = $('#postCategory').value;
  const visibility = $('#visibility').value;
  const type = $('#contentType').value;
  return `${title}\n\n${description}\n\n#周末去哪儿 #旅行攻略 #治愈系风景\n\n平台：${platform}\n内容类型：${type}\n建议分区：${category}\n可见范围：${visibility}\n封面文件：${state.cover?.name || '未选择'}`;
}

function openRelay() {
  $('#relayModal').hidden = false;
  $$('[data-relay-platform]').forEach((item) => {
    item.classList.toggle('disabled', !state.selectedPlatforms.has(item.dataset.relayPlatform));
    $('.relay-open', item).disabled = !state.selectedPlatforms.has(item.dataset.relayPlatform);
  });
}

$$('[data-close-relay]').forEach((button) => button.addEventListener('click', () => $('#relayModal').hidden = true));
$$('.relay-open').forEach((button) => button.addEventListener('click', async () => {
  const article = button.closest('[data-relay-platform]');
  const platform = article.dataset.relayPlatform;
  const copy = buildPublishCopy(platform);
  try { await navigator.clipboard.writeText(copy); } catch (_) {
    const textarea = document.createElement('textarea'); textarea.value = copy; document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); textarea.remove();
  }
  window.open(button.dataset.url, '_blank', 'noopener,noreferrer');
  article.classList.add('done');
  button.textContent = '已复制 · 再次打开';
  showToast(`已打开${platform}官方发布页`, '标题、简介和发布设置已复制到剪贴板');
}));
$('#finishRelay').addEventListener('click', () => {
  $('#relayModal').hidden = true;
  showToast('发布接力已完成', '可在发布任务中继续追踪进度');
});

function platformBadges() {
  const map = { '抖音': ['dy', '音'], '快手': ['ks', '快'], '哔哩哔哩': ['bi', 'B'] };
  return [...state.selectedPlatforms].map((name) => `<span class="platform ${map[name][0]}">${map[name][1]}</span>`).join('');
}

function animateTask(card) {
  let progress = 8;
  const timer = setInterval(() => {
    progress += Math.ceil(Math.random() * 8);
    if (progress >= 100) {
      progress = 100;
      clearInterval(timer);
      $('.task-state', card).className = 'task-state pending';
      $('.task-state', card).innerHTML = '<i></i>适配完成';
      showToast('智能适配完成', '任务已准备好，可以发布');
    }
    $('.task-progress i', card).style.width = `${progress}%`;
  }, 700);
}

function renderAccounts() {
  $('#accountGrid').innerHTML = state.accounts.map((account) => `
    <article class="account-card">
      <div class="account-card-head"><div class="account-avatar ${account.theme}">${account.avatar}</div><div><strong>${account.name}</strong><span><b class="platform-mini ${account.cls}">${account.icon}</b> ${account.platform}</span></div><span class="status ${account.status === '正常' ? 'ok' : 'warn'}">● ${account.status}</span></div>
      <div class="divider"></div>
      <div class="account-data"><div><span>粉丝</span><strong>${account.followers}</strong></div><div><span>本月发布</span><strong>${account.posts}</strong></div></div>
      <div class="account-card-foot"><span class="security-note">授权信息已加密</span><button class="soft-button">管理</button></div>
    </article>`).join('');
}
renderAccounts();

function createQr(seed = 1) {
  const qr = $('#qrCode');
  qr.innerHTML = '';
  let value = seed * 9301 + 49297;
  for (let y = 0; y < 25; y++) {
    for (let x = 0; x < 25; x++) {
      value = (value * 233 + 97) % 233280;
      const finder = ((x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17));
      const ring = finder && (x % 18 === 0 || x % 18 === 6 || y % 18 === 0 || y % 18 === 6);
      const core = finder && x % 18 > 1 && x % 18 < 5 && y % 18 > 1 && y % 18 < 5;
      const cell = document.createElement('i');
      if (ring || core || (!finder && value / 233280 > .52)) cell.className = 'qr-cell';
      qr.appendChild(cell);
    }
  }
}

function openLogin() {
  $('#loginModal').hidden = false;
  createQr(Date.now() % 97);
}
$('#addAccount').addEventListener('click', openLogin);
$('#addAccountTop').addEventListener('click', openLogin);
$$('[data-close-modal]').forEach((button) => button.addEventListener('click', () => $('#loginModal').hidden = true));

$$('[data-login-platform]').forEach((button, index) => button.addEventListener('click', () => {
  $$('[data-login-platform]').forEach((item) => item.classList.remove('selected'));
  button.classList.add('selected');
  const platform = button.dataset.loginPlatform;
  const map = { '抖音': ['dy', '音'], '快手': ['ks', '快'], '哔哩哔哩': ['bi', 'B'] };
  $('#qrLogo').className = `qr-logo platform ${map[platform][0]}`;
  $('#qrLogo').textContent = map[platform][1];
  $('.scan-tip').textContent = `请使用${platform}客户端扫码`;
  createQr(index + 11);
}));

$('#qrCode').parentElement.addEventListener('click', () => {
  const platform = $('[data-login-platform].selected').dataset.loginPlatform;
  $('.scan-tip').textContent = '扫码成功，正在安全连接…';
  setTimeout(() => {
    $('#loginModal').hidden = true;
    showToast('账号连接成功', `${platform}账号已加入账号矩阵`);
  }, 900);
});

$$('.modal-backdrop').forEach((backdrop) => backdrop.addEventListener('click', (event) => {
  if (event.target === backdrop) backdrop.hidden = true;
}));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') $$('.modal-backdrop').forEach((modal) => modal.hidden = true);
});

$('#globalSearch').addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  const value = event.target.value.trim();
  if (!value) return;
  const row = [...$('#recentTable').rows].find((item) => item.textContent.includes(value));
  showToast(row ? '找到相关内容' : '没有匹配结果', row ? `已定位“${value}”` : `未找到“${value}”`);
  row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}
