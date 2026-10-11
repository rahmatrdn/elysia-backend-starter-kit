export interface ApiResponse<T = any> {
  code: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: any;
  error?: any;
}

export interface JsonResponseOptions<T = any> {
  set: { status?: number | string };
  statusCode?: number;
  message: string;
  data?: T;
  meta?: any;
}

export interface JsonErrorOptions {
  set: { status?: number | string };
  statusCode?: number;
  message: string;
  error?: any;
}

export function jsonResponse<T>({
  set,
  statusCode = 200,
  message,
  data,
  meta,
}: JsonResponseOptions<T>): ApiResponse<T> {
  set.status = statusCode;

  return {
    code: statusCode,
    success: statusCode >= 200 && statusCode < 300,
    message,
    ...(data !== undefined ? { data } : {}),
    ...(meta !== undefined ? { meta } : {}),
  };
}

export function jsonError({
  set,
  statusCode = 500,
  message,
  error,
}: JsonErrorOptions): ApiResponse {
  set.status = statusCode;

  return {
    code: statusCode,
    success: false,
    message,
    ...(error !== undefined ? { error } : {}),
  };
}
