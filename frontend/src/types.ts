export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'thinking' | 'working' | 'waiting_approval' | 'error';
  current_task: string;
  desk_x: number;
  desk_y: number;
  model_used: string;
  total_actions: number;
  last_active: string;
}

export interface AgentLog {
  id: number;
  agent_id: string;
  business_id?: string;
  log_type: 'thought' | 'tool_call' | 'tool_result' | 'error' | 'milestone';
  message: string;
  metadata?: any;
  created_at: string;
}

export interface Task {
  id: string;
  business_id?: string;
  assigned_to: string;
  title: string;
  description?: string;
  status: 'backlog' | 'in_progress' | 'review' | 'completed';
  priority?: string;
  created_at: string;
}

export interface Business {
  id: string;
  whop_biz_id: string;
  whop_product_id?: string;
  name: string;
  handle: string;
  niche: string;
  category?: string;
  status: string;
  checkout_url?: string;
  promo_code?: string;
  mrr_cents: number;
  total_revenue_cents?: number;
  created_at: string;
}

export interface AgentDiscussion {
  id: number;
  sender_id: string;
  recipient_id: string;
  business_id?: string;
  message: string;
  created_at: string;
}

export interface Approval {
  id: string;
  business_id?: string;
  requested_by: string;
  action_type: string;
  summary: string;
  raw_payload?: any;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
