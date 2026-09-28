const UU_JWT = "UU_JWT";
export default class AuthStorage {
  static async saveToken(data: any) {
    localStorage.setItem(UU_JWT, JSON.stringify(data));
  }

  static deleteToken() {
    localStorage.removeItem(UU_JWT);
    localStorage.removeItem("isAdmin");
  }

  static getToken() {
    const JWT = localStorage.getItem(UU_JWT);
    return JWT;
  }

  static getAuthorization() {
    const obj = localStorage.getItem(UU_JWT);
    const parObj = obj ? JSON.parse(obj) : null;
    const token = parObj ? "Bearer " + parObj?.accessToken : null;
    return token;
  }

  static getRefreshToken() {
    const obj = localStorage.getItem(UU_JWT);
    const parObj = obj ? JSON.parse(obj) : null;
    const refreshToken = parObj ? parObj?.refreshToken : null;

    return refreshToken;
  }

  static parseJwt() {
    const obj = localStorage.getItem(UU_JWT);
    const parObj = obj ? JSON.parse(obj) : null;
    return parObj ? parObj?.accessToken : null;
  }
}
