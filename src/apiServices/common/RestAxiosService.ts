import { UrlUtil } from "./UrlUtil";
import _ from "lodash";
import axios, { AxiosInstance } from "axios";
import AuthStorage from "../../context/AuthStorage";

export interface IHeader {
  Accept?: string;
  "Accept-Language"?: string;
  "Content-Type"?: string;
  Authorization?: string;
  "X-CSRF-TOKEN"?: string;
  Host?: string;
}

export class UserInputError {
  constructor(message: string, extensions?: Record<string, any>) {
    Object.defineProperty(this, "name", { value: "UserInputError" });
  }
}

export class RestAxiosService {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (accessToken: string) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.axiosInstance = axios.create();
    this.setupInterceptors();
  }

  // ─── Token refresh helpers ──────────────────────────────────────────────────

  private processQueue(error: any, accessToken: string | null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(accessToken!);
      }
    });
    this.failedQueue = [];
  }

  /** Calls the refresh endpoint with plain axios (bypasses interceptors to avoid loops).
   *  Saves the new token pair and returns the new access token.
   *  Throws if the refresh token is also expired or the call fails. */
  private async doRefreshToken(): Promise<string> {
    const requestUrl = this.getHostUrl() + "/auth/refresh";
    const response = await axios.post(requestUrl, AuthStorage.getRefreshToken(), {
      headers: this.createHeaders(),
      timeout: 10000,
    });

    const responseData = response.data;

    // Refresh token itself expired
    if (responseData?.hasError && responseData?.error?.errorCode === "TOKEN_EXPIRED") {
      throw new Error("REFRESH_TOKEN_EXPIRED");
    }

    if (responseData?.data?.accessToken) {
      await AuthStorage.saveToken(responseData.data);
      return responseData.data.accessToken;
    }

    throw new Error("Token refresh failed: unexpected response");
  }

  // ─── Axios interceptors ──────────────────────────────────────────────────────

  private setupInterceptors() {
    // Request interceptor – attach Authorization header
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const auth = AuthStorage.getAuthorization();
        if (auth) {
          config.headers.Authorization = auth;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor – handle TOKEN_EXPIRED in both 2xx bodies and error responses
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Some APIs return HTTP 200 with TOKEN_EXPIRED in the body
        const body = response.data;
        if (body?.hasError && body?.error?.errorCode === "TOKEN_EXPIRED") {
          const tokenError: any = new Error("TOKEN_EXPIRED");
          tokenError.config = response.config;
          tokenError.response = response;
          return Promise.reject(tokenError);
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        const serverData = error?.response?.data;
        const isTokenExpired =
          serverData?.hasError && serverData?.error?.errorCode === "TOKEN_EXPIRED";

        if (isTokenExpired && originalRequest && !originalRequest._retry) {
          // Another refresh is already in progress – queue this request
          if (this.isRefreshing) {
            return new Promise<string>((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((accessToken) => {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.axiosInstance(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newAccessToken = await this.doRefreshToken();
            this.processQueue(null, newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            AuthStorage.deleteToken();
            window.location.href = "/";
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ─── Common helpers ──────────────────────────────────────────────────────────

  createHeaders() {
    let headers: IHeader = {
      "Accept": "*/*",
      "Content-Type": "application/json; charset=utf-8",
    };
    return headers;
  }

  getHostUrl() {
    const appBaseUrl = import.meta.env.VITE_API_URL;
    //  console.log("%cappBaseUrl:", "color:red", appBaseUrl);
    //return process.env.REACT_APP_API_URL + "/api";
    //return appBaseUrl + "/api";
    return appBaseUrl;
    // return "http://localhost:1111" + "/api";
  }

  // ─── Request methods ─────────────────────────────────────────────────────────

  async getRequest(
    baseURL: string,
    path: string,
    qs: Record<string, any> = {},
    headers: Record<string, any> = {}
  ) {
    let data = null;
    let loaded = false;
    let errorMessage = "";
    let hasError = true;
    let hasData = false;
    const _headers = _.merge(this.createHeaders(), headers);
    // delete _headers["Content-Type"];  // todo important remove this line after testing, GET requests should not have content-type header, but this is a workaround for now to avoid axios adding content-type header to GET requests and causing issues with some servers. Ideally the createHeaders method should be smarter about which headers to include based on the request type.   
    // delete _headers["content-type"];  // todo remove this line after testing, GET requests should not have content-type header, but this is a workaround for now to avoid axios adding content-type header to GET requests and causing issues with some servers. Ideally the createHeaders method should be smarter about which headers to include based on the request type.   

    const config = {
      baseURL: this.getHostUrl(),
      headers: _headers,
      withCredentials: false,
    };

    const requestUrl = this.getHostUrl() + UrlUtil.createPath(path, qs);

    try {
      const response = await this.axiosInstance.get(requestUrl, config);
      data = response.data;
    } catch (err: any) {
      errorMessage = err?.response?.data || err?.message || err;
      console.log("error-1", errorMessage);
      console.log("error-11", err?.response?.data);
    } finally {
      loaded = true;
    }

    //console.log("error-2" + data);
    return { data, errorMessage, loaded, hasError, hasData };
  }

  async postRequest(
    baseURL: string,
    path: string,
    body: any,
    headers: Record<string, any> = {},
    apiName: string
  ) {

    const requestUrl = this.getHostUrl() + path;
    const _headers = _.merge(this.createHeaders(), headers);

    const config = {
      baseURL: this.getHostUrl(),
      headers: _headers,
      timeout: 10000, // 10 seconds
      withCredentials: true,  // this sends/receives cookies
    };

    try {
      const response = await this.axiosInstance.post(requestUrl, body, config);
      return {
        data: response.data,
        errorMessage: "",
        loaded: true,
        hasError: false,
        hasData: true
      };
    } catch (err: any) {
      let serverErrorPayload;
      let errorMessage = "Unknown error";
      let hasError = true;
      let hasData = false;

      if (err.response && err.response.data) {
        serverErrorPayload = err.response.data;
        errorMessage = serverErrorPayload.message || JSON.stringify(serverErrorPayload);
        hasError = true;
        hasData = false;

        if (
          serverErrorPayload.error?.code === "INPUT_ERROR" &&
          serverErrorPayload.error.errors
        ) {
          throw new UserInputError(apiName, serverErrorPayload.error.errors);
        }

        if (serverErrorPayload.error?.code === "BAD_CREDENTIALS") {
          console.warn("🚫 BAD_CREDENTIALS");
        }
      } else if (err.message) {
        errorMessage = err.message;
        hasError = true;
        hasData = false;
      }

      return {
        data: null,
        errorMessage,
        loaded: true,
        hasError: hasError,
        hasData: hasData
      };
    }
  }


  async putRequest(
    baseURL: string,
    path: string,
    body: any,
    headers: Record<string, any> = {},
    apiName: string
  ) {

    const requestUrl = this.getHostUrl() + path;
    const _headers = _.merge(this.createHeaders(), headers);

    const config = {
      baseURL: this.getHostUrl(),
      headers: _headers,
      timeout: 10000, // 10 seconds
      withCredentials: true,  // this sends/receives cookies
    };

    try {
      const response = await this.axiosInstance.put(requestUrl, body, config);
      return {
        data: response.data,
        errorMessage: "",
        loaded: true,
        hasError: false,
        hasData: true
      };
    } catch (err: any) {
      let serverErrorPayload;
      let errorMessage = "Unknown error";
      let hasError = true;
      let hasData = false;

      if (err.response && err.response.data) {
        serverErrorPayload = err.response.data;
        errorMessage = serverErrorPayload.message || JSON.stringify(serverErrorPayload);
        hasError = true;
        hasData = false;

        if (
          serverErrorPayload.error?.code === "INPUT_ERROR" &&
          serverErrorPayload.error.errors
        ) {
          throw new UserInputError(apiName, serverErrorPayload.error.errors);
        }

        if (serverErrorPayload.error?.code === "BAD_CREDENTIALS") {
          console.warn("🚫 BAD_CREDENTIALS");
        }
      } else if (err.message) {
        errorMessage = err.message;
        hasError = true;
        hasData = false;
      }

      return {
        data: null,
        errorMessage,
        loaded: true,
        hasError: hasError,
        hasData: hasData
      };
    }
  }

  async putRequest_(
    baseURL: string,
    path: string,
    body: any,
    headers: Record<string, any> = {},
    apiName: string
  ) {
    let data = null;
    let loaded = false;
    let errorMessage = "";
    const requestUrl = this.getHostUrl() + path;
    const _headers = _.merge(this.createHeaders(), headers);
    const config = {
      baseURL: this.getHostUrl(),
      headers: _headers,
    };
    await this.axiosInstance
      .put(requestUrl, JSON.stringify(body), config)
      .then((response: any) => {
        data = response.data;
      })
      .catch((err: any) => {
        // console.log("%cerror-err:", "color:yellow", err);
        let serverErrorPayload;
        if (err.error) {
          try {
            serverErrorPayload = JSON.parse(err.error);
          } catch (e) { }
        }

        if (err.statusCode === 400 && serverErrorPayload) {
          console.log("%cerror-serverErrorPayload:", "color:yellow", serverErrorPayload);
          if (
            serverErrorPayload.error &&
            serverErrorPayload.error.code === "INPUT_ERROR" &&
            serverErrorPayload.error.errors
          ) {
            // console.log("%cthrows:", "color:yellow");
            throw new UserInputError(apiName, serverErrorPayload.error.errors);
          }
          if (serverErrorPayload.error && serverErrorPayload.error.code === "BAD_CREDENTIALS") {
            console.log("%c get - BAD_CREDENTIALS:", "color:yellow");
          }
        }

        // return Promise.reject(
        //   new Error(`postRequest: ${apiName} network error. ${JSON.stringify(err)}`)
        // );

        // console.log("%c catch-response:", "color:yellow", err.response.data);

        // throw new UserInputError('test', err.response.data.error.errorsAsList || []);

        // console.log('%c catch-response:', 'color:yellow', err.response.data);
        errorMessage = err.response.data || err.message;
        // if (400 <= err.response.status && err.response.status < 499) {
        //   errorLevel = 'WARN';
        // }
        // if (500 <= err.response.status && err.response.status < 599) {
        //   errorLevel = 'ERROR';
        // }
      })
      .finally(() => (loaded = true));
    return { data, errorMessage, loaded };
  }

  async deleteRequest(
    baseURL: string,
    path: string,
    body: any,
    headers: Record<string, any> = {},
    apiName: string
  ) {
    let data = null;
    let loaded = false;
    let errorMessage = "";
    const requestUrl = this.getHostUrl() + path;
    const _headers = _.merge(this.createHeaders(), headers);
    await this.axiosInstance
      .delete(requestUrl, { baseURL: this.getHostUrl(), headers: _headers, data: body })
      .then((response: any) => {
        data = response.data;
      })
      .catch((err: any) => {
        console.log("%c catch-error:", "color:yellow", err.response.data);
        let serverErrorPayload;
        if (err.error) {
          try {
            serverErrorPayload = JSON.parse(err.error);
          } catch (e) { }
        }

        if (err.statusCode === 400 && serverErrorPayload) {
          if (
            serverErrorPayload.error &&
            serverErrorPayload.error.code === "INPUT_ERROR" &&
            serverErrorPayload.error.errors
          ) {
            throw new UserInputError(apiName, serverErrorPayload.error.errors);
          }
          if (serverErrorPayload.error && serverErrorPayload.error.code === "BAD_CREDENTIALS") {
            console.log("%c get - BAD_CREDENTIALS:", "color:yellow");
          }
        }

        // return Promise.reject(
        //   new Error(`postRequest: ${apiName} network error. ${JSON.stringify(err)}`)
        // );
      })
      .finally(() => (loaded = true));
    return { data, errorMessage, loaded };
  }

  /*

fetch("http://localhost:1007/api/auth/refresh", {
  "headers": {
    "accept": "",
    "accept-language": "en-US,en;q=0.9",
  "content-type": "application/json",
  "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"",
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "\"macOS\"",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin"
},
"referrer": "http://localhost:1007/swagger-ui/index.html",
  "body": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIyIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NTcxNjgwODAsImV4cCI6MTc1Nzc3Mjg4MH0.Ica3qypOLTNQDDDFCHE1NRCExTxkUxFKWhHLBCVHs0Ju-pEU2aSsxMJLgW66ZdHKV5rK4MmU9lGeWGjf3lq6tw",
    "method": "POST",
      "mode": "cors",
        "credentials": "include"
});

  */



  async fileUploadRequest(
    baseURL: string,
    path: string,
    headers: Record<string, any> = {},
    FormDataObj: FormData | undefined,
    onUploadProgress: any,
    body: any
  ) {
    const requestUrl = this.getHostUrl() + path;
    const _headers = _.merge(this.createHeaders(), headers);

    return await this.axiosInstance.post(requestUrl, FormDataObj, {
      baseURL: this.getHostUrl(),
      headers: _headers,
      onUploadProgress,
    });
  }
}
