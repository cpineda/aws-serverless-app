import { useState, useEffect } from "react";
import {
  CognitoUserPool,
  CognitoUserAttribute,
  AuthenticationDetails,
  CognitoUser,
} from "amazon-cognito-identity-js";
import { resolve } from "path";

interface PoolData {
  UserPoolId: string;
  ClientId: string;
}

const poolData = {
  UserPoolId: process.env.AWS_USER_POOLS_ID,
  ClientId: process.env.AWS_USER_POOLS_WEB_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData as PoolData);

export const useAuth = () => {
  const [user, setUser] = useState<CognitoUser | null>(null);

  useEffect(() => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      setUser(cognitoUser);
    }
  }, []);

  const login = (email: string, password: string) => {
    const authenticationData = {
      Username: email,
      Password: password,
    };
    const authenticationDetails = new AuthenticationDetails(authenticationData);

    const userData = {
      Username: email,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          setUser(cognitoUser);
          resolve(result);
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  };

  const logout = () => {
    if (user) {
      user.signOut();
      setUser(null);
    }
  };

  return { user, login, logout };
};
