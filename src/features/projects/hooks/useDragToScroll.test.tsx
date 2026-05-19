import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { useDragToScroll } from './useDragToScroll';

const DragScrollFixture: React.FC = () => {
  const { containerRef, isDragging, dragBindings } = useDragToScroll({
    canStartDrag: (event) =>
      !(
        event.target instanceof HTMLElement && event.target.closest('[data-no-drag-scroll="true"]')
      ),
  });

  return (
    <div
      ref={containerRef}
      data-testid="drag-scroll"
      {...dragBindings}
      style={{ overflowX: 'auto', width: '200px' }}
    >
      <div style={{ width: '1000px' }}>
        <span>{isDragging ? 'dragging' : 'idle'}</span>
        <button type="button" data-no-drag-scroll="true">
          card
        </button>
      </div>
    </div>
  );
};

describe('useDragToScroll', () => {
  it('scrolls horizontally while dragging', () => {
    render(<DragScrollFixture />);

    const container = screen.getByTestId('drag-scroll');
    Object.defineProperty(container, 'scrollLeft', {
      configurable: true,
      writable: true,
      value: 120,
    });

    const pointerDownEvent = createEvent.pointerDown(container, { button: 0, pointerId: 1 });
    Object.defineProperty(pointerDownEvent, 'clientX', { value: 180 });
    fireEvent(container, pointerDownEvent);
    expect(screen.getByText('dragging')).toBeInTheDocument();

    const pointerMoveEvent = createEvent.pointerMove(container, { pointerId: 1 });
    Object.defineProperty(pointerMoveEvent, 'clientX', { value: 80 });
    fireEvent(container, pointerMoveEvent);
    expect(container.scrollLeft).toBe(220);

    fireEvent.pointerUp(container, { pointerId: 1 });
    expect(screen.getByText('idle')).toBeInTheDocument();
  });

  it('does not start drag scroll from blocked targets', () => {
    render(<DragScrollFixture />);

    const container = screen.getByTestId('drag-scroll');
    const blockedTarget = screen.getByRole('button', { name: 'card' });

    Object.defineProperty(container, 'scrollLeft', {
      configurable: true,
      writable: true,
      value: 50,
    });

    fireEvent.pointerDown(blockedTarget, { button: 0, clientX: 150, pointerId: 2 });
    fireEvent.pointerMove(container, { clientX: 20, pointerId: 2 });

    expect(container.scrollLeft).toBe(50);
    expect(screen.getByText('idle')).toBeInTheDocument();
  });
});
