export type SuccessResponse<T> = {
  statusCode: number;
  message: string;
  data: T;
};
