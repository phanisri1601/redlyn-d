// A local-only sample: never calls the review API or persists customer feedback.
const demos = new WeakMap();
let installed = false, nextDemo = 0;
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sampleComments = () => [
  {id:1,text:'Can the headline be a bit bigger on mobile?',internal:false,status:'Open',x:53,y:36,author:'Salman'},
  {id:2,text:'@Abbas hero image is 2.4 MB. Compress it before v2 goes to the client.',internal:true,status:'Open',x:78,y:73,author:'Aakhil'}
];

function announce(shell, message) {
  const live = shell.querySelector('.sample-announcement');
  if (live) live.textContent = message;
}

function render(shell) {
  const state = demos.get(shell), coffee = shell.querySelector('.coffee');
  if (!state || !coffee) return;
  shell.querySelectorAll('.mock-bar [data-action]').forEach(button => {
    const active = button.dataset.action === (state.client ? 'mock-client' : 'mock-team');
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  coffee.querySelectorAll('.mock-pin,.sample-pin,.sample-composer').forEach(node => node.remove());
  const visible = state.comments.filter(comment => !state.client || !comment.internal);
  for (const comment of visible) {
    const pin = document.createElement('button');
    pin.type = 'button'; pin.className = `sample-pin ${comment.internal ? 'private' : ''} ${comment.status === 'Resolved' ? 'resolved' : ''}`;
    pin.dataset.demoAction = 'select'; pin.dataset.comment = comment.id;
    pin.style.left = `${comment.x}%`; pin.style.top = `${comment.y}%`;
    pin.textContent = comment.id;
    pin.setAttribute('aria-label', `Sample comment ${comment.id}: ${comment.text}`);
    coffee.append(pin);
  }
  const comments = shell.querySelector('.mock-comments');
  const open = visible.filter(comment => comment.status !== 'Resolved').length;
  const ready = state.comments.filter(comment => !comment.internal).every(comment => comment.status === 'Resolved');
  comments.innerHTML = `<header><strong>Sample comments</strong><span class="hint">${open} open</span></header>${visible.map(comment => `<article class="mock-comment ${comment.internal ? 'internal-demo' : ''} ${state.selected === comment.id ? 'sample-selected' : ''}" data-sample-comment="${comment.id}"><div class="mock-author"><span class="avatar ${comment.internal ? 'violet' : ''}">${escapeHTML(comment.author.slice(0,2).toUpperCase())}</span><strong>${escapeHTML(comment.author)}</strong><span class="hint">${comment.internal ? 'Internal' : 'Client'}</span></div><p>${escapeHTML(comment.text)}</p><span class="status ${comment.status === 'Resolved' ? 'resolved' : comment.status === 'In review' ? 'in-review' : ''}">${comment.status}</span>${!state.approved && comment.status === 'Open' && !state.client ? `<button type="button" class="small sample-comment-action" data-demo-action="ready" data-comment="${comment.id}">Mark ready for review</button>` : ''}${!state.approved && comment.status === 'In review' ? (state.client || comment.internal ? `<button type="button" class="small sample-comment-action" data-demo-action="resolve" data-comment="${comment.id}">${comment.internal ? 'Resolve note' : 'Looks good'}</button>` : '<p class="sample-next-step">Switch to Client view to approve this fix.</p>') : ''}</article>`).join('')}<div class="sample-approval"><button type="button" class="small ${state.approved ? '' : 'primary'}" data-demo-action="approve" ${!ready || !state.client || state.approved ? 'disabled' : ''}>${state.approved ? '✓ Sample page approved' : 'Approve sample page'}</button><span class="hint">${state.approved ? 'Demo complete. Reset to try again.' : !ready ? 'Resolve client comments before approving.' : !state.client ? 'Switch to Client view for final approval.' : 'All client feedback is resolved.'}</span></div><a class="button primary small full" href="/signup">Try it on your website →</a>`;
  if (state.draft) drawComposer(shell);
}

function drawComposer(shell) {
  const state = demos.get(shell), coffee = shell.querySelector('.coffee'), {x,y} = state.draft;
  const marker = document.createElement('span');
  marker.className = 'sample-pin sample-draft-pin'; marker.style.left = `${x}%`; marker.style.top = `${y}%`; marker.textContent = '+'; marker.setAttribute('aria-hidden','true'); coffee.append(marker);
  const form = document.createElement('form'); form.className = 'sample-composer';
  form.setAttribute('aria-label','Add sample feedback');
  form.innerHTML = `<div class="sample-composer-head"><strong>New sample comment</strong><button class="ghost small" type="button" data-demo-action="cancel" aria-label="Cancel sample comment">×</button></div><label for="sample-text-${state.id}">What should change here?</label><textarea id="sample-text-${state.id}" name="text" maxlength="500" required placeholder="Try: Make this headline bigger"></textarea>${!state.client ? '<label class="sample-private"><input name="internal" type="checkbox"> Internal team note</label>' : '<p class="hint">Visible to the client and team.</p>'}<div class="sample-composer-footer"><span class="hint">Demo only · not saved</span><button type="submit" class="primary small">Post sample</button></div>`;
  coffee.append(form);
  const width = coffee.clientWidth, height = coffee.clientHeight;
  form.style.left = `${Math.max(8, Math.min(width - form.offsetWidth - 8, x * width / 100 + 18))}px`;
  form.style.top = `${Math.max(8, Math.min(height - form.offsetHeight - 8, y * height / 100 - 20))}px`;
  form.querySelector('textarea').focus({preventScroll:true});
}

function decorate(shell) {
  if (demos.has(shell) || !shell.querySelector('.coffee') || !shell.querySelector('.mock-comments')) return;
  demos.set(shell, {id:++nextDemo,comments:sampleComments(),client:false,draft:null,selected:null,approved:false});
  shell.classList.add('interactive-sample');
  const help = document.createElement('div'); help.className = 'sample-help';
  help.innerHTML = '<div><strong>Interactive sample</strong><span>Click the website to add a pin. Try the team → client approval flow.</span></div><button class="small" type="button" data-demo-action="add">+ Add sample pin</button><button class="ghost small" type="button" data-demo-action="reset">Reset</button>';
  shell.querySelector('.mock-bar').after(help);
  const live = document.createElement('span'); live.className = 'sample-announcement'; live.setAttribute('role','status'); live.setAttribute('aria-live','polite'); shell.append(live);
  render(shell);
}

export function initDemo() {
  if (installed) return;
  installed = true;
  const scan = () => document.querySelectorAll('.preview-shell').forEach(decorate);
  scan();
  new MutationObserver(scan).observe(document.body, {childList:true,subtree:true});
  document.addEventListener('click', event => {
    const shell = event.target.closest?.('.interactive-sample');
    if (!shell) return;
    const state = demos.get(shell), action = event.target.closest('[data-demo-action]'), mode = event.target.closest('.mock-bar [data-action="mock-team"],.mock-bar [data-action="mock-client"]');
    if (mode) {
      event.preventDefault(); event.stopPropagation();
      state.client = mode.dataset.action === 'mock-client'; state.draft = null; render(shell);
      announce(shell, state.client ? 'Client view: internal notes are hidden.' : 'Team view: client comments and internal notes are visible.');
      return;
    }
    if (action) {
      event.preventDefault(); event.stopPropagation();
      const comment = state.comments.find(item => item.id === Number(action.dataset.comment));
      switch (action.dataset.demoAction) {
        case 'reset': state.comments = sampleComments(); state.draft = null; state.selected = null; state.approved = false; render(shell); announce(shell,'Sample reset.'); break;
        case 'cancel': state.draft = null; render(shell); break;
        case 'add': state.approved = false; state.draft = {x:50,y:40}; render(shell); break;
        case 'select': state.selected = comment?.id; render(shell); shell.querySelector(`[data-sample-comment="${comment?.id}"]`)?.scrollIntoView({block:'nearest',behavior:'smooth'}); announce(shell, comment ? `Comment ${comment.id}: ${comment.text}` : ''); break;
        case 'ready': if(comment && !state.client) {comment.status='In review'; render(shell); announce(shell,'Fix ready for review. Switch to Client view to check it.');} break;
        case 'resolve': if(comment && (state.client || comment.internal)) {comment.status='Resolved'; render(shell); announce(shell,'Sample feedback resolved.');} break;
        case 'approve': if(state.client && state.comments.filter(item=>!item.internal).every(item=>item.status==='Resolved')) {state.approved=true; render(shell); announce(shell,'Sample page approved. No real website was changed.');} break;
      }
      return;
    }
    const coffee = event.target.closest('.coffee');
    if (!coffee || event.target.closest('.sample-composer')) return;
    event.preventDefault(); event.stopPropagation();
    const rect = coffee.getBoundingClientRect();
    state.approved = false; state.draft = {x: Math.max(2,Math.min(98,(event.clientX-rect.left)/rect.width*100)),y:Math.max(2,Math.min(98,(event.clientY-rect.top)/rect.height*100))};
    render(shell);
  }, true);
  document.addEventListener('submit', event => {
    if (!event.target.matches('.sample-composer')) return;
    event.preventDefault(); event.stopPropagation();
    const shell = event.target.closest('.interactive-sample'), state = demos.get(shell), form = event.target;
    const text = form.elements.text.value.trim();
    if (!text) {form.elements.text.setCustomValidity('Enter a sample comment.'); form.elements.text.reportValidity(); return;}
    state.comments.push({id:Math.max(...state.comments.map(item=>item.id))+1,text,internal:!state.client&&!!form.elements.internal?.checked,status:'Open',author:'You',...state.draft});
    state.draft = null; state.approved = false; render(shell); announce(shell,'Sample comment posted. Nothing is saved to your workspace.');
  }, true);
  document.addEventListener('input',event=>{if(event.target.matches('.sample-composer textarea'))event.target.setCustomValidity('');});
  document.addEventListener('keydown', event => {
    const composer = event.target.closest?.('.sample-composer');
    if (!composer) return;
    if (event.key === 'Escape') {event.preventDefault(); event.stopPropagation(); const shell=composer.closest('.interactive-sample'); demos.get(shell).draft=null; render(shell); shell.querySelector('[data-demo-action="add"]')?.focus();}
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.target.matches('textarea')) {event.preventDefault(); composer.requestSubmit();}
  }, true);
}
