import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { AxiosResponse as Response } from "axios";
import { ApiService } from "@apiServices/ApiService";
import AuthStorage from "@context/AuthStorage";
// import jwt from "jsonwebtoken";

interface User {
  name: string | null;
  email: string | null;
}

const restApi: ApiService = ApiService.getInstance();

export interface AuthContextType {
  user: User;
  loading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: Response<any>;
  //login(email: string, password: string): Promise<boolean>;
  login: (email: string, password: string) => Promise<any>;
  sendOTP: (obj: any) => Promise<any>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  signUp: (email: string, name: string, password: string) => void;
  logout: () => void;
  canView: (area: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>();
  const [error, setError] = useState<Response<any> | null>();
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // const token = "your-jwt-token"; // Replace with your actual JWT token
  // try {
  //   const unsafeDecoded = jwt.decode(token, { complete: true });
  //   console.log(unsafeDecoded);
  // } catch (error) {
  //   console.error("Error decoding JWT:", error);
  // }

  useEffect(() => {
    const token = AuthStorage.getToken();
    if (token) {
      const parObj = token ? JSON.parse(token) : null;

      setUser({
        name: parObj?.name,
        email: parObj?.email,
      });

      // const decodedToken = jwt.decode(parObj?.accessToken, { complete: true });
      // const { exp }: any = decodedToken?.payload;
      // const currentDate = new Date();
      // const currentTimestamp = currentDate.getTime() / 1000; // Divide by 1000 to convert milliseconds to seconds

      // if (exp < currentTimestamp) {
      //   AuthStorage.deleteToken();
      // } else {
      //   setUser({
      //     name: parObj?.name,
      //     email: parObj?.email,
      //   });
      // }
    }
    setLoadingInitial(false);
  }, []);

  function urlBase64Decode(str: string) {
    let output = str.replace(/-/g, "+").replace(/_/g, "/");
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += "==";
        break;
      case 3:
        output += "=";
        break;
      default:
        // tslint:disable-next-line:no-string-throw
        throw "Illegal base64url string!";
    }
    // return decodeURIComponent((<any>window).escape(window.atob(output)));

    return "knk";
  }

  const decodeToken = (token: string = "") => {
    if (token === null || token === "") {
      return { upn: "" };
    }
    const parts = token.split(".");

    if (parts.length !== 3) {
      throw new Error("JWT must have 3 parts");
    }

    const decoded = urlBase64Decode(parts[1]);
    if (!decoded) {
      throw new Error("Cannot decode the token");
    }
    return JSON.parse(decoded);
  };

  async function login(email: string, password: string) {
    let response;
    try {
      response = await restApi.loginService.login(email, password);
      if (response?.data) {
        AuthStorage.saveToken(response?.data?.data);
        if (AuthStorage.getToken()) {
          setUser({
            name: response?.data?.data?.name,
            email: response?.data?.data?.email,
          });
        }
      }
      return response;
    } catch (e) {
      return response;
    }
  }

  async function sendOTP(payload: string) {
    // let response;
    // try {
    //   response = await restApi.loginService.sendOTP(payload);
    //   console.log("%cesponse?.data:", "color:yellow", response?.data);
    //   if (response?.data) {
    //     AuthStorage.saveToken(response?.data?.data);
    //     if (AuthStorage.getToken()) {
    //       setUser({
    //         name: response?.data?.name,
    //         email: response?.data?.email,
    //       });
    //     }
    //   }
    //   return response;
    // } catch (e) {
    //   return response;
    // }
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    try {
      // const { data, errorMessage, loaded } = await restApi.loginService.changePassword(
      //   oldPassword,
      //   newPassword
      // );
      // if (data) {
      //   AuthStorage.saveToken(data?.data);
      //   if (AuthStorage.getToken()) {
      //     setUser({
      //       name: data?.data?.name,
      //       email: data?.data?.email,
      //     });
      //   }
      // }
      return true;
    } catch (e) {
      return false;
    }
  }

  function signUp(email: string, name: string, password: string) {
    // setLoading(true);
    // usersApi
    //   .signUp({ email, name, password })
    //   .then((newUser: any) => {
    //     setUser(newUser);
    //     //  history.push("/");
    //   })
    //   .catch((newError: any) => setError(newError))
    //   .finally(() => setLoading(false));
  }

  function logout() {
    //sessionsApi.logout().then(() => setUser(undefined));
    AuthStorage.deleteToken();
    setUser(null);
  }

  enum Roles {
    VIEWERS = "viewer|analyst|developer",
  }

  const canView = (area: string) => {
    // return jwtutil.isValid() && jwtutil.hasRole(Roles.VIEWERS, area)
    return AuthStorage.getToken() !== null;
  };

  // Make the provider update only when it should
  const memoedValue = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      sendOTP,
      changePassword,
      signUp,
      logout,
      canView,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, error]
  );

  return (
    <AuthContext.Provider value={memoedValue as AuthContextType}>
      {!loadingInitial && children}
    </AuthContext.Provider>
  );
}

export default function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
