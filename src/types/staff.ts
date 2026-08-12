export interface StaffRecord {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthenticatedStaff {
  id: number;
  email: string;
  name: string;
}

export interface LoginResult {
  token: string;
  tokenType: 'Bearer';
  staff: AuthenticatedStaff;
}
