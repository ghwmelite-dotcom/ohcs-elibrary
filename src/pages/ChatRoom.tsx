import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import Chat from './Chat';

// ChatRoom is handled by the Chat component with roomId param
export default function ChatRoom() {
  const { roomId } = useParams<{ roomId: string }>();

  if (!roomId) {
    return <Navigate to="/chat" replace />;
  }

  // The Chat component already handles roomId via useParams
  return <Chat />;
}
