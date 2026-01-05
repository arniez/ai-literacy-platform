import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for making elements draggable
 * @param {boolean} isExpanded - Whether the element is in fullscreen mode
 * @returns {object} - Contains position state and event handlers
 */
const useDraggable = (isExpanded = false) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset position when expanded/collapsed
  useEffect(() => {
    if (isExpanded) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isExpanded]);

  const handleMouseDown = useCallback((e) => {
    // Only allow dragging from header/title area
    if (isExpanded) return;

    // Prevent dragging if clicking on buttons or interactive elements
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) {
      return;
    }

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position, isExpanded]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Get window dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Limit dragging to keep window mostly visible
    const maxX = windowWidth / 2;
    const minX = -windowWidth / 2;
    const maxY = windowHeight / 2;
    const minY = -windowHeight / 2;

    setPosition({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY))
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    position,
    isDragging,
    handleMouseDown,
    resetPosition: () => setPosition({ x: 0, y: 0 })
  };
};

export default useDraggable;
