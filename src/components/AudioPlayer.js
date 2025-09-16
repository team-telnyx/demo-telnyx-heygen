import { useEffect, useRef } from 'react';

const AudioPlayer = ({ mediaStream, ...props }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!mediaStream || !audioRef.current) return;

    console.log('AudioPlayer: Setting up media stream:', mediaStream);
    audioRef.current.srcObject = mediaStream;

    // Ensure audio plays
    audioRef.current.play().catch(e => {
      console.warn('AudioPlayer: Autoplay failed:', e);
    });
  }, [mediaStream]);

  return <audio ref={audioRef} autoPlay {...props} />;
};

export default AudioPlayer;