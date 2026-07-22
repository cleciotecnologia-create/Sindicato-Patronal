export type UserRole = 
  | 'admin' 
  | 'presidencia' 
  | 'diretoria' 
  | 'gerencia' 
  | 'gerente' 
  | 'associado' 
  | 'atendimento' 
  | 'suporte';

export interface UserProfile {
  uid: string;
  email: string;
  nome: string;
  displayName?: string;
  empresaId: string;
  cnpj?: string;
  phone?: string;
  companyName?: string;
  role: UserRole | string;
  ativo: boolean;
  approved?: boolean;
  photoURL?: string;
  mustChangePassword?: boolean;
  firstAccess?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthErrorState {
  code?: string;
  message: string;
  isPermissionDenied: boolean;
  rawError?: any;
}
