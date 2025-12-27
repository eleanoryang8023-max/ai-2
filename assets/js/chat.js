// AI聊天功能
class ChatManager {
  constructor() {
    this.isOpen = false;
    this.config = null;
    this.init();
  }

  async init() {
    // 获取配置
    if (window.configManager) {
      this.config = window.configManager.getConfig();
    }

    // 如果配置不存在，从API加载
    if (!this.config) {
      try {
        this.config = await window.api.aiConfig.get();
      } catch (error) {
        console.error('加载配置失败:', error);
      }
    }

    this.bindEvents();
  }

  bindEvents() {
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatSend = document.getElementById('chatSend');
    const chatInput = document.getElementById('chatInput');

    if (chatToggle) {
      chatToggle.addEventListener('click', () => this.toggle());
    }

    if (chatClose) {
      chatClose.addEventListener('click', () => this.close());
    }

    if (chatSend) {
      chatSend.addEventListener('click', () => this.sendMessage());
    }

    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });
    }
  }

  toggle() {
    if (!this.config) {
      alert('请先配置API信息');
      if (window.configManager) {
        window.configManager.showConfigPanel();
      }
      return;
    }

    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow) {
      chatWindow.classList.add('open');
      this.isOpen = true;

      // 添加欢迎消息
      const chatMessages = document.getElementById('chatMessages');
      if (chatMessages && chatMessages.children.length === 0) {
        this.addMessage('assistant', '你好！我是AI工具助手，可以帮助你了解和推荐AI工具。有什么可以帮你的吗？');
      }

      // 聚焦输入框
      const chatInput = document.getElementById('chatInput');
      if (chatInput) chatInput.focus();
    }
  }

  close() {
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow) {
      chatWindow.classList.remove('open');
      this.isOpen = false;
    }
  }

  async sendMessage() {
    if (!this.config) {
      alert('请先配置API信息');
      return;
    }

    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const chatSend = document.getElementById('chatSend');

    if (!chatInput || !chatMessages) return;

    const message = chatInput.value.trim();
    if (!message) return;

    // 添加用户消息
    this.addMessage('user', message);
    chatInput.value = '';
    chatInput.disabled = true;
    if (chatSend) chatSend.disabled = true;

    // 显示加载消息
    const loadingId = this.addMessage('assistant', '正在思考...', true);

    try {
      const response = await window.api.callZhipuAPI(message, {
        apiUrl: this.config.api_url,
        apiKey: this.config.api_key,
        modelName: this.config.model_name
      });

      // 移除加载消息，添加实际回复
      const loadingMsg = document.getElementById(loadingId);
      if (loadingMsg) loadingMsg.remove();

      this.addMessage('assistant', response);

      // 保存对话记录（可选）
      try {
        await window.api.conversations.save(message, response);
      } catch (error) {
        console.error('保存对话记录失败:', error);
      }
    } catch (error) {
      // 移除加载消息
      const loadingMsg = document.getElementById(loadingId);
      if (loadingMsg) loadingMsg.remove();

      this.addMessage('assistant', '抱歉，我遇到了一些问题。请检查API配置是否正确。', false, true);
      console.error('Chat error:', error);
    } finally {
      chatInput.disabled = false;
      if (chatSend) chatSend.disabled = false;
      chatInput.focus();
    }
  }

  addMessage(role, content, isLoading = false, isError = false) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `chat-message ${role}`;

    if (isLoading) {
      messageDiv.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>';
    } else if (isError) {
      messageDiv.style.color = 'var(--danger-color)';
      messageDiv.textContent = content;
    } else {
      messageDiv.innerHTML = this.formatMessage(content);
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageId;
  }

  formatMessage(content) {
    // 简单格式化：转义HTML，转换换行
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const withBreaks = escaped.replace(/\n/g, '<br>');

    return withBreaks
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">$1</code>');
  }
}

// 初始化聊天管理器
let chatManager;
document.addEventListener('DOMContentLoaded', () => {
  // 延迟初始化，等待配置管理器完成
  setTimeout(() => {
    chatManager = new ChatManager();
    window.chatManager = chatManager;
  }, 100);
});
