'use client';

import React, { createContext, useContext } from 'react';
import {
  Auth0Provider as SdkAuth0Provider,
  useUser as useSdkUser,
  withPageAuthRequired,
} from '@auth0/nextjs-auth0';
import { installDemoFetch } from './demo-fetch';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

if (isDemoMode) {
  installDemoFetch();
}

const demoUser = {
  sub: 'demo|closet-circle',
  name: 'John Smith',
  nickname: 'john-smith',
  email: 'user1@email.com',
  picture:
    'https://ui-avatars.com/api/?name=John+Smith&size=128&background=284472&color=ffffff',
};

type UserState = {
  user?: any;
  isLoading: boolean;
  error?: Error;
};

const DemoUserContext = createContext<UserState>({
  user: isDemoMode ? demoUser : undefined,
  isLoading: !isDemoMode,
});

function LiveUserBridge({ children }: { children: React.ReactNode }) {
  const authState = useSdkUser();

  return React.createElement(
    DemoUserContext.Provider,
    { value: authState as UserState },
    children,
  );
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  if (isDemoMode) {
    return React.createElement(
      DemoUserContext.Provider,
      { value: { user: demoUser, isLoading: false } },
      children,
    );
  }

  return React.createElement(
    SdkAuth0Provider,
    null,
    React.createElement(LiveUserBridge, null, children),
  );
}

export function useUser() {
  return useContext(DemoUserContext);
}

export { SdkAuth0Provider as Auth0Provider, withPageAuthRequired };
