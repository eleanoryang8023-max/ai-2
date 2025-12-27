// 加载分类
async function loadCategories() {
  const container = document.getElementById('categories-container');
  if (!container) return;

  try {
    const categories = await window.api.categories.getAll();

    if (categories.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <h3>暂无分类</h3>
          <p>分类数据正在准备中...</p>
        </div>
      `;
      return;
    }

    container.innerHTML = categories.map(category => `
      <div class="card category-card" onclick="window.location.href='category.html?id=${category.id}'">
        <div class="icon">${category.icon || '📁'}</div>
        <h3>${category.name}</h3>
        <p>${category.description || ''}</p>
      </div>
    `).join('');
  } catch (error) {
    console.error('加载分类失败:', error);
    container.innerHTML = `
      <div class="alert alert-error">
        加载分类失败: ${error.message}
      </div>
    `;
  }
}

// 获取类型名称
function getTypeName(type) {
  const typeMap = {
    'guide': '学习指南',
    'blogger': '推荐博主',
    'case': '精彩案例',
    'tool': '工具推荐'
  };
  return typeMap[type] || type;
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
});

// 导出
window.main = {
  loadCategories,
  getTypeName
};