import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authAndOrg';
import { AuthUser } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permissionCode: string) => boolean;
  hasRole: (roleName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const tokenPresent = authService.isAuthenticated();

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['auth_user'],
    queryFn: authService.getCurrentUser,
    enabled: tokenPresent,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (email: string) => authService.login(email),
    onSuccess: async () => {
      await refetch();
      queryClient.invalidateQueries();
      navigate('/');
    },
  });

  const login = async (email: string) => {
    await loginMutation.mutateAsync(email);
  };

  const logout = () => {
    authService.logout();
    queryClient.clear();
    navigate('/login');
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permissionCode);
  };

  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    return user.roles.some((r) => r.name.toLowerCase() === roleName.toLowerCase());
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
