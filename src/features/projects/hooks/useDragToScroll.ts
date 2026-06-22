import React, { useRef, useState } from 'react';

type UseDragToScrollOptions = {
  canStartDrag?: (event: React.PointerEvent<HTMLDivElement>) => boolean;
};

type DragState = {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
};

const getPointerClientX = (event: React.PointerEvent<HTMLDivElement>) => {
  const nativeClientX = 'clientX' in event.nativeEvent ? event.nativeEvent.clientX : undefined;
  return nativeClientX ?? event.clientX ?? 0;
};

const isMatchingPointer = (
  dragState: DragState | null,
  event: React.PointerEvent<HTMLDivElement>,
) => {
  if (!dragState) return false;
  return event.pointerId === dragState.pointerId || event.pointerId === 0;
};

export const useDragToScroll = (options: UseDragToScrollOptions = {}) => {
  const { canStartDrag } = options;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const finishDragging = () => {
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (canStartDrag && !canStartDrag(event)) return;

    const container = containerRef.current;
    if (!container) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: getPointerClientX(event),
      startScrollLeft: container.scrollLeft,
    };

    setIsDragging(true);
    container.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const dragState = dragStateRef.current;
    if (!container || !dragState) return;
    if (!isMatchingPointer(dragState, event)) return;

    const deltaX = getPointerClientX(event) - dragState.startX;
    container.scrollLeft = dragState.startScrollLeft - deltaX;
    event.preventDefault();
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const dragState = dragStateRef.current;
    if (!dragState) return;
    if (!isMatchingPointer(dragState, event)) return;

    container?.releasePointerCapture?.(event.pointerId);
    finishDragging();
  };

  const onPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const dragState = dragStateRef.current;
    if (!dragState) return;
    if (!isMatchingPointer(dragState, event)) return;

    container?.releasePointerCapture?.(event.pointerId);
    finishDragging();
  };

  return {
    containerRef,
    isDragging,
    dragBindings: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onPointerLeave: onPointerCancel,
    },
  };
};
