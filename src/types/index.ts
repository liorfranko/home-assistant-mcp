// Type definitions for Home Assistant MCP

// Basic entity interface
export interface Entity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed?: string;
  last_updated?: string;
}

// Automation entity interface
export interface Automation extends Entity {
  attributes: {
    friendly_name?: string;
    last_triggered?: string;
    [key: string]: any;
  };
}

// Update entity interface
export interface UpdateEntity extends Entity {
  attributes: {
    friendly_name?: string;
    installed_version: string;
    latest_version: string;
    release_url?: string;
    release_summary?: string;
    update_available?: boolean;
    [key: string]: any;
  };
}

// Backup interface
export interface Backup {
  slug: string;
  name: string;
  date: string;
  size: number;
  location: "local" | "remote";
  protected: boolean;
  compressed: boolean;
  content: {
    homeassistant: boolean;
    addons: string[];
    folders: string[];
  };
  type: "full" | "partial";
}

// API headers interface
export interface ApiHeaders {
  Authorization: string;
  "Content-Type": string;
}

// API error interface
export interface ApiError {
  status?: number;
  data?: any;
  message: string;
}

// Service call result interface
export interface ServiceCallResult {
  success: boolean;
  message: string;
  details?: any;
}

// Node-RED flow interfaces
export interface NodeRedFlow {
  id: string;
  type: string;
  label?: string;
  disabled?: boolean;
  info?: string;
  [key: string]: any;
}

// Formatted Node-RED flow interface
export interface FormattedNodeRedFlow {
  id: string;
  name: string;
  disabled: boolean;
  info: string;
  nodes?: {
    id: string;
    type: string;
    name: string;
    wires: any[];
  }[];
} 