export interface Medal3D {
  id: string;
  type: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  materialProperties: {
    metalness: number;
    roughness: number;
    color: string;
    emissive?: string;
  };
  animations: {
    rotation: boolean;
    glow: boolean;
    particles: boolean;
  };
  unlockPoints: number;
  description: string;
  subtitle: string;
}

export interface WeeklyPool {
  id: string;
  family_id: string;
  week_start: string;
  week_end: string;
  total_amount: number;
  participants: string[];
  winners: Array<{
    user_id: string;
    rank: number;
    payout_amount: number;
  }>;
  status: 'active' | 'completed' | 'paid_out';
  created_at: string;
}
