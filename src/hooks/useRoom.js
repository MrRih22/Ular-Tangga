import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useRoom(roomId) {
  const [room, setRoom] = useState(null);

  useEffect(() => {
    if (!roomId) return;
    let active = true;

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
        (payload) => active && setRoom(payload.new)
      )
      .subscribe();

    supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single()
      .then(({ data }) => active && data && setRoom(data));

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return room;
}