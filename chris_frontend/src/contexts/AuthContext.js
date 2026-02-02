import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

// PUBLIC_INTERFACE
/**
 * Hook to access authentication context.
 * @returns {Object} Authentication state and methods
 */
export const useAuth = () => {
  return useContext(AuthContext);
};

// PUBLIC_INTERFACE
/**
 * AuthProvider component that wraps the app and provides authentication state.
 * Manages Supabase session, login, signup, and logout functionality.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // PUBLIC_INTERFACE
  /**
   * Sign up a new user with email and password.
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Supabase auth response
   */
  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.REACT_APP_FRONTEND_URL || window.location.origin,
      },
    });
    return { data, error };
  };

  // PUBLIC_INTERFACE
  /**
   * Sign in an existing user with email and password.
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Supabase auth response
   */
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  // PUBLIC_INTERFACE
  /**
   * Sign out the current user.
   * @returns {Promise} Supabase auth response
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
