let currentTab = 'resources';

// Check admin access
document.addEventListener('DOMContentLoaded', async () => {
  await window.auth.requireAdmin();
  loadStats();
  loadResources();
  loadCategories();
});

// Show tab
function showTab(tab) {
  currentTab = tab;
  document.getElementById('resourcesTab').style.display = tab === 'resources' ? 'block' : 'none';
  document.getElementById('categoriesTab').style.display = tab === 'categories' ? 'block' : 'none';
  
  document.getElementById('tabResources').classList.toggle('btn-primary', tab === 'resources');
  document.getElementById('tabResources').classList.toggle('btn-outline', tab !== 'resources');
  document.getElementById('tabCategories').classList.toggle('btn-primary', tab === 'categories');
  document.getElementById('tabCategories').classList.toggle('btn-outline', tab !== 'categories');
}

// Load statistics
async function loadStats() {
  const container = document.getElementById('stats-container');
  try {
    const stats = await window.api.admin.getStats();
    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>${stats.users}</h3>
          <p>用户总数</p>
        </div>
        <div class="stat-card">
          <h3>${stats.categories}</h3>
          <p>分类总数</p>
        </div>
        <div class="stat-card">
          <h3>${stats.resources}</h3>
          <p>资源总数</p>
        </div>
        <div class="stat-card">
          <h3>${stats.favorites}</h3>
          <p>收藏总数</p>
        </div>
      </div>
      <div class="card mt-4">
        <h3>资源类型分布</h3>
        <div style="margin-top: 1rem;">
          ${stats.resourcesByType.map(item => `
            <p><strong>${getTypeName(item.type)}:</strong> ${item.count} 个</p>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<div class="alert alert-error">加载统计数据失败: ${error.message}</div>`;
  }
}

// Load resources
async function loadResources() {
  const container = document.getElementById('resources-list-container');
  try {
    const result = await window.api.admin.getResources(100);
    const resources = result.resources;
    
    if (resources.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>暂无资源</p></div>';
      return;
    }

    container.innerHTML = `
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>标题</th>
              <th>类型</th>
              <th>分类</th>
              <th>浏览</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${resources.map(resource => `
              <tr>
                <td>${resource.id}</td>
                <td>${resource.title}</td>
                <td><span class="type-badge ${resource.type}">${getTypeName(resource.type)}</span></td>
                <td>${resource.category_id || '-'}</td>
                <td>${resource.view_count || 0}</td>
                <td>
                  <button class="btn btn-outline" onclick="editResource(${resource.id})" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">编辑</button>
                  <button class="btn btn-danger" onclick="deleteResource(${resource.id})" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">删除</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<div class="alert alert-error">加载资源失败: ${error.message}</div>`;
  }
}

// Load categories
async function loadCategories() {
  const container = document.getElementById('categories-list-container');
  try {
    const categories = await window.api.categories.getAll();
    
    if (categories.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>暂无分类</p></div>';
      return;
    }

    container.innerHTML = `
      <div class="card-grid">
        ${categories.map(category => `
          <div class="card">
            <div style="font-size: 2rem; margin-bottom: 1rem;">${category.icon || '📁'}</div>
            <h3>${category.name}</h3>
            <p style="color: var(--text-secondary); margin: 1rem 0;">${category.description || ''}</p>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
              <button class="btn btn-outline" onclick="editCategory(${category.id})" style="flex: 1;">编辑</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<div class="alert alert-error">加载分类失败: ${error.message}</div>`;
  }
}

// Resource modal functions
async function openResourceModal(resourceId = null) {
  const modal = document.getElementById('resourceModal');
  const form = document.getElementById('resourceForm');
  const title = document.getElementById('resourceModalTitle');
  
  // Load categories
  const categorySelect = document.getElementById('resourceCategory');
  const categories = await window.api.categories.getAll();
  categorySelect.innerHTML = '<option value="">请选择分类</option>' + 
    categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');

  if (resourceId) {
    title.textContent = '编辑资源';
    const resource = await window.api.resources.getById(resourceId);
    document.getElementById('resourceId').value = resource.id;
    document.getElementById('resourceCategory').value = resource.category_id || '';
    document.getElementById('resourceType').value = resource.type;
    document.getElementById('resourceTitle').value = resource.title;
    document.getElementById('resourceDescription').value = resource.description || '';
    document.getElementById('resourceUrl').value = resource.url || '';
    document.getElementById('resourceImageUrl').value = resource.image_url || '';
    document.getElementById('resourceAuthor').value = resource.author || '';
    document.getElementById('resourceTags').value = resource.tags || '';
  } else {
    title.textContent = '添加资源';
    form.reset();
    document.getElementById('resourceId').value = '';
  }
  
  modal.classList.add('open');
}

function closeResourceModal() {
  document.getElementById('resourceModal').classList.remove('open');
}

// Category modal functions
async function openCategoryModal(categoryId = null) {
  const modal = document.getElementById('categoryModal');
  const form = document.getElementById('categoryForm');
  const title = document.getElementById('categoryModalTitle');

  if (categoryId) {
    title.textContent = '编辑分类';
    const category = await window.api.categories.getById(categoryId);
    document.getElementById('categoryId').value = category.id;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryIcon').value = category.icon || '';
    document.getElementById('categorySortOrder').value = category.sort_order || 0;
  } else {
    title.textContent = '添加分类';
    form.reset();
    document.getElementById('categoryId').value = '';
  }
  
  modal.classList.add('open');
}

function closeCategoryModal() {
  document.getElementById('categoryModal').classList.remove('open');
}

// Edit resource
async function editResource(id) {
  await openResourceModal(id);
}

// Edit category
async function editCategory(id) {
  await openCategoryModal(id);
}

// Delete resource
async function deleteResource(id) {
  if (!confirm('确定要删除这个资源吗？')) return;
  
  try {
    await window.api.resources.delete(id);
    loadResources();
    alert('删除成功');
  } catch (error) {
    alert('删除失败: ' + error.message);
  }
}

// Get type name
function getTypeName(type) {
  const typeMap = {
    'guide': '指南',
    'blogger': '博主',
    'case': '案例',
    'tool': '工具'
  };
  return typeMap[type] || type;
}

// Resource form submit
document.getElementById('resourceForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const resourceId = document.getElementById('resourceId').value;
  const data = {
    category_id: document.getElementById('resourceCategory').value || null,
    type: document.getElementById('resourceType').value,
    title: document.getElementById('resourceTitle').value,
    description: document.getElementById('resourceDescription').value,
    url: document.getElementById('resourceUrl').value,
    image_url: document.getElementById('resourceImageUrl').value,
    author: document.getElementById('resourceAuthor').value,
    tags: document.getElementById('resourceTags').value
  };

  try {
    if (resourceId) {
      await window.api.resources.update(resourceId, data);
    } else {
      await window.api.resources.create(data);
    }
    closeResourceModal();
    loadResources();
    alert('保存成功');
  } catch (error) {
    alert('保存失败: ' + error.message);
  }
});

// Category form submit
document.getElementById('categoryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const categoryId = document.getElementById('categoryId').value;
  const data = {
    name: document.getElementById('categoryName').value,
    description: document.getElementById('categoryDescription').value,
    icon: document.getElementById('categoryIcon').value,
    sort_order: parseInt(document.getElementById('categorySortOrder').value) || 0
  };

  try {
    if (categoryId) {
      await window.api.categories.update(categoryId, data);
    } else {
      await window.api.categories.create(data);
    }
    closeCategoryModal();
    loadCategories();
    alert('保存成功');
  } catch (error) {
    alert('保存失败: ' + error.message);
  }
});

// Close modal on outside click
document.getElementById('resourceModal').addEventListener('click', (e) => {
  if (e.target.id === 'resourceModal') {
    closeResourceModal();
  }
});

document.getElementById('categoryModal').addEventListener('click', (e) => {
  if (e.target.id === 'categoryModal') {
    closeCategoryModal();
  }
});
