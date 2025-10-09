// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// Auth Types
export type AuthType = 'none' | 'basic' | 'bearer' | 'apiKey' | 'token' | 'oauth2';

export interface BasicAuth {
  type: 'basic';
  username: string;
  password: string;
}

export interface BearerAuth {
  type: 'bearer';
  token: string;
}

export interface ApiKeyAuth {
  type: 'apiKey';
  name: string;
  value: string;
  location: 'header' | 'query';
}

export interface TokenAuth {
  type: 'token';
  configId: number;
  config?: TokenConfig;
}

export type AuthConfig = BasicAuth | BearerAuth | ApiKeyAuth | TokenAuth | { type: 'none' };

// API Source Types
export interface ApiSource {
  id: number;
  name: string;
  baseUrl: string;
  authType: AuthType;
  headers?: Header[];
  username?: string;
  password?: string;
  token?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyLocation?: 'header' | 'query';
  tokenConfigId?: number;
  tokenConfig?: TokenConfig;
  status: 'active' | 'inactive';
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Header {
  key: string;
  value: string;
}

// API Request Types
export interface ApiRequest {
  id: number;
  apiSourceId: number;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  pathParams?: PathParam[];
  queryParams?: QueryParam[];
  headers?: Header[];
  body?: string;
  bodyFormat?: 'json' | 'form' | 'raw';
  status: 'active' | 'inactive';
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
  apiSource?: ApiSource;
}

export interface PathParam {
  name: string;
  value: string;
  required: boolean;
}

export interface QueryParam {
  name: string;
  value: string;
  required: boolean;
}

// API Extract Types
export interface ApiExtract {
  id: number;
  apiRequestId: number;
  name: string;
  rootArrayPath?: string;
  extractionPaths: ExtractionPath[];
  fieldMappings?: FieldMapping[];
  primaryKeyFields?: string[];
  nullValueHandling?: 'keep' | 'empty' | 'default';
  dateFormat?: string;
  transformScript?: string;
  status: 'active' | 'inactive';
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
  apiRequest?: ApiRequest;
}

export interface ExtractionPath {
  name: string;
  path: string;
  description: string;
  required: boolean;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
}

// Token Config Types
export interface TokenConfig {
  id: number;
  name: string;
  tokenUrl: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  grantType: 'client_credentials' | 'password' | 'authorization_code';
  scope?: string;
  additionalParams?: Record<string, string>;
  refreshTokenPath?: string;
  body?: string;
  headers?: Header[];
  method?: string;
  endpoint?: string;
  tokenPath?: string;
  expiresInPath?: string;
  expiresIn?: number;
  refreshEnabled?: boolean;
  status: 'active' | 'inactive';
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Token Test Config Interface
export interface TokenTestConfig {
  endpoint: string;
  method?: string;
  headers?: Header[];
  body?: string;
  bodyFormat?: 'json' | 'form';
  tokenPath: string;
  expiresInPath?: string;
  refreshTokenPath?: string;
}

// API Response Types
export interface TokenTestResponse {
  success: boolean;
  token: string;
  expiresIn: number | null;
  refreshToken: string | null;
  fullResponse: any;
}

export interface ApiTestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  ok: boolean;
}

export interface TestResult {
  success: boolean;
  statusCode: number;
  data: any;
  headers: Record<string, string>;
  message: string;
  tokenUsed?: boolean;
  token?: string;
  error?: string;
}

// Dynamic Table Types
export interface DynamicTable {
  tableName: string;
  columns: TableColumn[];
}

export interface TableColumn {
  name: string;
  mappedField?: string; // JSON path for data extraction
  type: 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'text';
  nullable?: boolean;
  defaultValue?: any;
  primaryKey?: boolean;
}

// Form Types
export interface SourceFormData {
  name: string;
  baseUrl: string;
  authType: AuthType;
  headers?: Header[];
  username?: string;
  password?: string;
  token?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyLocation?: 'header' | 'query';
  tokenConfig?: {
    selectedConfigId?: number;
  };
}

export interface RequestFormData {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  pathParams?: PathParam[];
  queryParams?: QueryParam[];
  headers?: Header[];
  body?: string;
  bodyFormat?: 'json' | 'form' | 'raw';
}

export interface ExtractFormData {
  name: string;
  rootArrayPath?: string;
  extractionPaths: ExtractionPath[];
  fieldMappings?: FieldMapping[];
  primaryKeyFields?: string[];
  nullValueHandling?: 'keep' | 'empty' | 'default';
  dateFormat?: string;
  transformScript?: string;
}

// Test Response Types
export interface TestResponse {
  data: any[];
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
  };
  count: number;
}

// Wizard Step Types
export interface WizardStepProps {
  onNext: () => void;
  onPrevious: () => void;
  sourceData?: ApiSource;
  requestData?: ApiRequest;
  initialData?: any;
  isEditMode?: boolean;
}

// Table Column Types
export interface TableColumnConfig {
  title: string;
  dataIndex?: string;
  key: string;
  sorter?: (a: any, b: any) => number;
  filter?: boolean;
  filters?: FilterOption[];
  onFilter?: (value: any, record: any) => boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
  ellipsis?: boolean;
}

// Filter Types
export interface FilterOption {
  text: string;
  value: string;
}

// Pagination Types
export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: (total: number, range: [number, number]) => string;
}
