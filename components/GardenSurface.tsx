'use client';

import type {
  KeyboardEventHandler,
  PointerEventHandler,
  ReactNode,
  RefObject
} from 'react';

type GardenSurfaceProps = {
  containerRef: RefObject<HTMLElement>;
  interactionLocked: boolean;
  shouldTrackPointer: boolean;
  brightness: number;
  onPointerDown: PointerEventHandler<HTMLElement>;
  onPointerUp: PointerEventHandler<HTMLElement>;
  onPointerLeave: PointerEventHandler<HTMLElement>;
  onPointerCancel: PointerEventHandler<HTMLElement>;
  onPointerMove?: PointerEventHandler<HTMLElement>;
  onKeyDown: KeyboardEventHandler<HTMLElement>;
  onKeyUp: KeyboardEventHandler<HTMLElement>;
  onKeyboardPlant: () => void;
  children: ReactNode;
};

export default function GardenSurface({
  containerRef,
  interactionLocked,
  shouldTrackPointer,
  brightness,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onPointerMove,
  onKeyDown,
  onKeyUp,
  onKeyboardPlant,
  children
}: GardenSurfaceProps) {
  return (
    <main
      ref={containerRef}
      tabIndex={0}
      aria-label="Taman bunga interaktif"
      aria-describedby="garden-kb-help"
      onPointerDown={interactionLocked ? undefined : onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerCancel}
      onPointerMove={shouldTrackPointer && !interactionLocked ? onPointerMove : undefined}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      className="relative min-h-screen w-full overflow-hidden lux-backdrop select-none"
      style={{ touchAction: 'manipulation', filter: `brightness(${brightness})` }}
    >
      <p id="garden-kb-help" className="sr-only">
        Tekan Enter atau Spasi untuk menanam bunga. Tahan untuk memunculkan aura.
      </p>
      <button type="button" className="sr-only" onClick={onKeyboardPlant}>
        Tanam bunga
      </button>
      {children}
    </main>
  );
}
