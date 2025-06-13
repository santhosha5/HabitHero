declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  interface ConfettiCannon {
    reset: () => void;
    fire: () => void;
  }

  type ConfettiFunction = (options?: ConfettiOptions) => Promise<null>;

  interface ConfettiNamespace extends ConfettiFunction {
    reset: () => void;
    create: (
      canvas: HTMLCanvasElement,
      options?: { resize?: boolean; useWorker?: boolean }
    ) => ConfettiFunction & { reset: () => void; fire: () => void };
    createCanvas: (
      options?: { resize?: boolean; useWorker?: boolean }
    ) => {
      canvas: HTMLCanvasElement;
      confetti: ConfettiFunction & { reset: () => void; fire: () => void };
    };
  }

  const confetti: ConfettiNamespace;
  export default confetti;
}