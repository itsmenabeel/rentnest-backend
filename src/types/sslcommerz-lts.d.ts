declare module 'sslcommerz-lts' {
  type SSLCommerzInitData = Record<string, string | number | boolean | undefined>;
  type SSLCommerzQueryData = Record<string, string | number | boolean | undefined>;

  class SSLCommerzPayment {
    constructor(storeId: string, storePassword: string, isLive?: boolean);
    init(data: SSLCommerzInitData): Promise<Record<string, unknown>>;
    validate(data: SSLCommerzQueryData): Promise<Record<string, unknown>>;
    transactionQueryByTransactionId(data: SSLCommerzQueryData): Promise<Record<string, unknown>>;
    transactionQueryBySessionId(data: SSLCommerzQueryData): Promise<Record<string, unknown>>;
  }

  export = SSLCommerzPayment;
}
