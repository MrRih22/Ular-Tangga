import { useState } from 'react';
import Lobby from './components/Lobby';
import GameScreen from './components/GameScreen';

const KEY = 'lovesteps_session';
const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
};

export default function App() {
  const [session, setSession] = useState(load);

  const enter = (s) => {
    localStorage.setItem(KEY, JSON.stringify(s));
    setSession(s);
  };
  const leave = () => {
    localStorage.removeItem(KEY);
    setSession(null);
  };

  return session ? <GameScreen session={session} onLeave={leave} /> : <Lobby onEnter={enter} />;
}