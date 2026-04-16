export interface JsonMap {
  [key: string]: JsonValue | undefined;
}

export type JsonValue = string | number | boolean | null | JsonMap | JsonValue[];

export interface Database {
  public: {
    Tables: Record<string, unknown>;
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, unknown>;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: string;
}
