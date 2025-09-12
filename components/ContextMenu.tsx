import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose }) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'TEAM ARUN',
        url: window.location.href,
      });
    } else {
      alert('Share options are not supported on this browser.');
    }
    onClose();
  };

  return (
    <div
      className="fixed z-[9999] bg-gray-800 text-white rounded shadow-lg py-2 px-4"
      style={{ top: y, left: x, minWidth: 180 }}
      onContextMenu={e => e.preventDefault()}
    >
      <button className="block w-full text-left py-2 hover:bg-cyan-700 rounded" onClick={() => handleNavigate('/')}>
        🏠 Home
      </button>
      <button className="block w-full text-left py-2 hover:bg-cyan-700 rounded" onClick={() => handleNavigate('/about')}>
        📋 Project Description
      </button>
      <button className="block w-full text-left py-2 hover:bg-cyan-700 rounded" onClick={() => handleNavigate('/team')}>
        👥 Team Members
      </button>
      <hr className="my-2 border-gray-600" />
      <button className="block w-full text-left py-2 hover:bg-cyan-700 rounded" onClick={handleShare}>
        🔗 Share
      </button>
    </div>
  );
};

export default ContextMenu;
