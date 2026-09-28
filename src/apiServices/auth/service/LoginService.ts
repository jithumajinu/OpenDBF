import { ApiRestService } from "../../common/ApiRestService";
export class LoginService extends ApiRestService {

  toHeadersWithoutAuth() {
    let headers: Record<string, any> = {};
    return headers;
  }

  async login(_usernameOrEmail: string, _password: string) {
    const _body = {
      usernameOrEmail: _usernameOrEmail,
      password: _password,
    };

    console.log("%c LoginService.login", "color:blue", _body);

    return this.post({
      baseURL: "http://localhost:8070/api",
      path: "/auth/login",
      body: _body,
      headers: this.toHeadersWithoutAuth(),
      apiName: "login-request",
    });
  }

  async changePassword(_oldPassword: string, _newPassword: string) {
    const _body = {
      oldPassword: _oldPassword,
      newPassword: _newPassword,
    };
    return this.post({
      apiName: "login-request",
      baseURL: "http://localhost:8070/api",
      path: "/auth/password-change",
      body: _body,
      headers: this.toHeaders(),
    });
  }
}
