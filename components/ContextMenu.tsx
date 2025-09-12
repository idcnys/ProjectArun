import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose }) => {
  const handleNavigate = (path: string) => {
    window.location.href = path;
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
      <button className="block w-full text-left py-2 hover:bg-cyan-700 rounded" onClick={() => handleNavigate('/project')}>
        Project Details
      </button>
      <button className="block w-full text-left py-2 hover:bg-cyan-700 rounded" onClick={() => handleNavigate('/members')}>
        Team Members
      </button>
      <button className="block w-full text-left py-2 hover:bg-cyan-700 rounded" onClick={handleShare}>
        Share
      </button>
    </div>
  );
};

export default ContextMenu;
