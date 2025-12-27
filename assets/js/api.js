// API 基础配置
const SUPABASE_URL = window.SUPABASE_CONFIG?.url || 'https://wlbyykbhktqxqkxjdtod.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.key || 'sb_publishable_h93sXm8Qq-VpqQT6JIVtVg__7_8zLJB';

// Supabase API 请求封装
async function supabaseRequest(table, options = {}) {
  const { method = 'GET', body, filters = {} } = options;
  
  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  
  // 构建查询参数
  const params = new URLSearchParams();
  if (filters.select) params.append('select', filters.select);
  if (filters.eq) {
    Object.entries(filters.eq).forEach(([key, value]) => {
      params.append(key, `eq.${value}`);
    });
  }
  if (filters.order) {
    params.append('order', filters.order);
  }
  
  if (params.toString()) {
    url += '?' + params.toString();
  }

  const config = {
    method,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };

  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    if (method === 'DELETE') {
      return {};
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// 智谱AI API 调用（直接调用，不使用后端代理）
async function callZhipuAPI(message, config) {
  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [
          {
            role: 'system',
            content: '你是一个AI工具助手，专门帮助用户了解和推荐AI工具。请用友好、易懂的方式回答问题。'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API调用失败');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Zhipu API error:', error);
    throw error;
  }
}

// Categories API
const categoriesAPI = {
  getAll: async () => {
    return await supabaseRequest('categories', {
      filters: {
        order: 'sort_order.asc'
      }
    });
  },

  getById: async (id) => {
    const result = await supabaseRequest('categories', {
      filters: {
        eq: { id }
      }
    });
    return result[0];
  }
};

// Resources API
const resourcesAPI = {
  getAll: async (filters = {}) => {
    const queryFilters = {};
    if (filters.category_id) {
      queryFilters.eq = { category_id: filters.category_id };
    }
    if (filters.type) {
      queryFilters.eq = { ...queryFilters.eq, type: filters.type };
    }
    if (filters.order) {
      queryFilters.order = filters.order;
    } else {
      queryFilters.order = 'created_at.desc';
    }
    
    return await supabaseRequest('learning_resources', {
      filters: queryFilters
    });
  },

  getById: async (id) => {
    const result = await supabaseRequest('learning_resources', {
      filters: {
        eq: { id }
      }
    });
    return result[0];
  }
};

// AI Config API
const aiConfigAPI = {
  get: async () => {
    try {
      const result = await supabaseRequest('ai_config', {
        filters: {
          eq: { id: 1 }
        }
      });
      return result && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('获取配置失败:', error);
      return null;
    }
  },

  save: async (config) => {
    // 使用 UPSERT 方式：先尝试更新，如果不存在则插入
    try {
      // 先尝试更新（使用 PATCH）
      const updateUrl = `${SUPABASE_URL}/rest/v1/ai_config?id=eq.1`;
      const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          api_url: config.apiUrl,
          api_key: config.apiKey,
          model_name: config.modelName
        })
      });

      // 如果更新成功（200或204），返回结果
      if (updateResponse.ok) {
        const result = await updateResponse.json();
        return result.length > 0 ? result[0] : result;
      }

      // 如果更新失败（可能是记录不存在），尝试插入
      if (updateResponse.status === 404 || updateResponse.status === 406) {
        const insertUrl = `${SUPABASE_URL}/rest/v1/ai_config`;
        const insertResponse = await fetch(insertUrl, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            id: 1,
            api_url: config.apiUrl,
            api_key: config.apiKey,
            model_name: config.modelName
          })
        });

        if (!insertResponse.ok) {
          const errorText = await insertResponse.text();
          console.error('插入配置失败 - 响应:', errorText);
          let errorMessage = `保存配置失败: ${insertResponse.status} ${insertResponse.statusText}`;
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) {
              errorMessage += ` - ${errorJson.message}`;
            }
            if (errorJson.hint) {
              errorMessage += ` (提示: ${errorJson.hint})`;
            }
          } catch (e) {
            if (errorText) {
              errorMessage += ` - ${errorText}`;
            }
          }
          throw new Error(errorMessage);
        }

        const result = await insertResponse.json();
        return result.length > 0 ? result[0] : result;
      }

      // 其他错误
      const errorText = await updateResponse.text();
      console.error('更新配置失败 - 响应:', errorText);
      throw new Error(`保存配置失败: ${updateResponse.status} ${updateResponse.statusText} - ${errorText}`);
    } catch (error) {
      console.error('保存配置失败:', error);
      throw error;
    }
  }
};

// Conversations API
const conversationsAPI = {
  save: async (message, response) => {
    return await supabaseRequest('conversations', {
      method: 'POST',
      body: {
        message,
        response
      }
    });
  }
};

// 导出
window.api = {
  categories: categoriesAPI,
  resources: resourcesAPI,
  aiConfig: aiConfigAPI,
  conversations: conversationsAPI,
  callZhipuAPI
};