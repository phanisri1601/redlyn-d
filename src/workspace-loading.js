export function workspacePage(path){
 if(path==='/app/settings')return {title:'Settings',key:'settings'};
 if(path==='/app/usage')return {title:'Usage & plan',key:'usage'};
 if(path==='/app/team')return {title:'Team',key:'team'};
 if(path==='/app/archive')return {title:'Archive',key:'archive'};
 if(path==='/app/notifications')return {title:'Notifications',key:'notifications'};
 if(path==='/app/setup')return {title:'Service setup',key:'setup'};
 if(path.startsWith('/app/projects/'))return {title:'Review details',key:'projects'};
 return {title:'Dashboard',key:'projects'};
}
export function workspaceLoadingContent(path){const {title}=workspacePage(path);return `<section class="workspace-loading" aria-busy="true" aria-label="Opening ${title}"><div class="page-heading"><div><h1>${title}</h1><p class="hint" role="status">Getting the latest details…</p></div></div><div class="skeleton-summary" aria-hidden="true">${Array.from({length:3},()=>'<div class="panel"><div class="skeleton-line short"></div><div class="skeleton-line value"></div></div>').join('')}</div><div class="panel skeleton-panel" aria-hidden="true"><div class="skeleton-line short"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div></section>`;}
export function initialWorkspaceLoading(path){return `<div class="workspace"><aside class="sidebar skeleton-sidebar" aria-hidden="true"><a class="brand" href="/"><img src="/favicon.svg" alt=""><span>redlyn</span></a><div class="skeleton-line"></div>${Array.from({length:5},()=>'<div class="skeleton-line short"></div>').join('')}</aside><div class="workspace-main"><div class="workspace-top"><span>Workspace</span></div><main class="content">${workspaceLoadingContent(path)}</main></div></div>`;}
