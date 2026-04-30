import React, { createContext, useReducer, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const AppContext = createContext();

const initialState = {
  user: null,
  session: null,
  notifications: [],
  unreadCount: 0,
  activeWar: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'SET_NOTIFICATIONS':
      return { 
        ...state, 
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.read).length
      };
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    case 'MARK_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      };
    case 'SET_ACTIVE_WAR':
      return { ...state, activeWar: action.payload };
    case 'UPDATE_WAR_SCORE':
      if (!state.activeWar) return state;
      return { ...state, activeWar: { ...state.activeWar, ...action.payload } };
    case 'SIGN_OUT':
      return initialState;
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch({ type: 'SET_SESSION', payload: session });
      if (session) fetchUser(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch({ type: 'SET_SESSION', payload: session });
      if (session) {
        fetchUser(session.user.id);
      } else {
        dispatch({ type: 'SIGN_OUT' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUser = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        dispatch({ type: 'UPDATE_USER', payload: data });
      }
    } catch (err) {
      console.error('Error fetching user', err);
    }
  };

  return (
    <AppContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
