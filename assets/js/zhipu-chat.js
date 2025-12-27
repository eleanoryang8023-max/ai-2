// AI Chat Widget
class ZhipuChat {
  constructor() {
    this.isOpen = false;
    this.init();
  }

  init() {
    const toggleBtn = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const closeBtn = document.getElementById('chatClose');
    const sendBtn = document.getElementById('chatSend');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    if (!toggleBtn || !chatWindow) return;

    toggleBtn.addEventListener('click', () => this.toggle());
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    
    if (sendBtn && chatInput) {
      sendBtn.addEventListener('click', () => this.sendMessage());
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });
    }
  }

  toggle() {
    const chatWindow = document.getElementById('chatWindow');
    const user = window.auth && window.auth.getCurrentUser();
    
    if (!this.isOpen) {
      // Check if user is logged in
      if (!window.api.getToken()) {
        if (confirm('请先登录以使用AI助手功能。是否前往登录页面？')) {
          window.location.href = 'login.html';
        }
        return;
      }
      this.open();
    } else {
      this.close();
    }
  }

  open() {
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow) {
      chatWindow.classList.add('open');
      this.isOpen = true;
      
      // Add welcome message
      const chatMessages = document.getElementById('chatMessages');
      if (chatMessages && chatMessages.children.length === 0) {
        this.addMessage('assistant', '你好！我是AI学习助手，可以帮助你解答AI学习相关的问题。有什么可以帮你的吗？');
      }
      
      // Focus input
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
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const sendBtn = document.getElementById('chatSend');

    if (!chatInput || !chatMessages) return;

    const message = chatInput.value.trim();
    if (!message) return;

    // Check authentication
    if (!window.api.getToken()) {
      alert('请先登录');
      window.location.href = 'login.html';
      return;
    }

    // Add user message
    this.addMessage('user', message);
    chatInput.value = '';
    chatInput.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    // Show loading
    const loadingId = this.addMessage('assistant', '正在思考...', true);

    try {
      const response = await window.api.zhipu.chat(message);
      
      // Remove loading message and add actual response
      const loadingMsg = document.getElementById(loadingId);
      if (loadingMsg) loadingMsg.remove();
      
      this.addMessage('assistant', response);
    } catch (error) {
      // Remove loading message
      const loadingMsg = document.getElementById(loadingId);
      if (loadingMsg) loadingMsg.remove();
      
      this.addMessage('assistant', '抱歉，我遇到了一些问题。请稍后再试。', false, true);
      console.error('Chat error:', error);
    } finally {
      chatInput.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
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
      // Format content (basic markdown support)
      messageDiv.innerHTML = this.formatMessage(content);
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageId;
  }

  formatMessage(content) {
    // Simple formatting - escape HTML and convert line breaks
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Convert line breaks to <br>
    const withBreaks = escaped.replace(/\n/g, '<br>');
    
    // Simple markdown-style formatting
    return withBreaks
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">$1</code>');
  }
}

// Initialize chat widget when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.zhipuChat = new ZhipuChat();
});
