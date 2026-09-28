import { RestAxiosService } from "./RestAxiosService";
import { PageRequest } from "../common/domain/PageRequest";
import { Authentication } from "../common/Authentication";
import AuthStorage from "@context/AuthStorage";

export interface RequestParams {
  baseURL: string;
  path: string;
  qs?: Record<string, any>;
  headers?: Record<string, any>;
  body?: any;
  useRequestBody?: boolean;
  classRef?: any;
  skipRequestBodyParsing?: boolean;
  apiName: string;
  authentication?: Authentication;
  pageRequest?: PageRequest;
  FormDataObj?: FormData;
  onUploadProgress?: any;
}
export class ApiRestService {


  private _restService: RestAxiosService;

  constructor() {
    this._restService = new RestAxiosService();
  }

  toHeaders() {
    let headers: Record<string, any> = {};
    headers["Authorization"] = AuthStorage.getAuthorization();
    return headers;
  }

  async getPage(params: RequestParams): Promise<any> {
    const response = await this.restService.getRequest(
      params.baseURL,
      params.path,
      params.pageRequest ? params.pageRequest.toApiPageRequestArgs(params.qs) : params.qs,
      params.headers
    );
    return response;
  }

  async get(params: RequestParams): Promise<any> {
    return this.restService.getRequest(params.baseURL, params.path, params.qs, params.headers);
  }

  async post(params: RequestParams): Promise<any> {
    return this.restService.postRequest(
      params.baseURL,
      params.path,
      params.body,
      params.headers,
      params.apiName
    );
  }

  async put(params: RequestParams): Promise<any> {
    return this.restService.putRequest(
      params.baseURL,
      params.path,
      params.body,
      params.headers,
      params.apiName
    );
  }

  async delete(params: RequestParams): Promise<any> {
    return this.restService.deleteRequest(
      params.baseURL,
      params.path,
      params.body,
      params.headers,
      params.apiName
    );
  }

  async fileUpload(params: RequestParams): Promise<any> {
    return this.restService.fileUploadRequest(
      params.baseURL,
      params.path,
      params.headers,
      params.FormDataObj,
      params.onUploadProgress,
      params.body
    );
  }

  get restService(): RestAxiosService {
    return this._restService;
  }
  set restService(value: RestAxiosService) {
    this._restService = value;
  }

}
