import { LoginService } from "@apiServices/auth/service/LoginService";
import { ContactService } from "@apiServices/contact/service/ContactService";
import { MasterService } from "@apiServices/master/service/MasterService";
import { DashBoardService } from "@apiServices/dashboard/service/DashBoardService";
import { CaseService } from "@apiServices/case/service/CaseService";
import { DocketService } from "@apiServices/docket/service/DocketService";
import { DocumentService } from "@apiServices/document/service/DocumentService";

let instance: ApiService;

export class ApiService {
  private _loginService?: LoginService;
  private _contactService?: ContactService;
  private _masterService?: MasterService;
  private _dashBoardService?: DashBoardService;
  private _caseService?: CaseService;
  private _docketService?: DocketService;
  private _documentService?: DocumentService;

  static getInstance() {
    if (!instance) {
      instance = new ApiService();
    }
    return instance;
  }

  constructor() {
    this.loginService = new LoginService();
    this.contactService = new ContactService();
    this.masterService = new MasterService();
    this.dashBoardService = new DashBoardService();
    this.caseService = new CaseService();
    this.docketService = new DocketService();
    this.documentService = new DocumentService();
  }

  get loginService(): LoginService {
    return this._loginService || new LoginService();
  }

  set loginService(value: LoginService) {
    this._loginService = value;
  }

  get masterService(): MasterService {
    return this._masterService || new MasterService();
  }

  set masterService(value: MasterService) {
    this._masterService = value;
  }


  get contactService(): ContactService {
    return this._contactService || new ContactService();
  }

  set contactService(value: ContactService) {
    this._contactService = value;
  }

  get dashBoardService(): DashBoardService {
    return this._dashBoardService || new DashBoardService();
  }

  set dashBoardService(value: DashBoardService) {
    this._dashBoardService = value;
  }

  get caseService(): CaseService {
    return this._caseService || new CaseService();
  }

  set caseService(value: CaseService) {
    this._caseService = value;
  }

  get docketService(): DocketService {
    return this._docketService || new DocketService();
  }

  set docketService(value: DocketService) {
    this._docketService = value;
  }

  get documentService(): DocumentService {
    return this._documentService || new DocumentService();
  }

  set documentService(value: DocumentService) {
    this._documentService = value;
  }

}
