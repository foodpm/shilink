// 数据存储
let data = {
    projects: [],
    links: [],
    currentProject: null
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    renderMainPage();
    
    // 点击外部关闭菜单
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.add-button-container')) {
            hideAddMenu();
        }
        if (!e.target.closest('.action-btn') && !e.target.closest('.action-menu')) {
            hideAllActionMenus();
        }
    });
});

// 数据持久化
function saveData() {
    localStorage.setItem('shilian-data', JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem('shilian-data');
    if (saved) {
        data = JSON.parse(saved);
    }
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 格式化日期
function formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 页面导航
function showMainPage() {
    hideAllPages();
    document.getElementById('main-page').classList.add('active');
    renderMainPage();
}

function showProjectDetail(projectId) {
    hideAllPages();
    document.getElementById('project-detail-page').classList.add('active');
    data.currentProject = projectId;
    renderProjectDetail(projectId);
}

function showSettings() {
    hideAllPages();
    document.getElementById('settings-page').classList.add('active');
}

function hideAllPages() {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
}

// 主页面渲染
function renderMainPage() {
    renderPinnedLinks();
    renderProjects();
    updateProjectSelect();
}

function renderPinnedLinks() {
    const container = document.getElementById('pinned-links');
    const pinnedLinks = data.links.filter(link => link.isPinned);
    
    if (pinnedLinks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-thumbtack"></i>
                <h3>暂无置顶链接</h3>
                <p>在项目中点击链接的"置顶"按钮即可在此显示</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pinnedLinks.map(link => `
        <div class="link-item" onclick="openLink('${link.url}')">
            <div class="link-info">
                <div class="link-name">${link.name}</div>
                <div class="link-description">${link.description || ''}</div>
                <div class="link-date">${formatDate(link.createdAt)}</div>
            </div>
            <div class="link-actions">
                <button class="action-btn" onclick="event.stopPropagation(); toggleActionMenu('pinned-link-${link.id}')">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <div id="pinned-link-${link.id}" class="action-menu hidden">
                    <button onclick="event.stopPropagation(); unpinLink('${link.id}')">
                        <i class="fas fa-thumbtack"></i>
                        取消置顶
                    </button>
                    <button onclick="event.stopPropagation(); editLink('${link.id}')">
                        <i class="fas fa-edit"></i>
                        编辑
                    </button>
                    <button onclick="event.stopPropagation(); deleteLink('${link.id}')" class="danger">
                        <i class="fas fa-trash"></i>
                        删除
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderProjects() {
    const container = document.getElementById('projects-grid');
    
    if (data.projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>暂无项目</h3>
                <p>创建项目来组织管理你的链接</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = data.projects.map(project => {
        const linkCount = data.links.filter(link => link.projectId === project.id).length;
        return `
            <div class="project-card" onclick="showProjectDetail('${project.id}')">
                <div class="project-icon">
                    <i class="fas fa-folder"></i>
                </div>
                <div class="project-name">${project.name}</div>
                <div class="project-description">${project.description || '暂无描述'}</div>
                <div class="project-meta">
                    <span>${linkCount} 个链接</span>
                    <span>${formatDate(project.createdAt)}</span>
                </div>
                <button class="delete-project-btn" onclick="event.stopPropagation(); confirmDeleteProject('${project.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
}

// 项目详情页渲染
function renderProjectDetail(projectId) {
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return;
    
    const projectLinks = data.links.filter(link => link.projectId === projectId);
    
    document.getElementById('project-title').textContent = project.name;
    document.getElementById('project-description').textContent = project.description || '暂无描述';
    document.getElementById('project-link-count').textContent = `${projectLinks.length} 个链接`;
    document.getElementById('project-date').textContent = formatDate(project.createdAt);
    
    const container = document.getElementById('project-links-list');
    
    if (projectLinks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-link"></i>
                <h3>暂无链接</h3>
                <p>为此项目添加一些链接吧</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = projectLinks.map(link => `
        <div class="link-item" onclick="openLink('${link.url}')">
            <div class="link-info">
                <div class="link-name">${link.name}${link.isPinned ? ' <i class="fas fa-thumbtack" style="color: #667eea; font-size: 0.8em;"></i>' : ''}</div>
                <div class="link-description">${link.description || ''}</div>
                <div class="link-date">${formatDate(link.createdAt)}</div>
            </div>
            <div class="link-actions">
                <button class="action-btn" onclick="event.stopPropagation(); toggleActionMenu('link-${link.id}')">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <div id="link-${link.id}" class="action-menu hidden">
                    <button onclick="event.stopPropagation(); ${link.isPinned ? 'unpinLink' : 'pinLink'}('${link.id}')">
                        <i class="fas fa-thumbtack"></i>
                        ${link.isPinned ? '取消置顶' : '置顶'}
                    </button>
                    <button onclick="event.stopPropagation(); editLink('${link.id}')">
                        <i class="fas fa-edit"></i>
                        编辑
                    </button>
                    <button onclick="event.stopPropagation(); deleteLink('${link.id}')" class="danger">
                        <i class="fas fa-trash"></i>
                        删除
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// 添加功能
function showAddMenu() {
    const menu = document.getElementById('add-menu');
    menu.classList.toggle('hidden');
}

function hideAddMenu() {
    document.getElementById('add-menu').classList.add('hidden');
}

function showAddProjectModal() {
    hideAddMenu();
    document.getElementById('add-project-modal').classList.add('active');
}

function showAddLinkModal() {
    hideAddMenu();
    updateProjectSelect();
    document.getElementById('add-link-modal').classList.add('active');
}

function updateProjectSelect() {
    const select = document.getElementById('link-project');
    select.innerHTML = '<option value="">请选择项目</option>';
    
    data.projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        select.appendChild(option);
    });
}

function updateEditProjectSelect() {
    const select = document.getElementById('edit-link-project');
    select.innerHTML = '<option value="">请选择项目</option>';
    
    data.projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        select.appendChild(option);
    });
}

// 项目操作
function addProject(event) {
    event.preventDefault();
    
    const name = document.getElementById('project-name').value.trim();
    const description = document.getElementById('project-desc').value.trim();
    
    if (!name) return;
    
    const project = {
        id: generateId(),
        name,
        description,
        createdAt: new Date().toISOString()
    };
    
    data.projects.push(project);
    saveData();
    closeModal('add-project-modal');
    renderMainPage();
    
    // 清空表单
    document.getElementById('add-project-form').reset();
}

function confirmDeleteProject(projectId) {
    const project = data.projects.find(p => p.id === projectId);
    const linkCount = data.links.filter(link => link.projectId === projectId).length;
    
    showConfirmModal(
        `确定要删除项目"${project.name}"吗？${linkCount > 0 ? `这将同时删除项目中的 ${linkCount} 个链接。` : ''}此操作不可撤销。`,
        () => deleteProject(projectId)
    );
}

function deleteProject(projectId) {
    data.projects = data.projects.filter(p => p.id !== projectId);
    data.links = data.links.filter(link => link.projectId !== projectId);
    saveData();
    renderMainPage();
    closeModal('confirm-modal');
}

// 链接操作
function addLink(event) {
    event.preventDefault();
    
    const name = document.getElementById('link-name').value.trim();
    const url = document.getElementById('link-url').value.trim();
    const description = document.getElementById('link-desc').value.trim();
    const projectId = document.getElementById('link-project').value;
    
    if (!name || !url || !projectId) return;
    
    const link = {
        id: generateId(),
        name,
        url,
        description,
        projectId,
        isPinned: false,
        createdAt: new Date().toISOString()
    };
    
    data.links.push(link);
    saveData();
    closeModal('add-link-modal');
    
    if (data.currentProject) {
        renderProjectDetail(data.currentProject);
    } else {
        renderMainPage();
    }
    
    // 清空表单
    document.getElementById('add-link-form').reset();
}

function editLink(linkId) {
    const link = data.links.find(l => l.id === linkId);
    if (!link) return;
    
    document.getElementById('edit-link-id').value = link.id;
    document.getElementById('edit-link-name').value = link.name;
    document.getElementById('edit-link-url').value = link.url;
    document.getElementById('edit-link-desc').value = link.description || '';
    
    // 更新项目选择下拉菜单
    updateEditProjectSelect();
    document.getElementById('edit-link-project').value = link.projectId || '';
    
    hideAllActionMenus();
    document.getElementById('edit-link-modal').classList.add('active');
}

function updateLink(event) {
    event.preventDefault();
    
    const linkId = document.getElementById('edit-link-id').value;
    const name = document.getElementById('edit-link-name').value.trim();
    const url = document.getElementById('edit-link-url').value.trim();
    const description = document.getElementById('edit-link-desc').value.trim();
    const projectId = document.getElementById('edit-link-project').value;
    
    if (!name || !url || !projectId) return;
    
    const linkIndex = data.links.findIndex(l => l.id === linkId);
    if (linkIndex !== -1) {
        data.links[linkIndex] = {
            ...data.links[linkIndex],
            name,
            url,
            description,
            projectId
        };
        
        saveData();
        closeModal('edit-link-modal');
        
        if (data.currentProject) {
            renderProjectDetail(data.currentProject);
        } else {
            renderMainPage();
        }
    }
}

function pinLink(linkId) {
    const linkIndex = data.links.findIndex(l => l.id === linkId);
    if (linkIndex !== -1) {
        data.links[linkIndex].isPinned = true;
        saveData();
        hideAllActionMenus();
        
        if (data.currentProject) {
            renderProjectDetail(data.currentProject);
        }
        renderMainPage();
    }
}

function unpinLink(linkId) {
    const linkIndex = data.links.findIndex(l => l.id === linkId);
    if (linkIndex !== -1) {
        data.links[linkIndex].isPinned = false;
        saveData();
        hideAllActionMenus();
        
        if (data.currentProject) {
            renderProjectDetail(data.currentProject);
        }
        renderMainPage();
    }
}

function deleteLink(linkId) {
    const link = data.links.find(l => l.id === linkId);
    showConfirmModal(
        `确定要删除链接"${link.name}"吗？此操作不可撤销。`,
        () => {
            data.links = data.links.filter(l => l.id !== linkId);
            saveData();
            closeModal('confirm-modal');
            hideAllActionMenus();
            
            if (data.currentProject) {
                renderProjectDetail(data.currentProject);
            } else {
                renderMainPage();
            }
        }
    );
}

function openLink(url) {
    window.open(url, '_blank');
}

// 编辑项目信息
function editProjectTitle() {
    const element = document.getElementById('project-title');
    const currentText = element.textContent;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'edit-input';
    input.style.cssText = 'font-size: 2rem; font-weight: 700; border: 2px solid #667eea; border-radius: 8px; padding: 5px 10px; width: 100%;';
    
    element.replaceWith(input);
    input.focus();
    input.select();
    
    function saveEdit() {
        const newText = input.value.trim();
        if (newText && newText !== currentText) {
            const projectIndex = data.projects.findIndex(p => p.id === data.currentProject);
            if (projectIndex !== -1) {
                data.projects[projectIndex].name = newText;
                saveData();
            }
        }
        
        const newElement = document.createElement('h1');
        newElement.id = 'project-title';
        newElement.className = 'editable';
        newElement.textContent = newText || currentText;
        newElement.onclick = editProjectTitle;
        
        input.replaceWith(newElement);
    }
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveEdit();
        }
    });
}

function editProjectDescription() {
    const element = document.getElementById('project-description');
    const currentText = element.textContent === '暂无描述' ? '' : element.textContent;
    
    const input = document.createElement('textarea');
    input.value = currentText;
    input.className = 'edit-input';
    input.style.cssText = 'font-size: 1.1rem; border: 2px solid #667eea; border-radius: 8px; padding: 5px 10px; width: 100%; min-height: 60px; resize: vertical;';
    
    element.replaceWith(input);
    input.focus();
    input.select();
    
    function saveEdit() {
        const newText = input.value.trim();
        const projectIndex = data.projects.findIndex(p => p.id === data.currentProject);
        if (projectIndex !== -1) {
            data.projects[projectIndex].description = newText;
            saveData();
        }
        
        const newElement = document.createElement('p');
        newElement.id = 'project-description';
        newElement.className = 'editable';
        newElement.textContent = newText || '暂无描述';
        newElement.onclick = editProjectDescription;
        
        input.replaceWith(newElement);
    }
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            saveEdit();
        }
    });
}

// UI 交互
function toggleActionMenu(menuId) {
    hideAllActionMenus();
    const menu = document.getElementById(menuId);
    if (menu) {
        menu.classList.remove('hidden');
    }
}

function hideAllActionMenus() {
    document.querySelectorAll('.action-menu').forEach(menu => {
        menu.classList.add('hidden');
    });
}

function showConfirmModal(message, onConfirm) {
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-delete-btn').onclick = onConfirm;
    document.getElementById('confirm-modal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// 点击模态框外部关闭
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// 数据导入导出
function exportData() {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `拾链数据_${formatDate(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // 验证数据格式
            if (importedData.projects && importedData.links) {
                if (confirm('导入数据将覆盖当前所有数据，确定要继续吗？')) {
                    data = importedData;
                    saveData();
                    renderMainPage();
                    alert('数据导入成功！');
                }
            } else {
                alert('数据格式不正确，请选择有效的备份文件。');
            }
        } catch (error) {
            alert('文件解析失败，请选择有效的JSON文件。');
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // 清空文件选择
}