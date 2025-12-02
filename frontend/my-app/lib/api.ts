/**
 * API 工具函数
 * 统一处理后端API请求
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

/**
 * 统一错误响应格式
 */
interface ApiError {
  code: number
  message: string
  details?: any
}

/**
 * 通用分页响应
 */
interface PageResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

/**
 * 通用API请求函数
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // 允许发送Cookie
    })
    
    const text = await response.text()
    const data = text ? JSON.parse(text) : null
    if (!response.ok) {
      const errorInfo: ApiError = data
      throw new Error(errorInfo?.message || `API Error: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error(`API Request Failed [${endpoint}]:`, error)
    throw error
  }
}

/**
 * 发票相关API
 */
export const invoiceApi = {
  /**
   * 获取发票列表（分页+筛选）
   */
  async list(params: {
    page?: number
    size?: number
    created_from?: string
    created_to?: string
    ile?: string
    cm?: string
    status?: string
    progress?: string
    current_step?: number
  } = {}) {
    const queryParams = new URLSearchParams()
    
    const { page = 1, size = 50, ...rest } = params
    queryParams.append('page', String(page))
    queryParams.append('size', String(size))
    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value))
      }
    })

    const queryString = queryParams.toString()
    const endpoint = `/api/invoices${queryString ? `?${queryString}` : ''}`

    return apiRequest<PageResponse<any>>(endpoint)
  },
  
  /**
   * 获取发票详情
   */
  async getById(id: string) {
    return apiRequest<any>(`/api/invoices/${id}`)
  },
  
  /**
   * 创建发票
   */
  async create(data: any) {
    return apiRequest<any>(`/api/invoices`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  /**
   * 更新发票
   */
  async update(id: string, data: any) {
    return apiRequest<any>(`/api/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  
  /**
   * 删除发票
   */
  async delete(id: string) {
    return apiRequest<void>(`/api/invoices/${id}`, {
      method: 'DELETE',
    })
  },
  
  /**
   * 更新工作包
   */
  async updateWorkpackage(invoiceId: string, workpackageId: string, data: {
    actual_date?: string
    remark?: string
  }) {
    return apiRequest<any>(`/api/invoices/${invoiceId}/workpackages/${workpackageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

/**
 * 客户相关API
 */
export const customerApi = {
  /**
   * 获取客户列表
   */
  async list(params: { page?: number; size?: number } = {}) {
    const queryParams = new URLSearchParams()
    const { page = 1, size = 50 } = params
    queryParams.append('page', String(page))
    queryParams.append('size', String(size))

    const endpoint = `/api/customers?${queryParams.toString()}`
    return apiRequest<PageResponse<any>>(endpoint)
  },
  
  /**
   * 获取客户详情
   */
  async getById(id: string) {
    const safeId = encodeURIComponent(id)
    return apiRequest<any>(`/api/customers/${safeId}`)
  },
  
  /**
   * 创建客户
   */
  async create(data: any) {
    return apiRequest<any>(`/api/customers`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  /**
   * 更新客户信息
   */
  async update(id: string, data: any) {
    const safeId = encodeURIComponent(id)
    return apiRequest<any>(`/api/customers/${safeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  
  /**
   * 删除客户
   */
  async delete(id: string) {
    const safeId = encodeURIComponent(id)
    return apiRequest<void>(`/api/customers/${safeId}`, {
      method: 'DELETE',
    })
  },
  
  /**
   * 获取客户的规则列表
   */
  async getRules(customerId: string) {
    const safeId = encodeURIComponent(customerId)
    return apiRequest<any[]>(`/api/customers/${safeId}/rules`)
  },
  
  /**
   * 批量设置客户的规则（幂等操作）
   */
  async setRules(customerId: string, rules: any[]) {
    const safeId = encodeURIComponent(customerId)
    return apiRequest<any[]>(`/api/customers/${safeId}/rules`, {
      method: 'PUT',
      body: JSON.stringify(rules),
    })
  },
}

/**
 * 用户相关API
 */
export const userApi = {
  async list(role?: "lcm" | "cm", page = 1, size = 50) {
    const queryParams = new URLSearchParams()
    if (role) {
      queryParams.append("role", role)
    }
    queryParams.append("page", String(page))
    queryParams.append("size", String(size))
    const queryString = queryParams.toString()
    return apiRequest<PageResponse<any>>(`/api/users${queryString ? `?${queryString}` : ""}`)
  },

  async getById(id: string, role?: "lcm" | "cm") {
    const queryParams = new URLSearchParams()
    if (role) {
      queryParams.append("role", role)
    }
    const queryString = queryParams.toString()
    return apiRequest<any>(`/api/users/${encodeURIComponent(id)}${queryString ? `?${queryString}` : ""}`)
  },

  async create(data: {
    name: string
    nt_account: string
    region: string
    role: "cm" | "lcm"
    scnx?: "SCN1" | "SCN2" | null
  }) {
    return apiRequest<any>(`/api/users`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async update(
    id: string,
    data: {
      name?: string
      nt_account?: string
      region?: string
      role?: "cm" | "lcm"
      scnx?: "SCN1" | "SCN2" | null
    }
  ) {
    return apiRequest<any>(`/api/users/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async delete(id: string) {
    return apiRequest<void>(`/api/users/${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
  },
}

/**
 * 模板相关API
 */
export const templateApi = {
  async list() {
    return apiRequest<any[]>(`/api/templates`)
  },
}

