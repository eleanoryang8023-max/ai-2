// API配置管理
class ConfigManager {
  constructor() {
    this.config = null;
    this.init();
  }

  async init() {
    // 检查是否已有配置
    try {
      this.config = await window.api.aiConfig.get();
      
      if (this.config) {
        // 已配置，隐藏配置面板，显示聊天界面
        this.hideConfigPanel();
        this.showChatWidget();
      } else {
        // 未配置，显示配置面板
        this.showConfigPanel();
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      // 如果出错，也显示配置面板
      this.showConfigPanel();
    }

    // 绑定事件
    this.bindEvents();
  }

  bindEvents() {
    const settingsBtn = document.getElementById('settingsBtn');
    const configModal = document.getElementById('configModal');
    const closeConfig = document.getElementById('closeConfig');
    const cancelConfig = document.getElementById('cancelConfig');
    const configForm = document.getElementById('configForm');

    // 设置按钮
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.showConfigPanel();
      });
    }

    // 关闭配置面板
    if (closeConfig) {
      closeConfig.addEventListener('click', () => {
        this.hideConfigPanel();
      });
    }

    if (cancelConfig) {
      cancelConfig.addEventListener('click', () => {
        this.hideConfigPanel();
      });
    }

    // 点击外部关闭
    if (configModal) {
      configModal.addEventListener('click', (e) => {
        if (e.target.id === 'configModal') {
          this.hideConfigPanel();
        }
      });
    }

    // 提交配置表单
    if (configForm) {
      configForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.saveConfig();
      });
    }
  }

  showConfigPanel() {
    const configModal = document.getElementById('configModal');
    if (configModal) {
      configModal.classList.add('open');
      
      // 如果已有配置，填充表单
      if (this.config) {
        document.getElementById('apiUrl').value = this.config.api_url || '';
        document.getElementById('apiKey').value = this.config.api_key || '';
        document.getElementById('modelName').value = this.config.model_name || 'glm-4';
      }
    }
  }

  hideConfigPanel() {
    const configModal = document.getElementById('configModal');
    if (configModal) {
      configModal.classList.remove('open');
    }
  }

  showChatWidget() {
    const chatWidget = document.getElementById('chatWidget');
    if (chatWidget) {
      chatWidget.style.display = 'block';
    }
  }

  hideChatWidget() {
    const chatWidget = document.getElementById('chatWidget');
    if (chatWidget) {
      chatWidget.style.display = 'none';
    }
  }

  async saveConfig() {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const modelName = document.getElementById('modelName').value.trim();

    if (!apiUrl || !apiKey || !modelName) {
      alert('请填写完整的配置信息');
      return;
    }

    try {
      const submitBtn = document.querySelector('#configForm button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = '保存中...';

      await window.api.aiConfig.save({
        apiUrl,
        apiKey,
        modelName
      });

      // 保存配置到本地
      this.config = {
        api_url: apiUrl,
        api_key: apiKey,
        model_name: modelName
      };

      // 隐藏配置面板，显示聊天界面
      this.hideConfigPanel();
      this.showChatWidget();

      submitBtn.disabled = false;
      submitBtn.textContent = originalText;

      alert('配置保存成功！');
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存配置失败: ' + error.message);
      
      const submitBtn = document.querySelector('#configForm button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = '保存配置';
    }
  }

  getConfig() {
    return this.config;
  }
}

// 初始化配置管理器
let configManager;
document.addEventListener('DOMContentLoaded', () => {
  configManager = new ConfigManager();
  window.configManager = configManager;
});
