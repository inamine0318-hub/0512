/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
// motion/react removed to prevent removeChild crash on mobile
import { Play, Pause, RotateCcw, Trophy, Heart, Zap, Shield, Volume2, VolumeX, MessageCircle, Clock, Sword, Lock, LayoutGrid, Eye } from 'lucide-react';

// --- Sound Manager ---
class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentBgm: { oscillators: OscillatorNode[], timeoutId?: number } | null = null;

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.5; // Increased from 0.3
    }
    this.resume();
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.error("Audio resume failed:", e));
    }
  }

  public setMasterVolume(value: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.1);
    }
  }

  playShoot(type: PlayerCharacter) {
    this.init();
    const now = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const g = this.ctx!.createGain();

    osc.connect(g);
    g.connect(this.masterGain!);

    if (type === 'BUTTERFLY') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      g.gain.setValueAtTime(0.1, now);
    } else if (type === 'LADYBUG') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      g.gain.setValueAtTime(0.15, now);
    } else if (type === 'GOLDEN_HERCULES') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
      g.gain.setValueAtTime(0.25, now);
    } else if (type === 'CICADA') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
      g.gain.setValueAtTime(0.05, now);
    } else if (type === 'MANTIS') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      g.gain.setValueAtTime(0.1, now);
    } else if (type === 'GRASSHOPPER') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
      g.gain.setValueAtTime(0.1, now);
    } else if (type === 'STAG_BEETLE' || type === 'SILVER_STAG_BEETLE') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(type === 'SILVER_STAG_BEETLE' ? 200 : 150, now);
      osc.frequency.exponentialRampToValueAtTime(type === 'SILVER_STAG_BEETLE' ? 100 : 50, now + 0.1);
      g.gain.setValueAtTime(0.15, now);
    } else if (type === 'HERCULES') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      g.gain.setValueAtTime(0.2, now);
    } else if (type === 'DRAGONFLY') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
      g.gain.setValueAtTime(0.1, now);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      g.gain.setValueAtTime(0.2, now);
    }

    const duration = (type === 'LADYBUG' || type === 'GOLDEN_HERCULES' || type === 'HERCULES') ? 0.2 : 0.1;
    g.gain.exponentialRampToValueAtTime(0.01, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }

  playExplosion(isBoss: boolean = false) {
    this.init();
    const now = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const g = this.ctx!.createGain();

    osc.connect(g);
    g.connect(this.masterGain!);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(isBoss ? 150 : 100, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + (isBoss ? 1.0 : 0.3));

    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + (isBoss ? 1.0 : 0.3));

    osc.start(now);
    osc.stop(now + (isBoss ? 1.0 : 0.3));
  }

  lastHitTime: number = 0;

  playHit() {
    this.init();
    const now = this.ctx!.currentTime;
    if (now - this.lastHitTime < 0.05) return; // Throttle hit sounds
    this.lastHitTime = now;
    
    const osc = this.ctx!.createOscillator();
    const g = this.ctx!.createGain();

    osc.connect(g);
    g.connect(this.masterGain!);

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setValueAtTime(100, now + 0.1);

    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playPowerUp() {
    this.init();
    const now = this.ctx!.currentTime;
    [440, 554, 659, 880].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      g.gain.setValueAtTime(0.2, now + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.2);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.2);
    });
  }

  playChirp() {
    this.init();
    const now = this.ctx!.currentTime;
    // Play a series of rapid chirps
    for (let i = 0; i < 8; i++) {
      const t = now + i * 0.15;
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2500, t);
      osc.frequency.exponentialRampToValueAtTime(1800, t + 0.1);
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  }

  playVictory() {
    this.init();
    const now = this.ctx!.currentTime;
    [523, 659, 783, 1046].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      g.gain.setValueAtTime(0.3, now + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.4);
    });
  }

  playGameOver() {
    this.init();
    const now = this.ctx!.currentTime;
    [392, 349, 311, 261].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.2);
      g.gain.setValueAtTime(0.2, now + i * 0.2);
      g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.5);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.5);
    });
  }

  playWarning() {
    this.init();
    const now = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const g = this.ctx!.createGain();
    osc.connect(g);
    g.connect(this.masterGain!);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.setValueAtTime(400, now + 0.1);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  stopBGM() {
    if (this.currentBgm) {
      this.currentBgm.oscillators.forEach(o => {
        try { o.stop(); } catch(e) {}
      });
      if (this.currentBgm.timeoutId) clearTimeout(this.currentBgm.timeoutId);
      this.currentBgm = null;
    }
  }

  playBGM(stage: number, isBoss: boolean = false) {
    this.init();
    this.stopBGM();

    const bpm = isBoss ? 150 : 120 + (stage * 5);
    const stepTime = 60 / bpm / 2; // 8th notes
    
    // Retro melodies (Melody + Bass)
    const melodies = [
      [261, 293, 329, 392, 440, 392, 329, 293], // Stage 1: Happy
      [261, 311, 349, 392, 466, 392, 349, 311], // Stage 2: Cool
      [329, 392, 440, 523, 587, 523, 440, 392], // Stage 3: Heroic
      [130, 138, 146, 155, 164, 155, 146, 138], // Boss: Tense
      [440, 493, 523, 587, 659, 587, 523, 493], // Stage 7: Epic Hidden
    ];
    const bassLines = [
      [130, 130, 164, 164, 196, 196, 164, 164], // Stage 1 Bass
      [130, 130, 155, 155, 196, 196, 155, 155], // Stage 2 Bass
      [164, 164, 196, 196, 261, 261, 196, 196], // Stage 3 Bass
      [65, 69, 73, 77, 82, 77, 73, 69],         // Boss Bass
      [220, 220, 261, 261, 329, 329, 261, 261], // Stage 7 Bass
    ];

    const melody = isBoss ? melodies[3] : (stage === 7 ? melodies[4] : melodies[(stage - 1) % 3]);
    const bass = isBoss ? bassLines[3] : (stage === 7 ? bassLines[4] : bassLines[(stage - 1) % 3]);
    const oscillators: OscillatorNode[] = [];
    
    const playStep = (step: number) => {
      if (!this.ctx || !this.currentBgm) return;
      const now = this.ctx.currentTime;
      
      // Melody Channel
      const mFreq = melody[step % melody.length];
      const mOsc = this.ctx.createOscillator();
      const mGain = this.ctx.createGain();
      mOsc.connect(mGain);
      mGain.connect(this.masterGain!);
      mOsc.type = isBoss ? 'sawtooth' : 'square';
      mOsc.frequency.setValueAtTime(mFreq, now);
      mGain.gain.setValueAtTime(0.12, now); // Increased from 0.08
      mGain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 0.8);
      mOsc.start(now);
      mOsc.stop(now + stepTime);
      
      // Bass Channel
      const bFreq = bass[step % bass.length];
      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bOsc.connect(bGain);
      bGain.connect(this.masterGain!);
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(bFreq, now);
      bGain.gain.setValueAtTime(0.18, now); // Increased from 0.12
      bGain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 0.9);
      bOsc.start(now);
      bOsc.stop(now + stepTime);

      oscillators.push(mOsc, bOsc);
      
      mOsc.onended = () => { mOsc.disconnect(); mGain.disconnect(); };
      bOsc.onended = () => { bOsc.disconnect(); bGain.disconnect(); };
      
      if (oscillators.length > 20) oscillators.splice(0, 2);

      this.currentBgm.timeoutId = window.setTimeout(() => playStep(step + 1), stepTime * 1000);
    };

    this.currentBgm = { oscillators };
    playStep(0);
  }
}

const sounds = new SoundManager();

// --- Constants ---
const CANVAS_WIDTH = 450;
const CANVAS_HEIGHT = 700;
const PLAYER_SIZE = 40;
const ENEMY_SIZE = 35;
const BULLET_SIZE = 8;
const SPAWN_RATE = 1000; // ms
const INITIAL_LIVES = 3;

// --- Types ---
type GameState = 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY' | 'STAGE_CLEAR';
type PlayerCharacter = 'BEETLE' | 'BUTTERFLY' | 'LADYBUG' | 'GOLDEN_HERCULES' | 'CICADA' | 'MANTIS' | 'GRASSHOPPER' | 'STAG_BEETLE' | 'HERCULES' | 'SILVER_STAG_BEETLE' | 'DRAGONFLY';

interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Player extends Entity {
  speed: number;
  type: PlayerCharacter;
}

interface Bullet extends Entity {
  speed: number;
  vx?: number;
  vy?: number;
  curve?: number;
  homing?: boolean;
  homingStrength?: number;
  damage: number;
  color: string;
  isMissile?: boolean;
}

interface Enemy extends Entity {
  speed: number;
  type: 'FLY' | 'MOSQUITO' | 'SPIDER' | 'BOSS' | 'CHARGER' | 'SPITTER' | 'WASP' | 'MOTH' | 'BEETLE_DRONE' | 'FIREFLY' | 'DRAGONFLY' | 'SWARM_BOT';
  health: number;
  maxHealth: number;
  phase?: number;
  lastShot?: number;
  chargeState?: 'WAIT' | 'CHARGE';
  chargeTimer?: number;
  targetX?: number;
  targetY?: number;
  hitFlash?: number;
  color?: string;
  oscillationOffset?: number;
  behaviorState?: string;
}

interface BackgroundParticle extends Entity {
  speed: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
}

interface Item extends Entity {
  type: 'POWER_UP' | 'HEAL';
  speed: number;
}

interface Particle extends Entity {
  vx: number;
  vy: number;
  life: number;
  color: string;
  type?: 'DOT' | 'SHOCKWAVE';
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ position: 'fixed', inset: 0, background: '#0a150a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>エラーが発生しました</div>
          <pre style={{ fontSize: 12, color: '#f87171', maxWidth: 400, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <button onClick={() => { this.setState({ error: null }); window.location.reload(); }} style={{ marginTop: 24, padding: '8px 24px', background: '#4ade80', color: '#000', borderRadius: 24, fontWeight: 'bold' }}>リロード</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const updateScore = (val: number | ((prev: number) => number)) => {
    setScore(prev => {
      const next = typeof val === 'function' ? val(prev) : prev + val;
      scoreRef.current = next;
      
      if (next > highScoreRef.current) {
        setHighScore(next);
        highScoreRef.current = next;
        localStorage.setItem('insect-shooter-highscore', next.toString());
      }
      
      // Update character high score
      setCharacterHighScores(current => {
        const charBest = current[selectedCharacter] || 0;
        if (next > charBest) {
          const updated = { ...current, [selectedCharacter]: next };
          localStorage.setItem('insect-shooter-char-highscores', JSON.stringify(updated));
          return updated;
        }
        return current;
      });

      return next;
    });
  };
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('insect-shooter-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const highScoreRef = useRef(highScore);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [bombs, setBombs] = useState(3);
  const [shields, setShields] = useState(0);
  const [butterflyCharges, setButterflyCharges] = useState(0);
  const [ladybugCharges, setLadybugCharges] = useState(0);
  const [cicadaCharges, setCicadaCharges] = useState(0);
  const [mantisCharges, setMantisCharges] = useState(0);
  const [grasshopperCharges, setGrasshopperCharges] = useState(0);
  const [stagBeetleCharges, setStagBeetleCharges] = useState(0);
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [isButterflyActive, setIsButterflyActive] = useState(false);
  const [isLadybugActive, setIsLadybugActive] = useState(false);
  const [isCicadaActive, setIsCicadaActive] = useState(false);
  const [isXSlashActive, setIsXSlashActive] = useState(false);
  const [isLastStandActive, setIsLastStandActive] = useState(false);
  const [isTimeStopActive, setIsTimeStopActive] = useState(false);
  const [isMissionCompleteActive, setIsMissionCompleteActive] = useState(false);
  const [powerLevel, setPowerLevel] = useState(1);
  const [stage, setStage] = useState(1);
  const [selectedCharacter, setSelectedCharacter] = useState<PlayerCharacter>('BEETLE');
  const [isGoldenHerculesUnlocked, setIsGoldenHerculesUnlocked] = useState(true);
  const [isHerculesUnlocked, setIsHerculesUnlocked] = useState(() => {
    return localStorage.getItem('insect-shooter-hercules-unlocked') === 'true';
  });
  const [herculesCharges, setHerculesCharges] = useState(0);
  const [silverStagCharges, setSilverStagCharges] = useState(0);
  const [isBigBeamActive, setIsBigBeamActive] = useState(false);
  const [bigBeamCooldown, setBigBeamCooldown] = useState(0);
  const [dragonflyCharges, setDragonflyCharges] = useState(3);
  const [dragonflyActive, setDragonflyActive] = useState(false);
  const [isHerculesUsed, setIsHerculesUsed] = useState(false);
  const [characterHighScores, setCharacterHighScores] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('insect-shooter-char-highscores');
    return saved ? JSON.parse(saved) : {};
  });
  const [stageScores, setStageScores] = useState<number[]>(() => {
    const saved = localStorage.getItem('insect-shooter-stage-scores');
    return saved ? JSON.parse(saved) : [];
  });

  // Game Refs for mutable state to avoid re-renders in the loop
  const gameRef = useRef({
    player: { x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2, y: CANVAS_HEIGHT - 100, width: PLAYER_SIZE, height: PLAYER_SIZE, speed: 5, type: 'BEETLE' as PlayerCharacter },
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    items: [] as Item[],
    particles: [] as Particle[],
    backgroundParticles: [] as BackgroundParticle[],
    bossBullets: [] as Bullet[],
    enemyBullets: [] as Bullet[],
    keys: {} as Record<string, boolean>,
    lastSpawn: 0,
    lastBossShot: 0,
    frameCount: 0,
    isInvulnerable: 0,
    isShieldActive: false,
    shieldTimer: 0,
    shields: 0,
    butterflyCharges: 0,
    butterflyActive: false,
    butterflyTimer: 0,
    ladybugCharges: 0,
    ladybugBeamActive: false,
    ladybugBeamTimer: 0,
    cicadaCharges: 0,
    cicadaActive: false,
    cicadaTimer: 0,
    mantisCharges: 0,
    isXSlashActive: false,
    xSlashTimer: 0,
    grasshopperCharges: 0,
    lastStandActive: false,
    lastStandTimer: 0,
    lastStandCooldown: 0,
    stagBeetleCharges: 0,
    herculesCharges: 0,
    dragonflyActive: false,
    dragonflyTimer: 0,
    silverStagCharges: 0,
    isBigBeamActive: false,
    bigBeamTimer: 0,
    bigBeamCooldown: 0,
    timeStopActive: false,
    timeStopTimer: 0,
    isMissionCompleteActive: false,
    missionCompleteTimer: 0,
    bossSpawned: false,
    bossWarning: 0,
    screenShake: 0,
    powerLevel: 1,
    stage: 1,
    enemiesKilledInStage: 0,
    bombs: 3,
    isSwiping: false,
    playerTilt: 0,
    flightParticles: [] as {x: number, y: number, size: number, life: number, color: string}[],
    silverStagMissileTimer: 0,
  });

  useEffect(() => {
    sounds.setMasterVolume(isPaused ? 0 : 0.5);
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const startGame = () => {
    sounds.init(); // Explicitly init on user gesture
    sounds.playPowerUp();
    sounds.playBGM(1);
    setIsPaused(false);
    const initialLives = selectedCharacter === 'CICADA' ? 2 
      : selectedCharacter === 'GRASSHOPPER' ? 2
      : selectedCharacter === 'SILVER_STAG_BEETLE' ? 4
      : 3;
    const initialBombs = selectedCharacter === 'GOLDEN_HERCULES' ? 3 : 0;
    const initialShields = selectedCharacter === 'BEETLE' ? 3 : 0;
    const initialButterflyCharges = selectedCharacter === 'BUTTERFLY' ? 3 : 0;
    const initialLadybugCharges = selectedCharacter === 'LADYBUG' ? 2 : 0;
    const initialCicadaCharges = selectedCharacter === 'CICADA' ? 3 : 0;
    const initialMantisCharges = selectedCharacter === 'MANTIS' ? 3 : 0;
    const initialGrasshopperCharges = selectedCharacter === 'GRASSHOPPER' ? 3 : 0;
    const initialStagBeetleCharges = selectedCharacter === 'STAG_BEETLE' ? 3 : 0;
    const initialHerculesCharges = selectedCharacter === 'HERCULES' ? 3 : 0;
    const initialDragonflyCharges = selectedCharacter === 'DRAGONFLY' ? 3 : 0;
    const initialSilverStagCharges = selectedCharacter === 'SILVER_STAG_BEETLE' ? 3 : 0;
    
    setGameState('PLAYING');
    setScore(0);
    setLives(initialLives);
    setBombs(initialBombs);
    setShields(initialShields);
    setButterflyCharges(initialButterflyCharges);
    setLadybugCharges(initialLadybugCharges);
    setCicadaCharges(initialCicadaCharges);
    setMantisCharges(initialMantisCharges);
    setGrasshopperCharges(initialGrasshopperCharges);
    setStagBeetleCharges(initialStagBeetleCharges);
    setHerculesCharges(initialHerculesCharges);
    setDragonflyCharges(initialDragonflyCharges);
    setSilverStagCharges(initialSilverStagCharges);
    setBigBeamCooldown(0);
    setIsBigBeamActive(false);
    setDragonflyActive(false);
    setPowerLevel(1);
    setStage(1);
    setIsLastStandActive(false);
    setIsTimeStopActive(false);
    setIsXSlashActive(false);
    setIsMissionCompleteActive(false);
    
    // Reset Hercules unlock if it was used
    if (selectedCharacter === 'HERCULES') {
      setIsHerculesUnlocked(false);
      localStorage.removeItem('insect-shooter-hercules-unlocked');
    }
    
    const speed = selectedCharacter === 'BUTTERFLY' ? 8 
      : selectedCharacter === 'LADYBUG' ? 5 
      : selectedCharacter === 'GOLDEN_HERCULES' ? 12 
      : selectedCharacter === 'MANTIS' ? 9
      : selectedCharacter === 'CICADA' ? 4
      : selectedCharacter === 'GRASSHOPPER' ? 14
      : selectedCharacter === 'STAG_BEETLE' ? 6
      : selectedCharacter === 'HERCULES' ? 5
      : selectedCharacter === 'DRAGONFLY' ? 16
      : 6;
    
    gameRef.current = {
      player: { x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2, y: CANVAS_HEIGHT - 100, width: PLAYER_SIZE, height: PLAYER_SIZE, speed, type: selectedCharacter },
      bullets: [],
      enemies: [],
      items: [],
      particles: [],
      backgroundParticles: [],
      bossBullets: [],
      enemyBullets: [],
      keys: {},
      lastSpawn: 0,
      lastBossShot: 0,
      frameCount: 0,
      isInvulnerable: 0,
      isShieldActive: false,
      shieldTimer: 0,
      shields: initialShields,
      butterflyCharges: initialButterflyCharges,
      butterflyActive: false,
      butterflyTimer: 0,
      ladybugCharges: initialLadybugCharges,
      ladybugBeamActive: false,
      ladybugBeamTimer: 0,
      cicadaCharges: initialCicadaCharges,
      cicadaActive: false,
      cicadaTimer: 0,
      mantisCharges: initialMantisCharges,
      isXSlashActive: false,
      xSlashTimer: 0,
      grasshopperCharges: initialGrasshopperCharges,
      lastStandActive: false,
      lastStandTimer: 0,
      lastStandCooldown: 0,
      stagBeetleCharges: initialStagBeetleCharges,
      herculesCharges: initialHerculesCharges,
      dragonflyActive: false,
      dragonflyTimer: 0,
      silverStagCharges: initialSilverStagCharges,
      isBigBeamActive: false,
      bigBeamTimer: 0,
      bigBeamCooldown: 0,
      timeStopActive: false,
      timeStopTimer: 0,
      isMissionCompleteActive: false,
      missionCompleteTimer: 0,
      bossSpawned: false,
      bossWarning: 0,
      screenShake: 0,
      powerLevel: 1,
      stage: 1,
      enemiesKilledInStage: 0,
      bombs: initialBombs,
      isSwiping: false,
      playerTilt: 0,
      flightParticles: [],
      silverStagRevived: false,
      silverStagMissileTimer: 0,
    };
  };

  const backToSelect = () => {
    sounds.stopBGM();
    setGameState('START');
    // Reset Hercules unlock if it was used
    if (selectedCharacter === 'HERCULES') {
      setIsHerculesUnlocked(false);
      localStorage.removeItem('insect-shooter-hercules-unlocked');
    }
  };

  const useShield = () => {
    if (gameState !== 'PLAYING' || selectedCharacter !== 'BEETLE') return;
    const g = gameRef.current;
    if (g.shields > 0 && !g.isShieldActive) {
      g.shields--;
      setShields(g.shields);
      g.isShieldActive = true;
      g.shieldTimer = 600; // 10 seconds at 60fps
      setIsShieldActive(true);
      sounds.playPowerUp();
    }
  };

  const useButterflySkill = () => {
    if (gameState !== 'PLAYING' || selectedCharacter !== 'BUTTERFLY') return;
    const g = gameRef.current;
    if (g.butterflyCharges > 0 && !g.butterflyActive) {
      g.butterflyCharges--;
      setButterflyCharges(g.butterflyCharges);
      g.butterflyActive = true;
      g.butterflyTimer = 600; // 10 seconds
      setIsButterflyActive(true);
      sounds.playPowerUp();
    }
  };

  const useLadybugSkill = () => {
    if (gameState !== 'PLAYING' || selectedCharacter !== 'LADYBUG') return;
    const g = gameRef.current;
    if (g.ladybugCharges > 0 && !g.ladybugBeamActive) {
      g.ladybugCharges--;
      setLadybugCharges(g.ladybugCharges);
      g.ladybugBeamActive = true;
      g.ladybugBeamTimer = 60; // 1 second
      g.screenShake = 20;
      setIsLadybugActive(true);
      sounds.playExplosion(true);
    }
  };

  const useCicadaSkill = () => {
    if (gameState !== 'PLAYING' || selectedCharacter !== 'CICADA') return;
    const g = gameRef.current;
    if (g.cicadaCharges > 0 && !g.cicadaActive) {
      g.cicadaCharges--;
      setCicadaCharges(g.cicadaCharges);
      g.cicadaActive = true;
      g.cicadaTimer = 300; // 5 seconds
      setIsCicadaActive(true);
      sounds.playChirp();
    }
  };

  const useMantisSkill = () => {
    if (gameState !== 'PLAYING' || selectedCharacter !== 'MANTIS') return;
    const g = gameRef.current;
    if (g.mantisCharges > 0 && !g.isXSlashActive) {
      g.mantisCharges--;
      setMantisCharges(g.mantisCharges);
      g.isXSlashActive = true;
      g.xSlashTimer = 60; // 1 second
      setIsXSlashActive(true);
      sounds.playPowerUp();
      g.screenShake = 10;
      
      // Create X-Slash particles
      for (let i = 0; i < 20; i++) {
        g.particles.push({
          x: g.player.x + g.player.width / 2,
          y: g.player.y + g.player.height / 2,
          width: 4,
          height: 4,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          life: 1,
          color: '#4ade80'
        });
      }
    }
  };

  const useStagBeetleSkill = () => {
    if (gameState !== 'PLAYING' || selectedCharacter !== 'STAG_BEETLE') return;
    const g = gameRef.current;
    if (g.stagBeetleCharges > 0 && !g.timeStopActive) {
      g.stagBeetleCharges--;
      setStagBeetleCharges(g.stagBeetleCharges);
      g.timeStopActive = true;
      g.timeStopTimer = 600; // 10 seconds
      setIsTimeStopActive(true);
      sounds.playPowerUp();
    }
  };

  const useHerculesSkill = () => {
    if (gameState !== 'PLAYING' || selectedCharacter !== 'HERCULES') return;
    const g = gameRef.current;
    if (g.herculesCharges > 0) {
      g.herculesCharges--;
      setHerculesCharges(g.herculesCharges);
      sounds.playExplosion(true);
      g.screenShake = 30;
      
      // Damage all enemies
      for (const enemy of g.enemies) {
        enemy.health -= 100;
        // Add shockwave particles
        for (let i = 0; i < 5; i++) {
          g.particles.push({
            x: enemy.x + enemy.width / 2 + (Math.random() - 0.5) * 50,
            y: enemy.y + enemy.height / 2 + (Math.random() - 0.5) * 50,
            width: 10, height: 10, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, life: 1, color: '#94a3b8'
          });
        }
      }
    }
  };

  const useDragonflySkill = () => {
    if (gameState !== 'PLAYING' || selectedCharacter !== 'DRAGONFLY') return;
    const g = gameRef.current;
    if (g.dragonflyActive) return;
    if (dragonflyCharges > 0) {
      const nextCharges = dragonflyCharges - 1;
      setDragonflyCharges(nextCharges);
      g.dragonflyActive = true;
      g.dragonflyTimer = 600; // 10 seconds (at 60fps)
      setDragonflyActive(true);
      sounds.playPowerUp();
    }
  };

  const useReflectShield = () => {
    if (gameState !== 'PLAYING' || selectedCharacter !== 'SILVER_STAG_BEETLE') return;
    const g = gameRef.current;
    if (g.isBigBeamActive || g.bigBeamCooldown > 0) return;
    
    if (silverStagCharges > 0) {
      setSilverStagCharges(prev => prev - 1);
      g.silverStagCharges--;
      g.isBigBeamActive = true;
      g.bigBeamTimer = 180; // 3 seconds
      g.bigBeamCooldown = 300; // 5 seconds
      setIsBigBeamActive(true);
      setBigBeamCooldown(300);
      sounds.playPowerUp();
      
      // Visual effect on activation
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        g.particles.push({
          x: g.player.x + g.player.width/2,
          y: g.player.y + g.player.height/2,
          vx: Math.cos(angle) * 8,
          vy: Math.sin(angle) * 8,
          width: 6, height: 6,
          life: 1,
          color: '#cbd5e1'
        });
      }
    }
  };

  const nextStage = () => {
    const g = gameRef.current;
    const nextS = g.stage + 1;
    sounds.stopBGM();
    sounds.playVictory();
    setIsPaused(false);
    
    // Record stage score
    setStageScores(prev => {
      const next = [...prev];
      next[g.stage - 1] = scoreRef.current;
      localStorage.setItem('insect-shooter-stage-scores', JSON.stringify(next));
      return next;
    });

    // Mission Complete Presentation (Only at the very end)
    const isHerculesHiddenStage = nextS === 7 && selectedCharacter === 'HERCULES';
    
    if (nextS > 6 && !isHerculesHiddenStage) {
      g.isMissionCompleteActive = true;
      g.missionCompleteTimer = 300; // 5 seconds for ending
      setIsMissionCompleteActive(true);
      
      setTimeout(() => {
        g.isMissionCompleteActive = false;
        setIsMissionCompleteActive(false);
        
        sounds.stopBGM();
        setGameState('VICTORY');
        // Unlock Hercules
        localStorage.setItem('insect-shooter-hercules-unlocked', 'true');
        setIsHerculesUnlocked(true);
        
        if (selectedCharacter === 'HERCULES') {
          setIsHerculesUnlocked(false);
          localStorage.removeItem('insect-shooter-hercules-unlocked');
          setSelectedCharacter('BEETLE');
        }
      }, 5000);
    } else {
      // Automatic transition for intermediate stages or hidden stage
      setGameState('STAGE_CLEAR');
      setTimeout(() => {
        setStage(nextS);
        g.stage = nextS;
        g.enemiesKilledInStage = 0;
        g.bossSpawned = false;
        g.bullets = [];
        g.enemies = [];
        g.bossBullets = [];
        g.enemyBullets = [];
        sounds.playBGM(nextS);
        setGameState('PLAYING');
      }, 2000);
    }
  };

  const gameOver = useCallback(() => {
    sounds.playGameOver();
    sounds.stopBGM();
    setIsPaused(false);
    setGameState('GAMEOVER');
    
    if (selectedCharacter === 'HERCULES') {
      setIsHerculesUnlocked(false);
      localStorage.removeItem('insect-shooter-hercules-unlocked');
      setSelectedCharacter('BEETLE');
    }
    
    // Save scores
    if (scoreRef.current > highScoreRef.current) {
      setHighScore(scoreRef.current);
      highScoreRef.current = scoreRef.current;
      localStorage.setItem('insect-shooter-highscore', scoreRef.current.toString());
    }
    
    setCharacterHighScores(prev => {
      const next = { ...prev, [selectedCharacter]: Math.max(prev[selectedCharacter] || 0, scoreRef.current) };
      localStorage.setItem('insect-shooter-char-highscores', JSON.stringify(next));
      return next;
    });
  }, [selectedCharacter]);

  const continueGame = () => {
    sounds.init();
    sounds.playPowerUp();
    sounds.playBGM(gameRef.current.stage);
    setIsPaused(false);

    const initialLives = selectedCharacter === 'CICADA' ? 2
      : selectedCharacter === 'GRASSHOPPER' ? 2
      : selectedCharacter === 'SILVER_STAG_BEETLE' ? 4
      : selectedCharacter === 'GOLDEN_HERCULES' ? 4
      : 3;
    const initialBombs = selectedCharacter === 'GOLDEN_HERCULES' ? 3 : 0;
    const initialShields = selectedCharacter === 'BEETLE' ? 3 : 0;
    const initialButterflyCharges = selectedCharacter === 'BUTTERFLY' ? 3 : 0;
    const initialLadybugCharges = selectedCharacter === 'LADYBUG' ? 2 : 0;
    const initialCicadaCharges = selectedCharacter === 'CICADA' ? 3 : 0;
    const initialMantisCharges = selectedCharacter === 'MANTIS' ? 3 : 0;
    const initialGrasshopperCharges = selectedCharacter === 'GRASSHOPPER' ? 3 : 0;
    const initialStagBeetleCharges = selectedCharacter === 'STAG_BEETLE' ? 3 : 0;
    const initialHerculesCharges = selectedCharacter === 'HERCULES' ? 3 : 0;
    const initialDragonflyCharges = selectedCharacter === 'DRAGONFLY' ? 3 : 0;
    const initialSilverStagCharges = selectedCharacter === 'SILVER_STAG_BEETLE' ? 3 : 0;

    setGameState('PLAYING');
    setLives(initialLives);
    setBombs(initialBombs);
    setShields(initialShields);
    setButterflyCharges(initialButterflyCharges);
    setLadybugCharges(initialLadybugCharges);
    setCicadaCharges(initialCicadaCharges);
    setMantisCharges(initialMantisCharges);
    setGrasshopperCharges(initialGrasshopperCharges);
    setStagBeetleCharges(initialStagBeetleCharges);
    setHerculesCharges(initialHerculesCharges);
    setDragonflyCharges(initialDragonflyCharges);
    setSilverStagCharges(initialSilverStagCharges);
    setIsBigBeamActive(false);
    setBigBeamCooldown(0);
    setDragonflyActive(false);
    setIsShieldActive(false);
    setIsButterflyActive(false);
    setIsLadybugActive(false);
    setIsCicadaActive(false);
    setIsXSlashActive(false);
    setIsLastStandActive(false);
    setIsTimeStopActive(false);
    setIsMissionCompleteActive(false);
    setPowerLevel(1);

    const g = gameRef.current;
    g.bullets = [];
    g.enemies = [];
    g.bossBullets = [];
    g.enemyBullets = [];
    g.items = [];
    g.particles = [];
    g.backgroundParticles = [];
    g.flightParticles = [];
    g.isInvulnerable = 120;
    g.enemiesKilledInStage = 0;
    g.bossSpawned = false;
    g.bossWarning = 0;
    g.lastSpawn = 0;
    g.lastBossShot = 0;
    g.shields = initialShields;
    g.isShieldActive = false;
    g.shieldTimer = 0;
    g.butterflyCharges = initialButterflyCharges;
    g.butterflyActive = false;
    g.butterflyTimer = 0;
    g.ladybugCharges = initialLadybugCharges;
    g.ladybugBeamActive = false;
    g.ladybugBeamTimer = 0;
    g.cicadaCharges = initialCicadaCharges;
    g.cicadaActive = false;
    g.cicadaTimer = 0;
    g.mantisCharges = initialMantisCharges;
    g.isXSlashActive = false;
    g.xSlashTimer = 0;
    g.grasshopperCharges = initialGrasshopperCharges;
    g.lastStandActive = false;
    g.lastStandTimer = 0;
    g.lastStandCooldown = 0;
    g.stagBeetleCharges = initialStagBeetleCharges;
    g.timeStopActive = false;
    g.timeStopTimer = 0;
    g.herculesCharges = initialHerculesCharges;
    g.dragonflyActive = false;
    g.dragonflyTimer = 0;
    g.silverStagCharges = initialSilverStagCharges;
    g.isBigBeamActive = false;
    g.bigBeamTimer = 0;
    g.bigBeamCooldown = 0;
    g.isMissionCompleteActive = false;
    g.missionCompleteTimer = 0;
    g.screenShake = 0;
    g.playerTilt = 0;
    g.powerLevel = 1;
    g.bombs = initialBombs;
    g.player.x = CANVAS_WIDTH / 2 - PLAYER_SIZE / 2;
    g.player.y = CANVAS_HEIGHT - 100;
  };

  const backToStart = () => {
    setIsPaused(false);
    setGameState('START');
  };

  const useBomb = useCallback(() => {
    const g = gameRef.current;
    if (gameState !== 'PLAYING' || g.bombs <= 0 || g.isSwiping) return;

    g.bombs--;
    setBombs(g.bombs);
    g.screenShake = 30;
    sounds.playExplosion(true);

    // Damage all enemies (except boss)
    for (const enemy of g.enemies) {
      if (enemy.type !== 'BOSS') {
        enemy.health -= 20;
      }
      // Create particles for each enemy
      for (let i = 0; i < 10; i++) {
        g.particles.push({
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height / 2,
          width: 4,
          height: 4,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 1,
          color: '#facc15'
        });
      }
    }

    // Clear boss bullets
    g.bossBullets = [];
  }, [gameState]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      sounds.init(); // Resume audio context
      gameRef.current.keys[e.code] = true; 

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameState === 'PLAYING') {
          setIsPaused(prev => !prev);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { gameRef.current.keys[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Touch Handling
    const canvas = canvasRef.current;
    if (!canvas) return;

    let lastTouchX = 0;
    let lastTouchY = 0;
    let isTouching = false;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      sounds.resume();

      if (isPaused) {
        // Don't resume on any touch, let the user point at things.
        // The Resume button or P key will handle resuming.
        return;
      }

      const touch = e.touches[0];
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
      isTouching = true;
      gameRef.current.isSwiping = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching || isPaused) return;
      e.preventDefault();
      gameRef.current.isSwiping = true;
      
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      
      const deltaX = (touch.clientX - lastTouchX) * scaleX * 0.85; // Slight sensitivity reduction
      const deltaY = (touch.clientY - lastTouchY) * scaleY * 0.85;

      const g = gameRef.current;
      // Cap movement per event to prevent "teleporting"
      const maxMove = 50;
      const moveX = Math.max(-maxMove, Math.min(maxMove, deltaX));
      const moveY = Math.max(-maxMove, Math.min(maxMove, deltaY));

      g.player.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_SIZE, g.player.x + moveX));
      g.player.y = Math.max(0, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, g.player.y + moveY));

      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
    };

    const handleTouchEnd = () => {
      isTouching = false;
      setTimeout(() => {
        if (gameRef.current) gameRef.current.isSwiping = false;
      }, 50);
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [gameState, isPaused]);

  // Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animationFrameId: number;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const update = () => {
      const g = gameRef.current;
      const time = Date.now();
      
      if (!isPausedRef.current) {
        g.frameCount++;

        // Big Beam Update
        if (g.isBigBeamActive) {
          g.bigBeamTimer--;
          const beamWidth = CANVAS_WIDTH / 3;
          const beamX = g.player.x + g.player.width / 2 - beamWidth / 2;
          
          // Damage enemies and bullets in beam
          for (const enemy of g.enemies) {
            if (enemy.x < beamX + beamWidth && enemy.x + enemy.width > beamX) {
              // Reduced damage to bosses (counter-attack balance)
              const damage = enemy.type === 'BOSS' ? 0.2 : 1.5;
              enemy.health -= damage;
              if (g.frameCount % 5 === 0) {
                g.particles.push({
                  x: enemy.x + Math.random() * enemy.width,
                  y: enemy.y + Math.random() * enemy.height,
                  width: 6, height: 6, vx: 0, vy: -8, life: 1, color: '#cbd5e1'
                });
              }
            }
          }
          
          // Clear bullets in beam
          for (let i = g.enemyBullets.length - 1; i >= 0; i--) {
            const b = g.enemyBullets[i];
            if (b.x < beamX + beamWidth && b.x + b.width > beamX) {
              g.enemyBullets.splice(i, 1);
            }
          }
          for (let i = g.bossBullets.length - 1; i >= 0; i--) {
            const b = g.bossBullets[i];
            if (b.x < beamX + beamWidth && b.x + b.width > beamX) {
              g.bossBullets.splice(i, 1);
            }
          }

          if (g.bigBeamTimer <= 0) {
            g.isBigBeamActive = false;
            setIsBigBeamActive(false);
          }
        }
        if (g.bigBeamCooldown > 0) {
          g.bigBeamCooldown--;
          if (g.bigBeamCooldown % 60 === 0) {
            setBigBeamCooldown(g.bigBeamCooldown);
          }
        }

        // Dragonfly Focus Mode
        if (g.dragonflyActive) {
          g.dragonflyTimer--;
          if (g.dragonflyTimer <= 0) {
            g.dragonflyActive = false;
            setDragonflyActive(false);
          }
          // Slow down the game by skipping frames
          if (g.frameCount % 3 !== 0) {
            draw();
            animationFrameId = requestAnimationFrame(update);
            return;
          }
        }

        // Slow motion during mission complete
        if (g.isMissionCompleteActive) {
          g.missionCompleteTimer--;
          if (g.frameCount % 3 !== 0) {
            draw();
            animationFrameId = requestAnimationFrame(update);
            return;
          }
        }

        // Update Background Particles
      if (g.frameCount % 10 === 0 && g.backgroundParticles.length < 20) {
        g.backgroundParticles.push({
          x: Math.random() * CANVAS_WIDTH,
          y: -50,
          width: 10 + Math.random() * 20,
          height: 10 + Math.random() * 20,
          speed: 1 + Math.random() * 2,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.05,
          opacity: 0.1 + Math.random() * 0.2,
          color: Math.random() < 0.5 ? '#2d4a2d' : '#1a2e1a'
        });
      }
      for (let i = g.backgroundParticles.length - 1; i >= 0; i--) {
        const p = g.backgroundParticles[i];
        p.y += p.speed;
        p.rotation += p.rotationSpeed;
        if (p.y > CANVAS_HEIGHT) g.backgroundParticles.splice(i, 1);
      }

      // Player Movement
      const targetTilt = (g.keys['ArrowLeft'] || g.keys['a']) ? -0.15 : (g.keys['ArrowRight'] || g.keys['d']) ? 0.15 : 0;
      g.playerTilt = (g.playerTilt || 0) * 0.85 + targetTilt * 0.15;

      if (g.keys['ArrowLeft'] && g.player.x > 0) g.player.x -= g.player.speed;
      if (g.keys['ArrowRight'] && g.player.x < CANVAS_WIDTH - g.player.width) g.player.x += g.player.speed;
      if (g.keys['ArrowUp'] && g.player.y > 0) g.player.y -= g.player.speed;
      if (g.keys['ArrowDown'] && g.player.y < CANVAS_HEIGHT - g.player.height) g.player.y += g.player.speed;

      // Flight Particles
      if (g.frameCount % 2 === 0) {
        const pColor = g.player.type === 'BUTTERFLY' ? '#c084fc' : g.player.type === 'LADYBUG' ? '#f87171' : g.player.type === 'GOLDEN_HERCULES' ? '#fbbf24' : '#4ade80';
        g.flightParticles.push({
          x: g.player.x + g.player.width / 2 + (Math.random() - 0.5) * 20,
          y: g.player.y + g.player.height - 10,
          size: 2 + Math.random() * 3,
          life: 1,
          color: pColor
        });
        
        // Extra dust for butterfly
        if (g.player.type === 'BUTTERFLY' && Math.random() < 0.3) {
          g.flightParticles.push({
            x: g.player.x + (Math.random() * g.player.width),
            y: g.player.y + (Math.random() * g.player.height),
            size: 1 + Math.random() * 2,
            life: 0.8,
            color: '#fff'
          });
        }
      }
      for (let i = g.flightParticles.length - 1; i >= 0; i--) {
        const p = g.flightParticles[i];
        p.y += 3;
        p.life -= 0.05;
        if (p.life <= 0) g.flightParticles.splice(i, 1);
      }

      // Shooting
      if (g.frameCount % 10 === 0) {
        sounds.playShoot(g.player.type);
        const pLevel = g.powerLevel;
        let bDamage = 1;
        let bSpeed = 8;
        let bColor = '#4ade80';
        let bWidth = BULLET_SIZE;
        let bHeight = BULLET_SIZE * 2;

        if (g.player.type === 'BUTTERFLY') {
          bDamage = 0.8;
          bSpeed = 12;
          bColor = '#c084fc';
          bWidth = BULLET_SIZE * 0.8;
        } else if (g.player.type === 'LADYBUG') {
          bDamage = 1.5;
          bSpeed = 6;
          bColor = '#ef4444';
          bWidth = BULLET_SIZE * 1.2;
        } else if (g.player.type === 'GOLDEN_HERCULES') {
          bDamage = 2.0;
          bSpeed = 10;
          bColor = '#facc15';
          bWidth = BULLET_SIZE * 1.5;
        } else if (g.player.type === 'HERCULES') {
          bDamage = 4.0;
          bSpeed = 12;
          bColor = '#94a3b8';
          bWidth = BULLET_SIZE * 1.5;
          bHeight = BULLET_SIZE * 3;
        } else if (g.player.type === 'CICADA') {
          bDamage = pLevel === 3 ? 1.0 : 0.8;
          bSpeed = pLevel === 3 ? 8 : 6;
          bColor = '#86efac';
          bWidth = pLevel === 3 ? BULLET_SIZE * 0.8 : BULLET_SIZE * 0.7;
        } else if (g.player.type === 'MANTIS') {
          bDamage = 1.2;
          bSpeed = 14;
          bColor = '#22c55e';
          bWidth = BULLET_SIZE * 2;
          bHeight = BULLET_SIZE * 0.5; // Scythe shape
        } else if (g.player.type === 'GRASSHOPPER') {
          bDamage = g.lastStandActive ? 5.0 : 0.7;
          bSpeed = 16;
          bColor = g.lastStandActive ? '#facc15' : '#4ade80';
          bWidth = BULLET_SIZE * 0.6;
        } else if (g.player.type === 'STAG_BEETLE') {
          bDamage = 1.3;
          bSpeed = 9;
          bColor = '#57534e';
          bWidth = BULLET_SIZE * 1.4;
        } else if (g.player.type === 'SILVER_STAG_BEETLE') {
          bDamage = 1.5;
          bSpeed = 11;
          bColor = '#cbd5e1';
          bWidth = BULLET_SIZE;
        } else if (g.player.type === 'DRAGONFLY') {
          bDamage = 0.6;
          bSpeed = 13;
          bColor = '#ef4444';
          bWidth = BULLET_SIZE * 0.8;
        }

        const createBullet = (x: number, y: number, vx?: number, vy?: number) => {
          g.bullets.push({ x, y, width: bWidth, height: bHeight, speed: bSpeed, vx, vy, damage: bDamage, color: bColor });
          
          if (g.butterflyActive) {
            // Clone shots
            g.bullets.push({ x: x - 60, y: y + 20, width: bWidth, height: bHeight, speed: bSpeed, vx, vy, damage: bDamage, color: bColor });
            g.bullets.push({ x: x + 60, y: y + 20, width: bWidth, height: bHeight, speed: bSpeed, vx, vy, damage: bDamage, color: bColor });
          }
        };

        if (pLevel === 1) {
          createBullet(g.player.x + g.player.width / 2 - bWidth / 2, g.player.y);
        } else if (pLevel === 2) {
          createBullet(g.player.x + 5, g.player.y);
          createBullet(g.player.x + g.player.width - 5 - bWidth, g.player.y);
        } else {
          if (g.player.type === 'BUTTERFLY') {
            // 5-way spread for Butterfly
            for (let i = -2; i <= 2; i++) {
              createBullet(g.player.x + g.player.width / 2 - bWidth / 2, g.player.y, i * 2, -bSpeed);
            }
          } else if (g.player.type === 'LADYBUG') {
            // Massive bullets for Ladybug
            const massiveW = bWidth * 2;
            const massiveH = bHeight * 1.5;
            g.bullets.push({ 
              x: g.player.x + g.player.width / 2 - massiveW / 2, 
              y: g.player.y, 
              width: massiveW, 
              height: massiveH, 
              speed: bSpeed, 
              damage: bDamage * 2, 
              color: bColor 
            });
          } else if (g.player.type === 'GOLDEN_HERCULES') {
            // Combined Ultimate Shot
            // 5-way spread (Butterfly)
            for (let i = -2; i <= 2; i++) {
              createBullet(g.player.x + g.player.width / 2 - bWidth / 2, g.player.y, i * 3, -bSpeed);
            }
            // Side shots (Beetle)
            createBullet(g.player.x - 15, g.player.y + 10, -2, -bSpeed);
            createBullet(g.player.x + g.player.width + 15, g.player.y + 10, 2, -bSpeed);
            // Massive center shot (Ladybug)
            const massiveW = bWidth * (pLevel === 4 ? 3.5 : 2.5);
            const massiveH = bHeight * (pLevel === 4 ? 3 : 2);
            g.bullets.push({ 
              x: g.player.x + g.player.width / 2 - massiveW / 2, 
              y: g.player.y - 20, 
              width: massiveW, 
              height: massiveH, 
              speed: bSpeed * 1.2, 
              damage: bDamage * (pLevel === 4 ? 5 : 3), 
              color: '#fbbf24' 
            });
            if (pLevel === 4) {
              // Extra side spread for Level 4
              for (let i = -3; i <= 3; i++) {
                if (i === 0) continue;
                createBullet(g.player.x + g.player.width / 2 - bWidth / 2, g.player.y + 20, i * 4, -bSpeed * 0.8);
              }
              // Homing Missiles for Golden Hercules at Max Level
              if (g.frameCount % 40 === 0) {
                const side = (g.frameCount / 40) % 2 === 0 ? -1 : 1;
                g.bullets.push({
                  x: g.player.x + g.player.width / 2 + side * 30,
                  y: g.player.y + 20,
                  width: 10,
                  height: 15,
                  speed: 12,
                  vx: side * 5,
                  vy: -2,
                  homing: true,
                  damage: 2.5,
                  color: '#fbbf24'
                });
              }
            }
          } else if (g.player.type === 'HERCULES') {
            const count = 3 + Math.floor(pLevel / 2);
            for (let i = 0; i < count; i++) {
              const offset = (i - (count - 1) / 2) * 15;
              createBullet(g.player.x + g.player.width / 2 - bWidth / 2 + offset, g.player.y);
            }
            // Homing Missiles for Hercules at Max Level (Level 3)
            if (pLevel >= 3 && g.frameCount % 40 === 0) {
              const side = (g.frameCount / 40) % 2 === 0 ? -1 : 1;
              g.bullets.push({
                x: g.player.x + g.player.width / 2 + side * 25,
                y: g.player.y + 10,
                width: 8,
                height: 12,
                speed: 10,
                vx: side * 4,
                vy: -2,
                homing: true,
                damage: 3.0,
                color: '#94a3b8'
              });
            }
          } else if (g.player.type === 'MANTIS') {
            // Tricky scythes - Now more random and curving, with some homing at higher levels
            const count = pLevel === 1 ? 1 : pLevel === 2 ? 2 : 3;
            for (let i = 0; i < count; i++) {
              const spread = (Math.random() - 0.5) * 10;
              const curve = pLevel >= 2 ? (Math.random() - 0.5) * 0.4 : 0;
              const homing = pLevel >= 2 && Math.random() < 0.3;
              g.bullets.push({
                x: g.player.x + g.player.width / 2 - bWidth / 2,
                y: g.player.y,
                width: bWidth,
                height: bHeight,
                speed: bSpeed,
                vx: spread,
                vy: -bSpeed,
                curve: curve,
                homing: homing,
                damage: bDamage,
                color: homing ? '#facc15' : bColor
              });
            }
          } else if (g.player.type === 'CICADA') {
            // Sonic buzz
            const count = pLevel === 1 ? 3 : 5;
            const spread = 15;
            for (let i = 0; i < count; i++) {
              const offset = (i - (count - 1) / 2) * spread;
              createBullet(g.player.x + g.player.width / 2 - bWidth / 2 + offset, g.player.y);
            }
            // Max level special: Sonic Ball
            if (pLevel >= 3 && g.frameCount % 30 === 0) {
              const ballSize = 40;
              g.bullets.push({
                x: g.player.x + g.player.width / 2 - ballSize / 2,
                y: g.player.y - 20,
                width: ballSize,
                height: ballSize,
                speed: bSpeed * 0.6,
                vx: 0,
                vy: -bSpeed * 0.6,
                damage: bDamage * 5,
                color: '#fff'
              });
            }
          } else if (g.player.type === 'SILVER_STAG_BEETLE') {
            // 8-way spread + homing missiles
            for (let i = -3; i <= 3; i += 2) {
              createBullet(g.player.x + g.player.width / 2 - bWidth / 2 + i * 8, g.player.y);
            }
            if (g.frameCount % 30 === 0) {
              for (let k = -1; k <= 1; k += 2) {
                g.bullets.push({ x: g.player.x + g.player.width / 2 + k * 30, y: g.player.y + 20, width: 8, height: 14, speed: 8, vx: k * 2, vy: -2, homing: true, damage: 2.0, color: '#94a3b8' });
              }
            }
          } else if (g.player.type === 'DRAGONFLY') {
            // Homing spread
            for (let i = -2; i <= 2; i++) {
              g.bullets.push({ x: g.player.x + g.player.width / 2 - bWidth / 2 + i * 8, y: g.player.y, width: bWidth, height: bHeight, speed: bSpeed, vx: i * 1.5, vy: -bSpeed, homing: true, damage: bDamage, color: bColor });
            }
          } else {
            // Standard 3-way for Beetle
            createBullet(g.player.x + g.player.width / 2 - bWidth / 2, g.player.y);
            createBullet(g.player.x - 10, g.player.y + 10, -1, -bSpeed);
            createBullet(g.player.x + g.player.width + 10, g.player.y + 10, 1, -bSpeed);
          }
        }
      }

      // Spawn Enemies & Boss
      const enemiesNeeded = 30 + g.stage * 20;
      if (!g.bossSpawned && g.enemiesKilledInStage >= enemiesNeeded) {
        g.bossSpawned = true;
        g.bossWarning = 180; // 3 seconds warning
        sounds.playWarning();
        sounds.playBGM(g.stage, true); // Boss BGM
      }

      if (g.bossWarning > 0) {
        g.bossWarning--;
        if (g.bossWarning === 1) {
          let bossHealth = 50 + g.stage * 25;
          let bossColor = '#800080'; // Default purple
          let bossSize = 100;
          if (g.stage === 1) bossColor = '#333';
          else if (g.stage === 2) bossColor = '#8b7355';
          else if (g.stage === 3) bossColor = '#1a1a1a';
          else if (g.stage === 4) bossColor = '#2a150d';
          else if (g.stage === 5) bossColor = '#facc15';
          else if (g.stage === 6) bossColor = '#166534';
          else if (g.stage >= 7) {
            bossColor = '#ef4444'; // Red for hidden boss
            bossSize = 150;
            bossHealth = 1500; // Massive health for the ultimate boss
          }

          g.enemies.push({
            x: CANVAS_WIDTH / 2 - bossSize / 2,
            y: -bossSize,
            width: bossSize,
            height: bossSize,
            speed: g.stage >= 7 ? 2 : 1,
            type: 'BOSS',
            health: bossHealth,
            maxHealth: bossHealth,
            phase: 1,
            color: bossColor
          });
        }
      }

      if (time - g.lastSpawn > Math.max(200, SPAWN_RATE - scoreRef.current / 15 - g.stage * 35)) {
        // Only spawn regular enemies if boss isn't present
        if (!g.enemies.some(e => e.type === 'BOSS') && g.enemiesKilledInStage < enemiesNeeded) {
          let types: Enemy['type'][] = ['FLY'];
          if (g.stage === 1) types = ['FLY', 'WASP'];
          else if (g.stage === 2) types = ['FLY', 'MOSQUITO', 'WASP', 'MOTH'];
          else if (g.stage === 3) types = ['MOSQUITO', 'SPIDER', 'MOTH', 'BEETLE_DRONE'];
          else if (g.stage === 4) types = ['SPIDER', 'CHARGER', 'BEETLE_DRONE', 'FIREFLY'];
          else if (g.stage === 5) types = ['CHARGER', 'SPITTER', 'FIREFLY', 'DRAGONFLY'];
          else if (g.stage === 6) types = ['SPITTER', 'DRAGONFLY', 'SWARM_BOT'];
          else if (g.stage >= 7) types = ['SPITTER', 'DRAGONFLY', 'SWARM_BOT', 'CHARGER'];

          const type = types[Math.floor(Math.random() * types.length)];
          let health = 1;
          let speed = 2 + Math.random() * 2 + g.stage * 0.3;
          let width = ENEMY_SIZE;
          let height = ENEMY_SIZE;
          let color = '#333';
          let oscillationOffset = Math.random() * Math.PI * 2;
          let behaviorState = 'NORMAL';
          let enemyChargeTimer: number | undefined = undefined;
          let enemyTargetX: number | undefined = undefined;

          if (type === 'SPIDER') {
            health = 2;
            color = '#222';
            if (g.stage === 2) color = '#5d4037';
            else if (g.stage === 3) color = '#312e81';
            else if (g.stage === 4) color = '#450a0a';
            else if (g.stage === 5) color = '#075985';
            else if (g.stage >= 6) color = '#1e1b4b';
          } else if (type === 'CHARGER') {
            health = 2;
            speed = 1.5;
            width = ENEMY_SIZE * 1.2;
            color = '#991b1b';
            if (g.stage === 2) color = '#ea580c';
            else if (g.stage === 3) color = '#4338ca';
            else if (g.stage === 4) color = '#dc2626';
            else if (g.stage === 5) color = '#0284c7';
            else if (g.stage >= 6) color = '#7c3aed';
          } else if (type === 'SPITTER') {
            health = 2;
            speed = 1.2;
            color = '#166534';
            if (g.stage === 2) color = '#854d0e';
            else if (g.stage === 3) color = '#1e40af';
            else if (g.stage === 4) color = '#991b1b';
            else if (g.stage === 5) color = '#0369a1';
            else if (g.stage >= 6) color = '#581c87';
          } else if (type === 'FLY') {
            color = '#333';
            if (g.stage === 2) color = '#8b4513';
            else if (g.stage === 3) color = '#4b0082';
            else if (g.stage === 4) color = '#b91c1c';
            else if (g.stage === 5) color = '#0ea5e9';
            else if (g.stage >= 6) color = '#a855f7';
          } else if (type === 'MOSQUITO') {
            color = '#555';
            if (g.stage === 2) color = '#a0522d';
            else if (g.stage === 3) color = '#1e3a8a';
            else if (g.stage === 4) color = '#7f1d1d';
            else if (g.stage === 5) color = '#38bdf8';
            else if (g.stage >= 6) color = '#4c1d95';
          } else if (type === 'WASP') {
            health = 1;
            speed = 4 + Math.random() * 2;
            color = '#fbbf24';
          } else if (type === 'MOTH') {
            health = 2;
            speed = 2;
            color = '#a8a29e';
          } else if (type === 'BEETLE_DRONE') {
            health = 3;
            speed = 1;
            width = ENEMY_SIZE * 1.3;
            height = ENEMY_SIZE * 1.1;
            color = '#444';
          } else if (type === 'FIREFLY') {
            health = 2;
            speed = 1.5;
            color = '#bef264';
            behaviorState = 'DIM';
            enemyChargeTimer = 60 + Math.random() * 60;
          } else if (type === 'DRAGONFLY') {
            health = 2;
            speed = 3;
            width = ENEMY_SIZE * 1.5;
            height = ENEMY_SIZE * 0.8;
            color = '#06b6d4';
            behaviorState = 'HORIZONTAL';
            enemyTargetX = Math.random() < 0.5 ? 4 : -4;
            enemyChargeTimer = 100 + Math.random() * 100;
          } else if (type === 'SWARM_BOT') {
            health = 1;
            speed = 3.5;
            width = ENEMY_SIZE * 0.6;
            height = ENEMY_SIZE * 0.6;
            color = '#6366f1';
          }

          g.enemies.push({
            x: Math.random() * (CANVAS_WIDTH - width),
            y: -height,
            width,
            height,
            speed,
            type,
            health,
            maxHealth: health,
            chargeState: type === 'CHARGER' ? 'WAIT' : undefined,
            chargeTimer: type === 'CHARGER' ? 60 + Math.random() * 60 : enemyChargeTimer,
            lastShot: (type === 'SPITTER' || type === 'BEETLE_DRONE') ? time : undefined,
            color,
            oscillationOffset,
            behaviorState,
            targetX: enemyTargetX
          });
        }
        g.lastSpawn = time;
      }

      // Update X-Slash
      if (g.isXSlashActive) {
        g.xSlashTimer--;
        if (g.xSlashTimer <= 0) {
          g.isXSlashActive = false;
          setIsXSlashActive(false);
        }
        
        const slashX = g.player.x + g.player.width / 2;
        const slashY = g.player.y - (60 - g.xSlashTimer) * 12;
        const slashSize = 180;
        
        for (let i = g.bossBullets.length - 1; i >= 0; i--) {
          const b = g.bossBullets[i];
          const dx = b.x + b.width/2 - slashX;
          const dy = b.y + b.height/2 - slashY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < slashSize / 2) {
            g.bossBullets.splice(i, 1);
            for (let p = 0; p < 5; p++) {
              g.particles.push({
                x: b.x + b.width / 2,
                y: b.y + b.height / 2,
                width: 2,
                height: 2,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 1,
                color: '#4ade80'
              });
            }
          }
        }
        
        for (let i = g.enemyBullets.length - 1; i >= 0; i--) {
          const b = g.enemyBullets[i];
          const dx = b.x + b.width/2 - slashX;
          const dy = b.y + b.height/2 - slashY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < slashSize / 2) {
            g.enemyBullets.splice(i, 1);
            for (let p = 0; p < 5; p++) {
              g.particles.push({
                x: b.x + b.width / 2,
                y: b.y + b.height / 2,
                width: 2,
                height: 2,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 1,
                color: '#4ade80'
              });
            }
          }
        }
        
        for (let i = g.enemies.length - 1; i >= 0; i--) {
          const e = g.enemies[i];
          const dx = e.x + e.width/2 - slashX;
          const dy = e.y + e.height/2 - slashY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < slashSize / 2) {
            if (e.type === 'BOSS') {
              e.health -= 5;
              e.hitFlash = 5;
            } else {
              updateScore(e.type === 'SWARM_BOT' ? 500 : 100);
              g.enemiesKilledInStage++;
              for (let p = 0; p < 10; p++) {
                g.particles.push({
                  x: e.x + e.width / 2,
                  y: e.y + e.height / 2,
                  width: 4,
                  height: 4,
                  vx: (Math.random() - 0.5) * 10,
                  vy: (Math.random() - 0.5) * 10,
                  life: 1,
                  color: e.color || '#fff'
                });
              }
              g.enemies.splice(i, 1);
              sounds.playExplosion();
            }
          }
        }
      }

      // Update Bullets
      for (let i = g.bullets.length - 1; i >= 0; i--) {
        const b = g.bullets[i];
        
        // Homing logic
        if (b.homing && g.enemies.length > 0) {
          let nearestEnemy = null;
          let minDistanceSq = Infinity;
          for (const enemy of g.enemies) {
            const dx = enemy.x + enemy.width / 2 - b.x;
            const dy = enemy.y + enemy.height / 2 - b.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < minDistanceSq) {
              minDistanceSq = distSq;
              nearestEnemy = enemy;
            }
          }
          if (nearestEnemy) {
            const dx = nearestEnemy.x + nearestEnemy.width / 2 - b.x;
            const dy = nearestEnemy.y + nearestEnemy.height / 2 - b.y;
            const angle = Math.atan2(dy, dx);
            const targetVx = Math.cos(angle) * b.speed;
            const targetVy = Math.sin(angle) * b.speed;
            const strength = b.homingStrength || 0.05;
            b.vx = (b.vx || 0) * (1 - strength) + targetVx * strength;
            b.vy = (b.vy || 0) * (1 - strength) + targetVy * strength;
          }
        }

        if (b.curve !== undefined && b.vx !== undefined) {
          b.vx += b.curve;
        }
        if (b.vx !== undefined && b.vy !== undefined) {
          b.x += b.vx;
          b.y += b.vy;
        } else {
          b.y -= b.speed;
        }
        if (b.y <= -b.height || b.y >= CANVAS_HEIGHT || b.x <= -b.width || b.x >= CANVAS_WIDTH) {
          g.bullets.splice(i, 1);
        }
      }
      if (g.bullets.length > 300) g.bullets.splice(0, g.bullets.length - 300);

      // Update Items
      for (let i = g.items.length - 1; i >= 0; i--) {
        const item = g.items[i];
        item.y += item.speed;
        // Collision with player
        if (item.x < g.player.x + g.player.width &&
            item.x + item.width > g.player.x &&
            item.y < g.player.y + g.player.height &&
            item.y + item.height > g.player.y) {
          if (item.type === 'POWER_UP') {
            sounds.playPowerUp();
            const maxP = g.player.type === 'CICADA' ? 3 : g.player.type === 'GOLDEN_HERCULES' ? 4 : 3;
            g.powerLevel = Math.min(maxP, g.powerLevel + 1);
            if (g.player.type === 'CICADA') {
              g.player.speed = g.powerLevel === 3 ? 7 : 4;
            }
            setPowerLevel(g.powerLevel);
          } else if (item.type === 'HEAL') {
            sounds.playPowerUp();
            const maxL = g.player.type === 'CICADA' ? (g.powerLevel === 3 ? 3 : 2) : g.player.type === 'GOLDEN_HERCULES' ? 4 : 3;
            setLives(prev => Math.min(maxL, prev + 1));
          }
          g.items.splice(i, 1);
          continue;
        }
        if (item.y >= CANVAS_HEIGHT) {
          g.items.splice(i, 1);
        }
      }

      // Update Enemy Bullets
      for (let i = g.enemyBullets.length - 1; i >= 0; i--) {
        const b = g.enemyBullets[i];
        if (g.timeStopActive) continue; // Freeze regular enemy bullets
        if (b.vx !== undefined && b.vy !== undefined) {
          b.x += b.vx;
          b.y += b.vy;
        } else {
          b.y += b.speed;
        }
        // Collision with player
        const isHit = b.x < g.player.x + g.player.width &&
                      b.x + b.width > g.player.x &&
                      b.y < g.player.y + g.player.height &&
                      b.y + b.height > g.player.y;

        if (isHit) {
          if (g.isInvulnerable <= 0) {
            handlePlayerHit();
            g.enemyBullets.splice(i, 1);
            continue;
          }
        }
        if (b.y >= CANVAS_HEIGHT || b.y <= -b.height || b.x <= -b.width || b.x >= CANVAS_WIDTH) {
          g.enemyBullets.splice(i, 1);
        }
      }
      if (g.enemyBullets.length > 100) g.enemyBullets.splice(0, g.enemyBullets.length - 100);

      // Update Boss Bullets
      for (let i = g.bossBullets.length - 1; i >= 0; i--) {
        const b = g.bossBullets[i];
        if (g.timeStopActive && g.frameCount % 5 !== 0) continue; // Slow boss bullets
        if (b.vx !== undefined && b.vy !== undefined) {
          b.x += b.vx;
          b.y += b.vy;
        } else {
          b.y += b.speed;
        }
        // Collision with player
        const isHit = b.x < g.player.x + g.player.width &&
                      b.x + b.width > g.player.x &&
                      b.y < g.player.y + g.player.height &&
                      b.y + b.height > g.player.y;

        if (isHit) {
          if (g.isInvulnerable <= 0) {
            handlePlayerHit();
            g.bossBullets.splice(i, 1);
            continue;
          }
        }
        if (b.y >= CANVAS_HEIGHT || b.y <= -b.height || b.x <= -b.width || b.x >= CANVAS_WIDTH) {
          g.bossBullets.splice(i, 1);
        }
      }
      if (g.bossBullets.length > 200) g.bossBullets.splice(0, g.bossBullets.length - 200);

      // Update Enemies
      for (let i = g.enemies.length - 1; i >= 0; i--) {
        const e = g.enemies[i];
        
        // Stag Beetle Time Stop logic
        const isEnemyStopped = g.timeStopActive && (e.type !== 'BOSS' || g.frameCount % 5 !== 0);
        
        if (!isEnemyStopped) {
          if (e.type === 'BOSS') {
            // Boss movement pattern
            e.y = Math.min(100, e.y + e.speed);
            e.x += Math.sin(g.frameCount / 30) * 3;

            // Boss Shooting
            const stage = g.stage;
            const shotInterval = Math.max(400, 1800 - stage * 250);
            if (time - g.lastBossShot > shotInterval) {
              if (stage === 1) {
                const targetX = g.cicadaActive ? e.x + (Math.random() - 0.5) * 400 : g.player.x;
                const targetY = g.cicadaActive ? CANVAS_HEIGHT + 100 : g.player.y;
                const angle = Math.atan2(targetY - e.y, targetX - e.x);
                g.bossBullets.push({ x: e.x + e.width/2 - 4, y: e.y + e.height - 20, width: 8, height: 16, speed: 5, vx: Math.cos(angle) * 6, vy: Math.sin(angle) * 6, damage: 1, color: '#ff0000' });
              } else if (stage === 2) {
                for (let j = -3; j <= 3; j++) {
                  const angle = Math.PI / 2 + (j * Math.PI / 8);
                  g.bossBullets.push({ x: e.x + e.width/2 - 6, y: e.y + e.height - 20, width: 12, height: 12, speed: 3, vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3, damage: 1, color: '#ff0000' });
                }
              } else if (stage === 3) {
                for (let j = 0; j < 8; j++) {
                  const angle = (j * Math.PI) / 4;
                  g.bossBullets.push({ x: e.x + e.width/2 - 5, y: e.y + e.height/2 - 5, width: 10, height: 10, speed: 4, vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4, damage: 1, color: '#ff0000' });
                }
              } else if (stage === 4) {
                for (let j = -1; j <= 1; j += 2) {
                  g.bossBullets.push({ x: e.x + e.width/2 + j * 25 - 6, y: e.y + e.height - 10, width: 12, height: 24, speed: 7, vx: 0, vy: 7, damage: 1, color: '#ff0000' });
                }
                const targetX = g.cicadaActive ? e.x + (Math.random() - 0.5) * 400 : g.player.x;
                const targetY = g.cicadaActive ? CANVAS_HEIGHT + 100 : g.player.y;
                const angle = Math.atan2(targetY - e.y, targetX - e.x);
                g.bossBullets.push({ x: e.x + e.width/2 - 5, y: e.y + e.height/2, width: 10, height: 10, speed: 6, vx: Math.cos(angle) * 8, vy: Math.sin(angle) * 8, damage: 1, color: '#ff0000' });
              } else if (stage === 5) {
                const spiralAngle = (g.frameCount / 10) % (Math.PI * 2);
                for (let j = 0; j < 4; j++) {
                  const angle = spiralAngle + (j * Math.PI / 2);
                  g.bossBullets.push({ x: e.x + e.width/2 - 4, y: e.y + e.height/2 - 4, width: 8, height: 16, speed: 5, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5, damage: 1, color: '#ff0000' });
                }
                const targetX = g.cicadaActive ? e.x + (Math.random() - 0.5) * 400 : g.player.x;
                const targetY = g.cicadaActive ? CANVAS_HEIGHT + 100 : g.player.y;
                const targetAngle = Math.atan2(targetY - e.y, targetX - e.x);
                g.bossBullets.push({ x: e.x + e.width/2 - 6, y: e.y + e.height - 10, width: 12, height: 20, speed: 8, vx: Math.cos(targetAngle) * 9, vy: Math.sin(targetAngle) * 9, damage: 1, color: '#ff0000' });
              } else if (stage === 6) {
                // Stage 6: Giant Mantis
                const mode = Math.floor(g.frameCount / 180) % 3;
                if (mode === 0) {
                  // Scythe Wave
                  for (let j = -4; j <= 4; j++) {
                    const angle = Math.PI/2 + (j * Math.PI / 10);
                    g.bossBullets.push({ x: e.x + e.width/2 - 10, y: e.y + e.height - 20, width: 20, height: 5, speed: 5, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5, damage: 1, color: '#22c55e' });
                  }
                } else if (mode === 1) {
                  // Rapid Spores
                  const targetX = g.cicadaActive ? e.x + (Math.random() - 0.5) * 400 : g.player.x;
                  const targetY = g.cicadaActive ? CANVAS_HEIGHT + 100 : g.player.y;
                  const angle = Math.atan2(targetY - e.y, targetX - e.x);
                  for (let j = 0; j < 3; j++) {
                    g.bossBullets.push({ x: e.x + e.width/2 - 5, y: e.y + e.height/2, width: 10, height: 10, speed: 6 + j, vx: Math.cos(angle) * (6+j), vy: Math.sin(angle) * (6+j), damage: 1, color: '#facc15' });
                  }
                } else {
                  // Circle Burst
                  for (let j = 0; j < 12; j++) {
                    const angle = (j * Math.PI) / 6;
                    g.bossBullets.push({ x: e.x + e.width/2 - 4, y: e.y + e.height/2 - 4, width: 8, height: 8, speed: 4, vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4, damage: 1, color: '#4ade80' });
                  }
                }
              } else if (stage >= 7) {
                // Stage 7: Ultimate Hidden Boss (The Crimson Fortress)
                const phase = Math.floor(g.frameCount / 240) % 4;
                
                if (phase === 0) {
                  // Phase 0: Omnidirectional Burst
                  for (let j = 0; j < 24; j++) {
                    const angle = (j * Math.PI) / 12;
                    g.bossBullets.push({ 
                      x: e.x + e.width/2 - 6, 
                      y: e.y + e.height/2 - 6, 
                      width: 12, height: 12, 
                      speed: 4, 
                      vx: Math.cos(angle) * 4, 
                      vy: Math.sin(angle) * 4, 
                      damage: 1, 
                      color: '#ef4444' 
                    });
                  }
                } else if (phase === 1) {
                  // Phase 1: Targeted Homing Missiles
                  for (let j = 0; j < 4; j++) {
                    const targetX = g.player.x + (j - 1.5) * 50;
                    const angle = Math.atan2(g.player.y - e.y, targetX - e.x);
                    g.bossBullets.push({ 
                      x: e.x + e.width/2 - 8, 
                      y: e.y + e.height - 20, 
                      width: 16, height: 24, 
                      speed: 6, 
                      vx: Math.cos(angle) * 6, 
                      vy: Math.sin(angle) * 6, 
                      damage: 1, 
                      color: '#facc15',
                      homing: true,
                      homingStrength: 0.05
                    });
                  }
                } else if (phase === 2) {
                  // Phase 2: Spiral Barrage
                  const spiralAngle = (g.frameCount / 5) % (Math.PI * 2);
                  for (let j = 0; j < 6; j++) {
                    const angle = spiralAngle + (j * Math.PI / 3);
                    g.bossBullets.push({ 
                      x: e.x + e.width/2 - 5, 
                      y: e.y + e.height/2 - 5, 
                      width: 10, height: 20, 
                      speed: 5, 
                      vx: Math.cos(angle) * 7, 
                      vy: Math.sin(angle) * 7, 
                      damage: 1, 
                      color: '#ef4444' 
                    });
                  }
                } else {
                  // Phase 3: Massive Spread & Sniper
                  for (let j = -10; j <= 10; j++) {
                    const angle = Math.PI/2 + (j * Math.PI / 20);
                    g.bossBullets.push({ 
                      x: e.x + e.width/2 - 4, 
                      y: e.y + e.height - 10, 
                      width: 8, height: 16, 
                      speed: 4, 
                      vx: Math.cos(angle) * 4, 
                      vy: Math.sin(angle) * 4, 
                      damage: 1, 
                      color: '#ef4444' 
                    });
                  }
                  // Sniper shot
                  const angle = Math.atan2(g.player.y - e.y, g.player.x - e.x);
                  g.bossBullets.push({ 
                    x: e.x + e.width/2 - 10, 
                    y: e.y + e.height/2, 
                    width: 20, height: 40, 
                    speed: 12, 
                    vx: Math.cos(angle) * 12, 
                    vy: Math.sin(angle) * 12, 
                    damage: 2, 
                    color: '#fff' 
                  });
                }
              }
              g.lastBossShot = time;
            }
          } else if (e.type === 'CHARGER') {
            if (e.chargeState === 'WAIT') {
              e.y += e.speed;
              if (e.chargeTimer !== undefined) {
                e.chargeTimer--;
                if (e.chargeTimer <= 0) {
                  e.chargeState = 'CHARGE';
                  const targetX = g.cicadaActive ? e.x + (Math.random() - 0.5) * 400 : g.player.x;
                  const targetY = g.cicadaActive ? CANVAS_HEIGHT + 100 : g.player.y;
                  const angle = Math.atan2(targetY - e.y, targetX - e.x);
                  e.targetX = Math.cos(angle) * 8;
                  e.targetY = Math.sin(angle) * 8;
                }
              }
            } else {
              e.x += e.targetX || 0;
              e.y += e.targetY || 0;
            }
          } else if (e.type === 'SPITTER') {
            e.y += e.speed;
            if (time - (e.lastShot || 0) > 2500) {
              // Cicada Skill: Don't target player
              const targetX = g.cicadaActive ? e.x + (Math.random() - 0.5) * 200 : g.player.x;
              const targetY = g.cicadaActive ? CANVAS_HEIGHT + 100 : g.player.y;
              const angle = Math.atan2(targetY - e.y, targetX - e.x);
              g.enemyBullets.push({
                x: e.x + e.width / 2 - 4,
                y: e.y + e.height,
                width: 8,
                height: 8,
                speed: 4,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                damage: 1,
                color: '#4ade80'
              });
              e.lastShot = time;
            }
          } else if (e.type === 'MOTH') {
            e.y += e.speed;
            e.x += Math.sin(g.frameCount / 20 + (e.oscillationOffset || 0)) * 3;
          } else if (e.type === 'BEETLE_DRONE') {
            e.y += e.speed;
            if (time - (e.lastShot || 0) > 3000) {
              for (let j = -1; j <= 1; j++) {
                // Cicada Skill: Don't target player
                const baseAngle = g.cicadaActive ? Math.PI / 2 + (Math.random() - 0.5) * 0.5 : Math.PI / 2;
                const angle = baseAngle + (j * Math.PI / 6);
                g.enemyBullets.push({
                  x: e.x + e.width / 2 - 4,
                  y: e.y + e.height,
                  width: 8,
                  height: 8,
                  speed: 3,
                  vx: Math.cos(angle) * 3,
                  vy: Math.sin(angle) * 3,
                  damage: 1,
                  color: '#94a3b8'
                });
              }
              e.lastShot = time;
            }
          } else if (e.type === 'FIREFLY') {
            e.y += e.speed * 0.8;
            e.x += Math.cos(g.frameCount / 15 + (e.oscillationOffset || 0)) * 2;
            
            if (e.chargeTimer !== undefined) {
              e.chargeTimer--;
              if (e.chargeTimer <= 0) {
                if (e.behaviorState === 'DIM') {
                  e.behaviorState = 'BRIGHT';
                  e.chargeTimer = 30;
                  // Fire when bright
                  // Cicada Skill: Don't target player
                  const targetX = g.cicadaActive ? e.x + (Math.random() - 0.5) * 200 : g.player.x;
                  const targetY = g.cicadaActive ? CANVAS_HEIGHT + 100 : g.player.y;
                  const angle = Math.atan2(targetY - e.y, targetX - e.x);
                  g.enemyBullets.push({
                    x: e.x + e.width / 2 - 4,
                    y: e.y + e.height / 2 - 4,
                    width: 10,
                    height: 10,
                    speed: 5,
                    vx: Math.cos(angle) * 5,
                    vy: Math.sin(angle) * 5,
                    damage: 1,
                    color: '#fde047'
                  });
                } else {
                  e.behaviorState = 'DIM';
                  e.chargeTimer = 60 + Math.random() * 60;
                }
              }
            }
          } else if (e.type === 'DRAGONFLY') {
            if (e.behaviorState === 'HORIZONTAL') {
              e.x += e.targetX || 0;
              e.y += e.speed * 0.3;
              if (e.x <= 0 || e.x >= CANVAS_WIDTH - e.width) {
                e.targetX = -(e.targetX || 0);
              }
              if (e.chargeTimer !== undefined) {
                e.chargeTimer--;
                if (e.chargeTimer <= 0) {
                  e.behaviorState = 'DIVE';
                }
              }
            } else {
              e.y += e.speed * 2.5;
            }
          } else if (e.type === 'SWARM_BOT') {
            e.y += e.speed;
            e.x += Math.sin(g.frameCount / 10 + (e.oscillationOffset || 0)) * 4;
          } else {
            e.y += e.speed;
          }

          // Cicada Skill: Enemies avoid player
          if (g.cicadaActive) {
            const dx = e.x + e.width / 2 - (g.player.x + g.player.width / 2);
            const dy = e.y + e.height / 2 - (g.player.y + g.player.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
              const force = (180 - dist) / 180;
              e.x += (dx / dist) * 6 * force;
              e.y += (dy / dist) * 2 * force;
            }
          }
        }
        
        // Collision with player
        if (g.isInvulnerable <= 0 && 
            e.x < g.player.x + g.player.width &&
            e.x + e.width > g.player.x &&
            e.y < g.player.y + g.player.height &&
            e.y + e.height > g.player.y) {
          handlePlayerHit();
          g.enemies.splice(i, 1);
          continue;
        }

        // Optimized Collision with bullets
        for (let j = g.bullets.length - 1; j >= 0; j--) {
          const b = g.bullets[j];
          if (b.x < e.x + e.width &&
              b.x + b.width > e.x &&
              b.y < e.y + e.height &&
              b.y + b.height > e.y) {
            if (g.timeStopActive) {
              if (e.type === 'BOSS') {
                e.health -= b.damage / 3;
              } else {
                e.health = 0; // Instant kill for regular enemies
              }
            } else {
              e.health -= b.damage;
            }
            if (e.type === 'BOSS') {
              sounds.playHit();
            }
            // Hit particles
            if (g.particles.length < 100) {
              for (let k = 0; k < 2; k++) {
                g.particles.push({
                  x: b.x + b.width / 2,
                  y: b.y,
                  width: 2,
                  height: 2,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  life: 1,
                  color: b.color
                });
              }
            }
            // Remove bullet
            g.bullets.splice(j, 1);
          }
        }

        if (e.hitFlash && e.hitFlash > 0) e.hitFlash--;

        if (e.health <= 0) {
          sounds.playExplosion(e.type === 'BOSS');
          if (e.type !== 'BOSS') g.enemiesKilledInStage++;
          let points = 100;
          if (e.type === 'BOSS') points = 2000 * g.stage;
          else if (e.type === 'SPIDER' || e.type === 'BEETLE_DRONE') points = 300;
          else if (e.type === 'CHARGER' || e.type === 'DRAGONFLY') points = 200;
          else if (e.type === 'SWARM_BOT') points = 50;
          
          updateScore(points);
          createExplosion(e.x + e.width/2, e.y + e.height/2, e.color || '#555');
          g.screenShake = e.type === 'BOSS' ? 15 : 3;
          
          // Drop Item
          if (Math.random() < 0.15 || e.type === 'BOSS') {
            g.items.push({
              x: e.x + e.width/2 - 15,
              y: e.y + e.height/2 - 15,
              width: 30,
              height: 30,
              speed: 2,
              type: Math.random() < 0.7 ? 'POWER_UP' : 'HEAL'
            });
          }

          if (e.type === 'BOSS') {
            g.screenShake = 40;
            nextStage();
          }
          g.enemies.splice(i, 1);
          continue;
        }

        if (e.y >= CANVAS_HEIGHT) {
          g.enemies.splice(i, 1);
        }
      }

      // Update Particles
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) {
          g.particles.splice(i, 1);
        }
      }
      if (g.particles.length > 150) g.particles.splice(0, g.particles.length - 150);

      if (g.isInvulnerable > 0) g.isInvulnerable--;
      if (g.isShieldActive) {
        g.shieldTimer--;
        if (g.shieldTimer <= 0) {
          g.isShieldActive = false;
          setIsShieldActive(false);
        }
      }

      if (g.butterflyActive) {
        g.butterflyTimer--;
        if (g.butterflyTimer <= 0) {
          g.butterflyActive = false;
          setIsButterflyActive(false);
        }
      }

      if (g.ladybugBeamActive) {
        g.ladybugBeamTimer--;
        const beamWidth = CANVAS_WIDTH / 3;
        const beamX = g.player.x + g.player.width / 2 - beamWidth / 2;
        
        // Damage enemies in beam
        for (const enemy of g.enemies) {
          if (enemy.x < beamX + beamWidth && enemy.x + enemy.width > beamX) {
            enemy.health -= 0.8;
            if (g.frameCount % 5 === 0) {
              g.particles.push({
                x: enemy.x + Math.random() * enemy.width,
                y: enemy.y + Math.random() * enemy.height,
                width: 4, height: 4, vx: 0, vy: -5, life: 1, color: '#f87171'
              });
            }
          }
        }

        if (g.ladybugBeamTimer <= 0) {
          g.ladybugBeamActive = false;
          setIsLadybugActive(false);
        }
      }

      if (g.cicadaActive) {
        g.cicadaTimer--;
        if (g.cicadaTimer <= 0) {
          g.cicadaActive = false;
          setIsCicadaActive(false);
        }
      }

      if (g.lastStandActive) {
        g.lastStandTimer--;
        if (g.lastStandTimer <= 0) {
          g.lastStandActive = false;
          setIsLastStandActive(false);
        }
      }
      if (g.lastStandCooldown > 0) g.lastStandCooldown--;

      if (g.timeStopActive) {
        g.timeStopTimer--;
        if (g.timeStopTimer <= 0) {
          g.timeStopActive = false;
          setIsTimeStopActive(false);
        }
      }
    }

      draw();
      animationFrameId = requestAnimationFrame(update);
    };


    const draw = () => {
      const g = gameRef.current;
      ctx.save();
      
      // Screen Shake
      if (g.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * g.screenShake;
        const shakeY = (Math.random() - 0.5) * g.screenShake;
        ctx.translate(shakeX, shakeY);
        g.screenShake *= 0.9;
        if (g.screenShake < 1) g.screenShake = 0;
      }

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background (Stage-specific colors)
      const bgColors = ['#1a2e1a', '#1a242e', '#2e1a1a', '#2e2e1a', '#1a1a1a', '#0a1a0a'];
      ctx.fillStyle = bgColors[g.stage - 1] || '#0a1a0a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Background Particles (Leaves)
      for (const p of g.backgroundParticles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.height/2);
        ctx.quadraticCurveTo(p.width/2, 0, 0, p.height/2);
        ctx.quadraticCurveTo(-p.width/2, 0, 0, -p.height/2);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // Subtle forest patterns
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for(let i=0; i<5; i++) { // Reduced from 10
        ctx.beginPath();
        ctx.arc((i * 240) % CANVAS_WIDTH, (g.frameCount * 0.5 + i * 300) % CANVAS_HEIGHT, 60, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw Particles
      const pLen = g.particles.length;
      for (let i = 0; i < pLen; i++) {
        const p = g.particles[i];
        ctx.globalAlpha = p.life;
        if (p.type === 'SHOCKWAVE') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, (1 - p.life) * 80, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.width, p.height);
        }
      }
      ctx.globalAlpha = 1;

      // Draw Ladybug Beam
      if (g.ladybugBeamActive) {
        const beamWidth = CANVAS_WIDTH / 3;
        const beamX = g.player.x + g.player.width / 2 - beamWidth / 2;
        const grad = ctx.createLinearGradient(beamX, 0, beamX + beamWidth, 0);
        grad.addColorStop(0, 'rgba(248, 113, 113, 0)');
        grad.addColorStop(0.2, 'rgba(248, 113, 113, 0.6)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.8, 'rgba(248, 113, 113, 0.6)');
        grad.addColorStop(1, 'rgba(248, 113, 113, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(beamX, 0, beamWidth, g.player.y + g.player.height / 2);
        
        // Beam core
        ctx.fillStyle = 'white';
        ctx.globalAlpha = 0.3;
        ctx.fillRect(beamX + beamWidth/2 - 10, 0, 20, g.player.y + g.player.height / 2);
        ctx.globalAlpha = 1;

        // Sparkles
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = 'white';
          ctx.fillRect(beamX + Math.random() * beamWidth, Math.random() * g.player.y, 2, 15);
        }
      }

      // Draw Silver Stag Big Beam
      if (g.isBigBeamActive) {
        const beamWidth = CANVAS_WIDTH / 3;
        const beamX = g.player.x + g.player.width / 2 - beamWidth / 2;
        const grad = ctx.createLinearGradient(beamX, 0, beamX + beamWidth, 0);
        grad.addColorStop(0, 'rgba(203, 213, 225, 0)');
        grad.addColorStop(0.2, 'rgba(203, 213, 225, 0.6)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.8, 'rgba(203, 213, 225, 0.6)');
        grad.addColorStop(1, 'rgba(203, 213, 225, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(beamX, 0, beamWidth, g.player.y + g.player.height / 2);
        
        // Beam core
        ctx.fillStyle = 'white';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(beamX + beamWidth/2 - 15, 0, 30, g.player.y + g.player.height / 2);
        ctx.globalAlpha = 1;

        // Lightning/Energy effects
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 2; i++) {
          ctx.beginPath();
          let curY = g.player.y;
          ctx.moveTo(beamX + Math.random() * beamWidth, curY);
          while (curY > 0) {
            curY -= 20;
            ctx.lineTo(beamX + Math.random() * beamWidth, curY);
          }
          ctx.stroke();
        }
      }

      // Draw Player
      const drawPlayer = (x: number, y: number, type: PlayerCharacter, tilt: number, alpha: number = 1) => {
        const px = x;
        const py = y;
        const pw = PLAYER_SIZE;
        const ph = PLAYER_SIZE;
        const centerX = px + pw / 2;
        const centerY = py + ph / 2;

        ctx.globalAlpha = alpha;

        // Shadow
        if (alpha > 0.5) {
          ctx.globalAlpha = 0.3 * alpha;
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.ellipse(centerX, centerY + 45, 20, 10, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = alpha;

        // Glow effect (Hero aura)
        const auraGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 35);
        const auraColor = type === 'BUTTERFLY' ? '192, 132, 252' 
                        : type === 'LADYBUG' ? '248, 113, 113' 
                        : type === 'GOLDEN_HERCULES' ? '250, 204, 21'
                        : type === 'HERCULES' ? '148, 163, 184'
                        : '74, 222, 128';
        auraGrad.addColorStop(0, `rgba(${auraColor}, ${alpha * (0.4 + Math.sin(g.frameCount * 0.1) * 0.2)})`);
        auraGrad.addColorStop(1, `rgba(${auraColor}, 0)`);
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(tilt || 0);
        ctx.translate(-centerX, -centerY);

        // Shield Effect
        if (g.isShieldActive && alpha > 0.5) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.5 + Math.sin(g.frameCount * 0.2) * 0.3})`;
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
          ctx.fill();
        }

        // Clones for Silver Stag Beetle (Only draw if this is the main ship, i.e., alpha is 1)
        if (type === 'SILVER_STAG_BEETLE' && g.powerLevel >= 3 && alpha > 0.9) {
          const cloneAlpha = 0.4 + Math.sin(g.frameCount * 0.1) * 0.1;
          drawPlayer(x - 40, y + 20, 'SILVER_STAG_BEETLE', tilt, cloneAlpha);
          drawPlayer(x + 40, y + 20, 'SILVER_STAG_BEETLE', tilt, cloneAlpha);
        }

        if (type === 'BEETLE' || type === 'GOLDEN_HERCULES') {
          const isGolden = type === 'GOLDEN_HERCULES';
          // Legs
          ctx.strokeStyle = isGolden ? '#facc15' : '#1a0d08';
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX - 10, centerY - 5 + i * 10);
            ctx.lineTo(centerX - 25, centerY - 10 + i * 10);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(centerX + 10, centerY - 5 + i * 10);
            ctx.lineTo(centerX + 25, centerY - 10 + i * 10);
            ctx.stroke();
          }

          // Wings (Animated)
          ctx.fillStyle = isGolden ? 'rgba(250, 204, 21, 0.4)' : 'rgba(200, 200, 255, 0.3)';
          const pWingFlap = Math.sin(g.frameCount / 2) * 15;
          ctx.beginPath();
          ctx.ellipse(centerX - 12, centerY + 5, 20, 8 + pWingFlap/2, Math.PI/4, 0, Math.PI * 2);
          ctx.ellipse(centerX + 12, centerY + 5, 20, 8 + pWingFlap/2, -Math.PI/4, 0, Math.PI * 2);
          ctx.fill();

          // Abdomen / Elytra (Main body)
          const bodyGrad = ctx.createRadialGradient(centerX - 5, centerY + 5, 2, centerX, centerY + 8, 20);
          bodyGrad.addColorStop(0, isGolden ? '#facc15' : '#5a2d1d');
          bodyGrad.addColorStop(1, isGolden ? '#fbbf24' : '#2a150d');
          ctx.fillStyle = bodyGrad;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY + 8, 16, 18, 0, 0, Math.PI * 2);
          ctx.fill();

          // Rim Light
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(centerX, centerY + 8, 16, Math.PI, Math.PI * 1.5);
          ctx.stroke();
          
          // Elytra split line
          ctx.strokeStyle = isGolden ? '#d97706' : '#1a0d08';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - 5);
          ctx.lineTo(centerX, centerY + 25);
          ctx.stroke();

          // Thorax
          const thoraxGrad = ctx.createLinearGradient(centerX - 10, centerY - 15, centerX + 10, centerY - 5);
          thoraxGrad.addColorStop(0, isGolden ? '#fde047' : '#4a271a');
          thoraxGrad.addColorStop(1, isGolden ? '#facc15' : '#2a150d');
          ctx.fillStyle = thoraxGrad;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY - 8, 14, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          // Head
          ctx.fillStyle = isGolden ? '#facc15' : '#2a150d';
          ctx.beginPath();
          ctx.ellipse(centerX, centerY - 18, 8, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Main Horn (The Y-shaped one)
          ctx.strokeStyle = isGolden ? '#facc15' : '#2a150d';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - 22);
          ctx.lineTo(centerX, centerY - 35); // Main stem
          ctx.stroke();
          
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - 35);
          ctx.lineTo(centerX - 8, centerY - 42); // Left fork
          ctx.moveTo(centerX, centerY - 35);
          ctx.lineTo(centerX + 8, centerY - 42); // Right fork
          ctx.stroke();
        } else if (type === 'HERCULES') {
          // Stylish Fighter Jet Style Hercules
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#94a3b8';
          
          // Engine Glow (Afterburner)
          const glow = Math.sin(g.frameCount / 2) * 5 + 12;
          const engineGrad = ctx.createLinearGradient(centerX - 10, centerY + 15, centerX + 10, centerY + 15 + glow);
          engineGrad.addColorStop(0, '#38bdf8');
          engineGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = engineGrad;
          ctx.beginPath();
          ctx.ellipse(centerX - 6, centerY + 15, 4, glow, 0, 0, Math.PI * 2);
          ctx.ellipse(centerX + 6, centerY + 15, 4, glow, 0, 0, Math.PI * 2);
          ctx.fill();

          // Main Wings (Delta Style)
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.moveTo(centerX - 4, centerY - 5);
          ctx.lineTo(centerX - 45, centerY + 25);
          ctx.lineTo(centerX - 4, centerY + 15);
          ctx.closePath();
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(centerX + 4, centerY - 5);
          ctx.lineTo(centerX + 45, centerY + 25);
          ctx.lineTo(centerX + 4, centerY + 15);
          ctx.closePath();
          ctx.fill();

          // Wing Details (Panel lines)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(centerX - 10, centerY + 5);
          ctx.lineTo(centerX - 35, centerY + 18);
          ctx.moveTo(centerX + 10, centerY + 5);
          ctx.lineTo(centerX + 35, centerY + 18);
          ctx.stroke();
          
          // Fuselage (Main Body)
          const fuselageGrad = ctx.createLinearGradient(centerX - 12, centerY, centerX + 12, centerY);
          fuselageGrad.addColorStop(0, '#94a3b8');
          fuselageGrad.addColorStop(0.5, '#cbd5e1');
          fuselageGrad.addColorStop(1, '#94a3b8');
          ctx.fillStyle = fuselageGrad;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - 35); // Sharp Nose
          ctx.bezierCurveTo(centerX - 12, centerY - 10, centerX - 12, centerY + 15, centerX - 8, centerY + 20);
          ctx.lineTo(centerX + 8, centerY + 20);
          ctx.bezierCurveTo(centerX + 12, centerY + 15, centerX + 12, centerY - 10, centerX, centerY - 35);
          ctx.fill();
          
          // Cockpit
          const cockpitGrad = ctx.createRadialGradient(centerX, centerY - 15, 2, centerX, centerY - 15, 8);
          cockpitGrad.addColorStop(0, '#38bdf8');
          cockpitGrad.addColorStop(1, '#0369a1');
          ctx.fillStyle = cockpitGrad;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY - 15, 5, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Cockpit Shine
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.ellipse(centerX - 2, centerY - 18, 2, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Tail Fins (Vertical Stabilizers)
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.moveTo(centerX - 4, centerY + 10);
          ctx.lineTo(centerX - 18, centerY + 28);
          ctx.lineTo(centerX - 4, centerY + 22);
          ctx.closePath();
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(centerX + 4, centerY + 10);
          ctx.lineTo(centerX + 18, centerY + 28);
          ctx.lineTo(centerX + 4, centerY + 22);
          ctx.closePath();
          ctx.fill();

          // Nose Detail
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - 35);
          ctx.lineTo(centerX, centerY - 25);
          ctx.stroke();
          
          ctx.shadowBlur = 0;
        } else if (type === 'BUTTERFLY') {
          // Wings
          const wingFlap = Math.sin(g.frameCount / 4) * 20;
          const wingGrad = ctx.createLinearGradient(centerX - 30, centerY, centerX + 30, centerY);
          wingGrad.addColorStop(0, '#c084fc');
          wingGrad.addColorStop(0.5, '#a855f7');
          wingGrad.addColorStop(1, '#c084fc');
          ctx.fillStyle = wingGrad;
          
          // Left wing
          ctx.beginPath();
          ctx.ellipse(centerX - 15, centerY, 20 + wingFlap/2, 25, Math.PI/6, 0, Math.PI * 2);
          ctx.fill();
          // Right wing
          ctx.beginPath();
          ctx.ellipse(centerX + 15, centerY, 20 + wingFlap/2, 25, -Math.PI/6, 0, Math.PI * 2);
          ctx.fill();
          
          // Wing patterns
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(centerX - 20, centerY - 10, 5, 0, Math.PI * 2);
          ctx.arc(centerX + 20, centerY - 10, 5, 0, Math.PI * 2);
          ctx.fill();

          // Body
          ctx.fillStyle = '#111';
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, 4, 18, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (type === 'LADYBUG') {
          // Body
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(centerX, centerY + 5, 18, 0, Math.PI * 2);
          ctx.fill();
          
          // Split line
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - 13);
          ctx.lineTo(centerX, centerY + 23);
          ctx.stroke();
          
          // Spots
          ctx.fillStyle = '#000';
          const spots = [[-8, -5], [8, -5], [-10, 8], [10, 8], [0, 15]];
          spots.forEach(([sx, sy]) => {
            ctx.beginPath();
            ctx.arc(centerX + sx, centerY + sy, 3.5, 0, Math.PI * 2);
            ctx.fill();
          });
          
          // Head
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.ellipse(centerX, centerY - 12, 10, 8, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (type === 'CICADA') {
          // Rounded clear wings - Cicada characteristic
          ctx.fillStyle = 'rgba(200, 255, 255, 0.25)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1.5;
          const cWingFlap = Math.sin(g.frameCount / 1.5) * 4;
          
          // Left Wing (Rounded)
          ctx.save();
          ctx.translate(centerX - 5, centerY - 5);
          ctx.rotate(Math.PI / 6 + cWingFlap * 0.05);
          ctx.beginPath();
          ctx.ellipse(-15, 15, 12, 25, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Wing veins
          ctx.beginPath();
          ctx.moveTo(-5, 5);
          ctx.lineTo(-20, 30);
          ctx.stroke();
          ctx.restore();
          
          // Right Wing (Rounded)
          ctx.save();
          ctx.translate(centerX + 5, centerY - 5);
          ctx.rotate(-Math.PI / 6 - cWingFlap * 0.05);
          ctx.beginPath();
          ctx.ellipse(15, 15, 12, 25, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Wing veins
          ctx.beginPath();
          ctx.moveTo(5, 5);
          ctx.lineTo(20, 30);
          ctx.stroke();
          ctx.restore();

          // Cicada Skill Visual: Sound waves
          if (g.cicadaActive) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            for (let j = 0; j < 3; j++) {
              const r = ((g.frameCount * 2 + j * 30) % 90);
              ctx.beginPath();
              ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
              ctx.stroke();
            }
          }

          // Body (Cute & Rounded)
          const cBodyGrad = ctx.createRadialGradient(centerX - 4, centerY, 2, centerX, centerY, 18);
          cBodyGrad.addColorStop(0, '#a16207');
          cBodyGrad.addColorStop(1, '#422006');
          ctx.fillStyle = cBodyGrad;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY + 5, 14, 16, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Body segments
          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.lineWidth = 1;
          for(let i=0; i<3; i++) {
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + 5 + i*4, 12 - i*2, 2, 0, 0, Math.PI);
            ctx.stroke();
          }

          // Head (Wide)
          ctx.fillStyle = '#713f12';
          ctx.beginPath();
          ctx.ellipse(centerX, centerY - 12, 16, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          // Large red eyes (Cute with highlights)
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(centerX - 12, centerY - 14, 5, 0, Math.PI * 2);
          ctx.arc(centerX + 12, centerY - 14, 5, 0, Math.PI * 2);
          ctx.fill();
          // Eye highlights
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(centerX - 13, centerY - 15, 1.5, 0, Math.PI * 2);
          ctx.arc(centerX + 11, centerY - 15, 1.5, 0, Math.PI * 2);
          ctx.fill();
          
          // Small antennae
          ctx.strokeStyle = '#422006';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(centerX - 5, centerY - 20);
          ctx.lineTo(centerX - 8, centerY - 26);
          ctx.moveTo(centerX + 5, centerY - 20);
          ctx.lineTo(centerX + 8, centerY - 26);
          ctx.stroke();
        } else if (type === 'MANTIS') {
          // Long body
          const mBodyGrad = ctx.createLinearGradient(centerX, centerY - 20, centerX, centerY + 25);
          mBodyGrad.addColorStop(0, '#22c55e');
          mBodyGrad.addColorStop(1, '#15803d');
          ctx.fillStyle = mBodyGrad;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY + 5, 7, 22, 0, 0, Math.PI * 2);
          ctx.fill();

          // Wings
          ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
          const mWingFlap = Math.sin(g.frameCount / 3) * 3;
          ctx.beginPath();
          ctx.ellipse(centerX - 8, centerY + 10, 15, 6 + mWingFlap, Math.PI/2.2, 0, Math.PI * 2);
          ctx.ellipse(centerX + 8, centerY + 10, 15, 6 + mWingFlap, -Math.PI/2.2, 0, Math.PI * 2);
          ctx.fill();

          // Triangular Head
          ctx.fillStyle = '#16a34a';
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - 15);
          ctx.lineTo(centerX - 10, centerY - 28);
          ctx.lineTo(centerX + 10, centerY - 28);
          ctx.closePath();
          ctx.fill();
          
          // Head Shine
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.beginPath();
          ctx.arc(centerX, centerY - 32, 3, 0, Math.PI * 2);
          ctx.fill();

          // Scythe Arms
          ctx.strokeStyle = '#16a34a';
          ctx.lineWidth = 4.5;
          ctx.lineCap = 'round';
          const armSwing = Math.sin(g.frameCount / 5) * 5;
          // Left Arm
          ctx.beginPath();
          ctx.moveTo(centerX - 4, centerY - 15);
          ctx.lineTo(centerX - 15, centerY - 25 + armSwing);
          ctx.lineTo(centerX - 10, centerY - 10 + armSwing);
          ctx.stroke();
          // Right Arm
          ctx.beginPath();
          ctx.moveTo(centerX + 4, centerY - 15);
          ctx.lineTo(centerX + 15, centerY - 25 - armSwing);
          ctx.lineTo(centerX + 10, centerY - 10 - armSwing);
          ctx.stroke();
          
          // Sharp edge highlight on arms
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(centerX - 15, centerY - 25 + armSwing);
          ctx.lineTo(centerX - 10, centerY - 10 + armSwing);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(centerX + 15, centerY - 25 - armSwing);
          ctx.lineTo(centerX + 10, centerY - 10 - armSwing);
          ctx.stroke();
        } else if (type === 'DRAGONFLY') {
          // Long slender body
          const dBodyGrad = ctx.createLinearGradient(centerX, centerY - 25, centerX, centerY + 25);
          dBodyGrad.addColorStop(0, '#ef4444');
          dBodyGrad.addColorStop(0.5, '#dc2626');
          dBodyGrad.addColorStop(1, '#991b1b');
          ctx.fillStyle = dBodyGrad;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY + 5, 4, 28, 0, 0, Math.PI * 2);
          ctx.fill();

          // 4 Large Clear Wings
          ctx.fillStyle = 'rgba(255, 200, 200, 0.2)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          const dWingFlap = Math.sin(g.frameCount / 1.5) * 5;
          
          // Upper wings
          ctx.beginPath();
          ctx.ellipse(centerX - 20, centerY - 5, 25 + dWingFlap, 6, Math.PI/10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(centerX + 20, centerY - 5, 25 + dWingFlap, 6, -Math.PI/10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // Lower wings
          ctx.beginPath();
          ctx.ellipse(centerX - 18, centerY + 8, 22 - dWingFlap, 5, -Math.PI/10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(centerX + 18, centerY + 8, 22 - dWingFlap, 5, Math.PI/10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Head with large eyes
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.ellipse(centerX, centerY - 22, 10, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Large compound eyes
          ctx.fillStyle = '#7f1d1d';
          ctx.beginPath();
          ctx.arc(centerX - 6, centerY - 24, 4, 0, Math.PI * 2);
          ctx.arc(centerX + 6, centerY - 24, 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Eye highlights
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.beginPath();
          ctx.arc(centerX - 7, centerY - 25, 1.5, 0, Math.PI * 2);
          ctx.arc(centerX + 5, centerY - 25, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Focus Mode Visual
          if (g.dragonflyActive) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 40 + Math.sin(g.frameCount / 5) * 10, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else if (type === 'GRASSHOPPER') {
          // Wings (Long and narrow along the body)
          ctx.fillStyle = 'rgba(74, 222, 128, 0.3)';
          ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)';
          ctx.lineWidth = 1;
          const gWingFlap = Math.sin(g.frameCount / 2) * 2;
          
          ctx.beginPath();
          ctx.ellipse(centerX - 5, centerY + 5, 8, 22 + gWingFlap, Math.PI / 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(centerX + 5, centerY + 5, 8, 22 + gWingFlap, -Math.PI / 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Long Body
          const gBodyGrad = ctx.createLinearGradient(centerX, centerY - 20, centerX, centerY + 20);
          gBodyGrad.addColorStop(0, '#4ade80');
          gBodyGrad.addColorStop(1, '#166534');
          ctx.fillStyle = gBodyGrad;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, 7, 22, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Head
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.ellipse(centerX, centerY - 18, 8, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Eyes
          ctx.fillStyle = '#14532d';
          ctx.beginPath();
          ctx.arc(centerX - 4, centerY - 22, 2.5, 0, Math.PI * 2);
          ctx.arc(centerX + 4, centerY - 22, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Antennae (Long and characteristic)
          ctx.strokeStyle = '#166534';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(centerX - 3, centerY - 25);
          ctx.quadraticCurveTo(centerX - 15, centerY - 45, centerX - 25, centerY - 40);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(centerX + 3, centerY - 25);
          ctx.quadraticCurveTo(centerX + 15, centerY - 45, centerX + 25, centerY - 40);
          ctx.stroke();

          // Long Jumping Legs
          ctx.strokeStyle = '#16a34a';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          // Left Leg (Bent)
          ctx.beginPath();
          ctx.moveTo(centerX - 5, centerY + 5);
          ctx.lineTo(centerX - 20, centerY + 15); // Upper leg
          ctx.lineTo(centerX - 15, centerY + 35); // Lower leg
          ctx.stroke();
          // Right Leg (Bent)
          ctx.beginPath();
          ctx.moveTo(centerX + 5, centerY + 5);
          ctx.lineTo(centerX + 20, centerY + 15); // Upper leg
          ctx.lineTo(centerX + 15, centerY + 35); // Lower leg
          ctx.stroke();

          // Last Stand Aura
          if (g.lastStandActive) {
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#facc15';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 30 + Math.sin(g.frameCount / 5) * 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        } else if (type === 'STAG_BEETLE' || type === 'SILVER_STAG_BEETLE') {
          const isSilver = type === 'SILVER_STAG_BEETLE';
          // Legs
          ctx.strokeStyle = isSilver ? '#64748b' : '#1a0d08';
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            const legY = centerY + (i * 8) - 5;
            const legOffset = Math.sin(g.frameCount / 10 + i) * 2;
            // Left legs
            ctx.beginPath();
            ctx.moveTo(centerX - 10, legY);
            ctx.lineTo(centerX - 25, legY - 5 + legOffset);
            ctx.lineTo(centerX - 30, legY + 5 + legOffset);
            ctx.stroke();
            // Right legs
            ctx.beginPath();
            ctx.moveTo(centerX + 10, legY);
            ctx.lineTo(centerX + 25, legY - 5 - legOffset);
            ctx.lineTo(centerX + 30, legY + 5 - legOffset);
            ctx.stroke();
          }

          // Body
          const bodyGrad = ctx.createLinearGradient(centerX - 15, centerY - 15, centerX + 15, centerY + 15);
          if (isSilver) {
            bodyGrad.addColorStop(0, '#cbd5e1');
            bodyGrad.addColorStop(0.5, '#94a3b8');
            bodyGrad.addColorStop(1, '#64748b');
          } else {
            bodyGrad.addColorStop(0, '#3d1f13');
            bodyGrad.addColorStop(0.5, '#2a150d');
            bodyGrad.addColorStop(1, '#000000');
          }
          ctx.fillStyle = bodyGrad;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY + 8, 16, 18, 0, 0, Math.PI * 2);
          ctx.fill();

          // Elytra (Wing covers) line
          ctx.strokeStyle = isSilver ? '#475569' : '#1a0d08';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - 5);
          ctx.lineTo(centerX, centerY + 26);
          ctx.stroke();

          // Thorax
          ctx.fillStyle = isSilver ? '#94a3b8' : '#2a150d';
          ctx.beginPath();
          ctx.ellipse(centerX, centerY - 8, 14, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          // Head
          ctx.fillStyle = isSilver ? '#64748b' : '#1a0d08';
          ctx.beginPath();
          ctx.ellipse(centerX, centerY - 18, 8, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Large Mandibles (Stag Horns)
          ctx.strokeStyle = isSilver ? '#94a3b8' : '#1a0d08';
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          const mandibleOpen = g.timeStopActive ? 15 : 5;
          // Left Mandible
          ctx.beginPath();
          ctx.moveTo(centerX - 4, centerY - 20);
          ctx.quadraticCurveTo(centerX - 20 - mandibleOpen, centerY - 35, centerX - 10, centerY - 45);
          ctx.stroke();
          // Right Mandible
          ctx.beginPath();
          ctx.moveTo(centerX + 4, centerY - 20);
          ctx.quadraticCurveTo(centerX + 20 + mandibleOpen, centerY - 35, centerX + 10, centerY - 45);
          ctx.stroke();
          
          // Inner spikes on mandibles
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(centerX - 15, centerY - 30);
          ctx.lineTo(centerX - 10, centerY - 32);
          ctx.moveTo(centerX + 15, centerY - 30);
          ctx.lineTo(centerX + 10, centerY - 32);
          ctx.stroke();
        }

        // Common Eyes (if not beetle)
        if (type !== 'BEETLE' && type !== 'GOLDEN_HERCULES' && type !== 'CICADA') {
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(centerX - 4, centerY - 18, 2, 0, Math.PI * 2);
          ctx.arc(centerX + 4, centerY - 18, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (type === 'BEETLE' || type === 'GOLDEN_HERCULES') {
          // Eyes
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(centerX - 5, centerY - 19, 2, 0, Math.PI * 2);
          ctx.arc(centerX + 5, centerY - 19, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
        ctx.globalAlpha = 1;
      };

      // Draw Player
      if (g.isInvulnerable % 10 < 5) {
        drawPlayer(g.player.x, g.player.y, g.player.type, g.playerTilt);
        
        // Draw Butterfly Clones
        if (g.butterflyActive) {
          drawPlayer(g.player.x - 60, g.player.y + 20, g.player.type, g.playerTilt, 0.5);
          drawPlayer(g.player.x + 60, g.player.y + 20, g.player.type, g.playerTilt, 0.5);
        }
      }
      // Draw Bullets (Stingers/Seeds)
      for (let i = 0; i < g.bullets.length; i++) {
        const b = g.bullets[i];
        
        // Bullet Glow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x + b.width/2, b.y + b.height/2, b.width, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (b.isMissile) {
          // Draw Missile
          ctx.save();
          ctx.translate(b.x + b.width/2, b.y + b.height/2);
          const angle = b.vx !== undefined && b.vy !== undefined ? Math.atan2(b.vy, b.vx) + Math.PI/2 : 0;
          ctx.rotate(angle);
          
          // Body
          ctx.fillStyle = b.color;
          ctx.fillRect(-b.width/2, -b.height/2, b.width, b.height);
          
          // Nose
          ctx.beginPath();
          ctx.moveTo(-b.width/2, -b.height/2);
          ctx.lineTo(0, -b.height/2 - 6);
          ctx.lineTo(b.width/2, -b.height/2);
          ctx.fill();
          
          // Fins
          ctx.fillStyle = '#ef4444'; // Red fins
          ctx.fillRect(-b.width/2 - 2, b.height/2 - 4, 2, 4);
          ctx.fillRect(b.width/2, b.height/2 - 4, 2, 4);
          
          // Engine glow
          const engineGlow = Math.sin(g.frameCount * 0.5) * 2 + 4;
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.ellipse(0, b.height/2, 3, engineGlow, 0, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        } else {
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.ellipse(b.x + b.width/2, b.y + b.height/2, b.width/2, b.height/2, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Bullet highlight
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(b.x + b.width/2 - 1, b.y + b.height/2 - 1, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Boss Bullets
      ctx.fillStyle = '#ef4444';
      for (let i = 0; i < g.bossBullets.length; i++) {
        const b = g.bossBullets[i];
        ctx.beginPath();
        ctx.moveTo(b.x + b.width/2, b.y);
        ctx.lineTo(b.x, b.y + b.height);
        ctx.lineTo(b.x + b.width, b.y + b.height);
        ctx.closePath();
        ctx.fill();
      }

      // Draw Enemy Bullets
      ctx.fillStyle = '#4ade80';
      for (let i = 0; i < g.enemyBullets.length; i++) {
        const b = g.enemyBullets[i];
        ctx.beginPath();
        ctx.arc(b.x + b.width/2, b.y + b.height/2, b.width/2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Items
      for (let i = 0; i < g.items.length; i++) {
        const item = g.items[i];
        ctx.fillStyle = item.type === 'POWER_UP' ? '#4ade80' : '#ef4444';
        ctx.beginPath();
        ctx.arc(item.x + item.width/2, item.y + item.height/2, item.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Icon on item
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.type === 'POWER_UP' ? 'P' : '+', item.x + item.width/2, item.y + item.height/2);
      }

      // Draw Enemies
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i];
        if (e.type === 'FLY') {
          let bodyColor = e.color || '#333';
          let wingColor = 'rgba(200, 200, 255, 0.5)';
          const stage = g.stage;
          if (stage === 2) wingColor = 'rgba(255, 255, 200, 0.5)';
          else if (stage === 3) wingColor = 'rgba(200, 150, 255, 0.5)';
          else if (stage === 4) wingColor = 'rgba(255, 150, 150, 0.5)';
          else if (stage === 5) wingColor = 'rgba(255, 255, 255, 0.7)';
          else if (stage >= 6) wingColor = 'rgba(255, 255, 255, 0.3)';

          ctx.fillStyle = bodyColor;
          ctx.beginPath();
          ctx.arc(e.x + 17, e.y + 17, 12, 0, Math.PI * 2);
          ctx.fill();

          // Stage 4 Spikes
          if (stage === 4) {
            ctx.fillStyle = '#450a0a';
            for (let j = 0; j < 4; j++) {
              const angle = (j * Math.PI) / 2 + Math.PI / 4;
              ctx.beginPath();
              ctx.moveTo(e.x + 17 + Math.cos(angle) * 12, e.y + 17 + Math.sin(angle) * 12);
              ctx.lineTo(e.x + 17 + Math.cos(angle) * 18, e.y + 17 + Math.sin(angle) * 18);
              ctx.lineTo(e.x + 17 + Math.cos(angle + 0.2) * 12, e.y + 17 + Math.sin(angle + 0.2) * 12);
              ctx.fill();
            }
          }

          // Wings
          ctx.fillStyle = wingColor;
          ctx.beginPath();
          const wingFlap = Math.sin(g.frameCount / 3) * 5;
          const wingSize = stage === 5 ? 15 : 10;
          ctx.ellipse(e.x + 5, e.y + 17, wingSize + wingFlap, 5, Math.PI/4, 0, Math.PI * 2);
          ctx.ellipse(e.x + 29, e.y + 17, wingSize + wingFlap, 5, -Math.PI/4, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'MOSQUITO') {
          let bodyColor = e.color || '#555';
          const stage = g.stage;
          ctx.fillStyle = bodyColor;
          ctx.fillRect(e.x + 15, e.y + 5, 5, 25);
          ctx.beginPath();
          ctx.moveTo(e.x + 17, e.y + 30);
          ctx.lineTo(e.x + 17, e.y + 40);
          ctx.strokeStyle = bodyColor;
          ctx.stroke();
          // Wings
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          const flap = Math.sin(g.frameCount / 2) * 3;
          ctx.ellipse(e.x + 10, e.y + 15, 12 + flap, 4, -Math.PI/6, 0, Math.PI * 2);
          ctx.ellipse(e.x + 24, e.y + 15, 12 + flap, 4, Math.PI/6, 0, Math.PI * 2);
          ctx.fill();
          // Stage 6 Glow
          if (stage >= 6) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#a855f7';
            ctx.fillStyle = '#d8b4fe';
            ctx.beginPath();
            ctx.arc(e.x + 17, e.y + 10, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        } else if (e.type === 'SPIDER') {
          let bodyColor = e.color || '#222';
          const stage = g.stage;
          ctx.fillStyle = bodyColor;
          ctx.beginPath();
          const bodyRadius = stage === 3 ? 18 : 15;
          ctx.arc(e.x + 17, e.y + 17, bodyRadius, 0, Math.PI * 2);
          ctx.fill();
          // Legs
          ctx.strokeStyle = bodyColor;
          ctx.lineWidth = 2;
          const legMove = Math.sin(g.frameCount / 10) * 5;
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            ctx.beginPath();
            ctx.moveTo(e.x + 17, e.y + 17);
            ctx.lineTo(e.x + 17 + Math.cos(angle) * (20 + legMove), e.y + 17 + Math.sin(angle) * (20 + legMove));
            ctx.stroke();
          }
          // Stage 4 Fire
          if (stage === 4) {
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(e.x + 17, e.y + 17, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (e.type === 'CHARGER') {
          let bodyColor = e.color || '#991b1b';
          const stage = g.stage;
          ctx.fillStyle = bodyColor;
          ctx.beginPath();
          ctx.ellipse(e.x + e.width/2, e.y + e.height/2, e.width/2, e.height/2, 0, 0, Math.PI * 2);
          ctx.fill();
          // Horns
          ctx.strokeStyle = stage === 4 ? '#000' : '#450a0a';
          ctx.lineWidth = stage === 4 ? 5 : 3;
          ctx.beginPath();
          ctx.moveTo(e.x + e.width/2 - 5, e.y + 5);
          ctx.lineTo(e.x + e.width/2 - 15, e.y - 15);
          ctx.moveTo(e.x + e.width/2 + 5, e.y + 5);
          ctx.lineTo(e.x + e.width/2 + 15, e.y - 15);
          ctx.stroke();
          if (e.chargeState === 'CHARGE') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = bodyColor;
          }
        } else if (e.type === 'SPITTER') {
          let bodyColor = e.color || '#166534';
          let mouthColor = '#4ade80';
          const stage = g.stage;
          if (stage === 2) mouthColor = '#fbbf24';
          else if (stage === 3) mouthColor = '#60a5fa';
          else if (stage === 4) mouthColor = '#f87171';
          else if (stage === 5) mouthColor = '#7dd3fc';
          else if (stage >= 6) mouthColor = '#c084fc';

          ctx.fillStyle = bodyColor;
          ctx.beginPath();
          ctx.ellipse(e.x + e.width/2, e.y + e.height/2, e.width/2, e.height/2, 0, 0, Math.PI * 2);
          ctx.fill();
          // Spitter mouth
          ctx.fillStyle = mouthColor;
          ctx.beginPath();
          ctx.arc(e.x + e.width/2, e.y + e.height - 5, 5, 0, Math.PI * 2);
          ctx.fill();
          // Stage 5 Halo
          if (stage === 5) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(e.x + e.width/2, e.y + e.height/2, 25, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else if (e.type === 'WASP') {
          ctx.fillStyle = e.color || '#fbbf24';
          ctx.beginPath();
          ctx.ellipse(e.x + e.width/2, e.y + e.height/2, 8, 15, 0, 0, Math.PI * 2);
          ctx.fill();
          // Stinger
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(e.x + e.width/2, e.y + e.height - 5);
          ctx.lineTo(e.x + e.width/2, e.y + e.height + 5);
          ctx.stroke();
          // Wings
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          const flap = Math.sin(g.frameCount / 2) * 5;
          ctx.beginPath();
          ctx.ellipse(e.x + e.width/2 - 10, e.y + e.height/2, 10 + flap, 4, -Math.PI/4, 0, Math.PI * 2);
          ctx.ellipse(e.x + e.width/2 + 10, e.y + e.height/2, 10 + flap, 4, Math.PI/4, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'MOTH') {
          ctx.fillStyle = e.color || '#a8a29e';
          // Large fuzzy wings
          ctx.beginPath();
          const flap = Math.sin(g.frameCount / 5) * 8;
          ctx.ellipse(e.x + e.width/2 - 12, e.y + e.height/2, 15 + flap, 20, Math.PI/6, 0, Math.PI * 2);
          ctx.ellipse(e.x + e.width/2 + 12, e.y + e.height/2, 15 + flap, 20, -Math.PI/6, 0, Math.PI * 2);
          ctx.fill();
          // Body
          ctx.fillStyle = '#444';
          ctx.beginPath();
          ctx.ellipse(e.x + e.width/2, e.y + e.height/2, 6, 12, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'BEETLE_DRONE') {
          ctx.fillStyle = e.color || '#444';
          ctx.beginPath();
          ctx.roundRect(e.x + 5, e.y + 5, e.width - 10, e.height - 10, 8);
          ctx.fill();
          // Armor plates
          ctx.strokeStyle = '#222';
          ctx.lineWidth = 2;
          ctx.strokeRect(e.x + 10, e.y + 10, e.width - 20, e.height - 20);
          // Glowing eyes
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(e.x + e.width/2 - 8, e.y + 15, 3, 0, Math.PI * 2);
          ctx.arc(e.x + e.width/2 + 8, e.y + 15, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'FIREFLY') {
          const isBright = e.behaviorState === 'BRIGHT';
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.ellipse(e.x + e.width/2, e.y + e.height/2, 8, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          // Glowing tail
          if (isBright) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#bef264';
            ctx.fillStyle = '#bef264';
          } else {
            ctx.fillStyle = '#4d7c0f';
          }
          ctx.beginPath();
          ctx.arc(e.x + e.width/2, e.y + e.height - 8, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (e.type === 'DRAGONFLY') {
          ctx.fillStyle = e.color || '#06b6d4';
          // Long body
          ctx.beginPath();
          ctx.ellipse(e.x + e.width/2, e.y + e.height/2, e.width/2, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          // Large eyes
          ctx.fillStyle = '#164e63';
          ctx.beginPath();
          ctx.arc(e.x + e.width/2 + (e.targetX && e.targetX > 0 ? 15 : -15), e.y + e.height/2, 6, 0, Math.PI * 2);
          ctx.fill();
          // Double wings
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          const flap = Math.sin(g.frameCount / 2) * 10;
          ctx.beginPath();
          ctx.ellipse(e.x + e.width/2, e.y + e.height/2 - 5, 5, 20 + flap, 0, 0, Math.PI * 2);
          ctx.ellipse(e.x + e.width/2 + 5, e.y + e.height/2 - 5, 5, 15 + flap, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'SWARM_BOT') {
          ctx.fillStyle = e.color || '#6366f1';
          ctx.beginPath();
          ctx.arc(e.x + e.width/2, e.y + e.height/2, e.width/2, 0, Math.PI * 2);
          ctx.fill();
          // Core
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(e.x + e.width/2, e.y + e.height/2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Hit Flash
        if (e.hitFlash && e.hitFlash > 0) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.fillRect(e.x, e.y, e.width, e.height);
          ctx.globalCompositeOperation = 'source-over';
          e.hitFlash--;
        }

        if (e.type === 'BOSS') {
          const stage = g.stage;
          if (stage === 1) {
            // Mosquito King
            ctx.fillStyle = e.color || '#333';
            ctx.beginPath();
            ctx.ellipse(e.x + 50, e.y + 40, 15, 30, 0, 0, Math.PI * 2);
            ctx.fill();
            // Proboscis
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(e.x + 50, e.y + 70);
            ctx.lineTo(e.x + 50, e.y + 100);
            ctx.stroke();
            // Eyes
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(e.x + 42, e.y + 35, 4, 0, Math.PI * 2);
            ctx.arc(e.x + 58, e.y + 35, 4, 0, Math.PI * 2);
            ctx.fill();
            // Wings
            ctx.fillStyle = 'rgba(200, 200, 255, 0.4)';
            const wingW = Math.sin(g.frameCount / 5) * 40;
            ctx.beginPath();
            ctx.ellipse(e.x + 20, e.y + 40, 30, 10 + wingW/4, Math.PI/4, 0, Math.PI * 2);
            ctx.ellipse(e.x + 80, e.y + 40, 30, 10 + wingW/4, -Math.PI/4, 0, Math.PI * 2);
            ctx.fill();
          } else if (stage === 2) {
            // Giant Moth
            ctx.fillStyle = e.color || '#8b7355'; // Fuzzy brown
            ctx.beginPath();
            ctx.ellipse(e.x + 50, e.y + 50, 20, 40, 0, 0, Math.PI * 2);
            ctx.fill();
            // Large Patterned Wings
            ctx.fillStyle = '#d2b48c';
            ctx.beginPath();
            ctx.ellipse(e.x + 10, e.y + 40, 50, 30, Math.PI/6, 0, Math.PI * 2);
            ctx.ellipse(e.x + 90, e.y + 40, 50, 30, -Math.PI/6, 0, Math.PI * 2);
            ctx.fill();
            // Wing Patterns
            ctx.fillStyle = '#3d1f14';
            ctx.beginPath();
            ctx.arc(e.x + 20, e.y + 40, 8, 0, Math.PI * 2);
            ctx.arc(e.x + 80, e.y + 40, 8, 0, Math.PI * 2);
            ctx.fill();
            // Antennae
            ctx.strokeStyle = '#3d1f14';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(e.x + 45, e.y + 20);
            ctx.lineTo(e.x + 30, e.y);
            ctx.moveTo(e.x + 55, e.y + 20);
            ctx.lineTo(e.x + 70, e.y);
            ctx.stroke();
          } else if (stage === 3) {
            // Spider Queen
            ctx.fillStyle = e.color || '#1a1a1a';
            ctx.beginPath();
            ctx.arc(e.x + 50, e.y + 60, 35, 0, Math.PI * 2); // Abdomen
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(e.x + 50, e.y + 30, 20, 0, Math.PI * 2); // Cephalothorax
            ctx.fill();
            // Red Hourglass
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(e.x + 45, e.y + 50);
            ctx.lineTo(e.x + 55, e.y + 50);
            ctx.lineTo(e.x + 50, e.y + 60);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(e.x + 45, e.y + 70);
            ctx.lineTo(e.x + 55, e.y + 70);
            ctx.lineTo(e.x + 50, e.y + 60);
            ctx.closePath();
            ctx.fill();
            // Legs
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 4;
            for(let i=0; i<8; i++) {
              const angle = (i * Math.PI) / 4;
              const legFlex = Math.sin(g.frameCount / 20 + i) * 10;
              ctx.beginPath();
              ctx.moveTo(e.x + 50, e.y + 45);
              ctx.lineTo(e.x + 50 + Math.cos(angle) * (60 + legFlex), e.y + 45 + Math.sin(angle) * (60 + legFlex));
              ctx.stroke();
            }
          } else if (stage === 4) {
            // Stag Beetle (Rival)
            ctx.fillStyle = e.color || '#2a150d';
            ctx.beginPath();
            ctx.ellipse(e.x + 50, e.y + 60, 25, 35, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(e.x + 50, e.y + 30, 22, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            // Massive Pincers
            ctx.strokeStyle = '#1a0d08';
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            const pincerOpen = Math.sin(g.frameCount / 15) * 15;
            ctx.beginPath();
            ctx.moveTo(e.x + 40, e.y + 25);
            ctx.quadraticCurveTo(e.x + 10 - pincerOpen, e.y, e.x + 25, e.y - 40);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(e.x + 60, e.y + 25);
            ctx.quadraticCurveTo(e.x + 90 + pincerOpen, e.y, e.x + 75, e.y - 40);
            ctx.stroke();
          } else if (stage === 5) {
            // Final Boss: Giant Hornet
            ctx.fillStyle = e.color || '#facc15';
            // Segmented Abdomen
            for(let i=0; i<4; i++) {
              ctx.beginPath();
              ctx.ellipse(e.x + 50, e.y + 40 + i*20, 25 - i*3, 12, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#000';
              ctx.fillRect(e.x + 30, e.y + 38 + i*20, 40, 4);
              ctx.fillStyle = e.color || '#facc15';
            }
            // Stinger
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.moveTo(e.x + 48, e.y + 105);
            ctx.lineTo(e.x + 52, e.y + 105);
            ctx.lineTo(e.x + 50, e.y + 125);
            ctx.fill();
            // Thorax & Head
            ctx.fillStyle = '#854d0e';
            ctx.beginPath();
            ctx.ellipse(e.x + 50, e.y + 20, 20, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(e.x + 50, e.y + 5, 10, 0, Math.PI * 2);
            ctx.fill();
            // Large Wings
            ctx.fillStyle = 'rgba(255, 255, 150, 0.4)';
            const wingFlap = Math.sin(g.frameCount / 3) * 50;
            ctx.beginPath();
            ctx.ellipse(e.x + 20, e.y + 20, 60, Math.abs(20 + wingFlap/2), Math.PI/8, 0, Math.PI * 2);
            ctx.ellipse(e.x + 80, e.y + 20, 60, Math.abs(20 + wingFlap/2), -Math.PI/8, 0, Math.PI * 2);
            ctx.fill();
          } else if (stage === 6) {
            // Stage 6: Giant Mantis
            ctx.fillStyle = e.color || '#166534';
            // Body
            ctx.beginPath();
            ctx.ellipse(e.x + 50, e.y + 60, 10, 40, 0, 0, Math.PI * 2);
            ctx.fill();
            // Thorax
            ctx.beginPath();
            ctx.ellipse(e.x + 50, e.y + 30, 8, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            // Head
            ctx.beginPath();
            ctx.moveTo(e.x + 50, e.y + 10);
            ctx.lineTo(e.x + 35, e.y - 5);
            ctx.lineTo(e.x + 65, e.y - 5);
            ctx.closePath();
            ctx.fill();
            // Scythes
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 8;
            const scytheSwing = Math.sin(g.frameCount / 10) * 20;
            ctx.beginPath();
            ctx.moveTo(e.x + 45, e.y + 25);
            ctx.lineTo(e.x + 20, e.y + 10 + scytheSwing);
            ctx.lineTo(e.x + 30, e.y + 40 + scytheSwing);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(e.x + 55, e.y + 25);
            ctx.lineTo(e.x + 80, e.y + 10 - scytheSwing);
            ctx.lineTo(e.x + 70, e.y + 40 - scytheSwing);
            ctx.stroke();
          } else if (stage >= 7) {
            // Hidden Boss: Giant Insecticide Spray
            const canWidth = e.width * 0.6;
            const canHeight = e.height * 0.8;
            const centerX = e.x + e.width / 2;
            const centerY = e.y + e.height / 2 + 10;
            const canX = centerX - canWidth / 2;
            const canY = centerY - canHeight / 2;

            // Can Body
            const bodyGrad = ctx.createLinearGradient(canX, canY, canX + canWidth, canY);
            bodyGrad.addColorStop(0, '#94a3b8');
            bodyGrad.addColorStop(0.5, '#f1f5f9');
            bodyGrad.addColorStop(1, '#94a3b8');
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.roundRect(canX, canY, canWidth, canHeight, 5);
            ctx.fill();

            // Cap
            ctx.fillStyle = '#ef4444'; // Red cap
            ctx.beginPath();
            ctx.roundRect(canX + 2, canY - 15, canWidth - 4, 15, [5, 5, 0, 0]);
            ctx.fill();
            
            // Nozzle
            ctx.fillStyle = '#333';
            ctx.fillRect(centerX - 6, canY - 25, 12, 10);

            // Label
            ctx.fillStyle = '#fff';
            ctx.fillRect(canX + 5, canY + canHeight * 0.25, canWidth - 10, canHeight * 0.4);
            
            // Skull Icon (Simple)
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(centerX, canY + canHeight * 0.4, 12, 0, Math.PI * 2);
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(centerX - 4, canY + canHeight * 0.4 - 2, 3, 0, Math.PI * 2);
            ctx.arc(centerX + 4, canY + canHeight * 0.4 - 2, 3, 0, Math.PI * 2);
            ctx.fill();
            // Crossbones
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(centerX - 15, canY + canHeight * 0.4 - 15);
            ctx.lineTo(centerX + 15, canY + canHeight * 0.4 + 15);
            ctx.moveTo(centerX + 15, canY + canHeight * 0.4 - 15);
            ctx.lineTo(centerX - 15, canY + canHeight * 0.4 + 15);
            ctx.stroke();

            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('BUG', centerX, canY + canHeight * 0.65);
            ctx.fillText('KILLER', centerX, canY + canHeight * 0.75);

            // Spray Effect (When attacking)
            if (g.frameCount % 40 < 30) {
              ctx.save();
              ctx.globalAlpha = 0.6 * (1 - (g.frameCount % 40) / 30);
              ctx.fillStyle = '#fff';
              for (let i = 0; i < 15; i++) {
                const angle = (Math.random() - 0.5) * 1.2 - Math.PI / 2;
                const dist = Math.random() * 120;
                const sprayX = centerX + Math.cos(angle) * dist;
                const sprayY = (canY - 25) + Math.sin(angle) * dist;
                ctx.beginPath();
                ctx.arc(sprayX, sprayY, 6 + Math.random() * 12, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            }
          }
          
          // Boss Health Bar
          const healthWidth = (e.health / e.maxHealth) * 200;
          ctx.fillStyle = '#333';
          ctx.fillRect(CANVAS_WIDTH/2 - 100, 60, 200, 10);
          ctx.fillStyle = e.type === 'BOSS' ? '#ef4444' : '#4ade80';
          ctx.fillRect(CANVAS_WIDTH/2 - 100, 60, healthWidth, 10);
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 1;
          ctx.strokeRect(CANVAS_WIDTH/2 - 100, 60, 200, 10);
          
          const bossNames = ['MOSQUITO KING', 'GIANT MOTH', 'SPIDER QUEEN', 'STAG BEETLE', 'GIANT HORNET', 'GIANT MANTIS', 'THE EXTERMINATOR'];
          ctx.fillStyle = 'white';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(bossNames[g.stage - 1] || 'UNKNOWN BOSS', CANVAS_WIDTH/2, 55);
        }
      }

      // Draw X-Slash
      if (g.isXSlashActive) {
        const slashX = g.player.x + g.player.width / 2;
        const slashY = g.player.y - (60 - g.xSlashTimer) * 12;
        const slashSize = 180;
        const opacity = g.xSlashTimer / 60;
        
        ctx.save();
        ctx.translate(slashX, slashY);
        ctx.rotate(g.frameCount * 0.2);
        ctx.strokeStyle = `rgba(74, 222, 128, ${opacity})`;
        ctx.lineWidth = 15;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#4ade80';
        
        ctx.beginPath();
        ctx.moveTo(-slashSize/2, -slashSize/2);
        ctx.lineTo(slashSize/2, slashSize/2);
        ctx.moveTo(slashSize/2, -slashSize/2);
        ctx.lineTo(-slashSize/2, slashSize/2);
        ctx.stroke();
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-slashSize/2, -slashSize/2);
        ctx.lineTo(slashSize/2, slashSize/2);
        ctx.moveTo(slashSize/2, -slashSize/2);
        ctx.lineTo(-slashSize/2, slashSize/2);
        ctx.stroke();
        ctx.restore();
      }

      // Mission Complete Overlay
      if (g.isMissionCompleteActive) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.save();
        ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        const scale = 1 + Math.sin(g.frameCount / 10) * 0.1;
        ctx.scale(scale, scale);
        
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText('MISSION COMPLETE', 4, 4);
        ctx.fillStyle = '#4ade80';
        ctx.fillText('MISSION COMPLETE', 0, 0);
        
        if (g.stage >= 6) {
          ctx.font = 'bold 24px sans-serif';
          ctx.fillStyle = '#fbbf24';
          ctx.fillText('CONGRATULATIONS!', 0, 60);
          ctx.fillText(g.stage === 7 ? 'HIDDEN STAGE CLEARED!' : 'ALL STAGES CLEARED', 0, 90);
        }
        
        if (g.frameCount % 3 === 0) {
          for (let i = 0; i < (g.stage >= 6 ? 10 : 5); i++) {
            g.particles.push({
              x: Math.random() * CANVAS_WIDTH,
              y: Math.random() * CANVAS_HEIGHT,
              width: 5,
              height: 5,
              vx: (Math.random() - 0.5) * 15,
              vy: (Math.random() - 0.5) * 15,
              life: 1,
              color: `hsl(${Math.random() * 360}, 80%, 60%)`
            });
          }
        }
        ctx.restore();
      }

      // Draw Boss Warning
      if (g.bossWarning > 0 && g.frameCount % 40 < 20) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(0, CANVAS_HEIGHT/2 - 50, CANVAS_WIDTH, 100);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS WARNING', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 15);
      }

      // Time Stop Screen Effect
      if (g.timeStopActive) {
        ctx.fillStyle = 'rgba(96, 165, 250, 0.2)'; // Light blue overlay
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Vignette effect
        const grad = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, 'rgba(30, 58, 138, 0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Clock icon pulse in center
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(g.frameCount / 10) * 0.2;
        ctx.translate(CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        ctx.scale(2, 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -15);
        ctx.moveTo(0, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    };

    const handlePlayerHit = () => {
      const g = gameRef.current;
      if (g.isInvulnerable > 0 || g.isShieldActive || g.lastStandActive || g.isBigBeamActive) return;
      
      setLives(prev => {
        // Grasshopper Last Stand
        if (g.player.type === 'GRASSHOPPER' && prev === 2 && g.grasshopperCharges > 0 && g.lastStandCooldown <= 0) {
          g.grasshopperCharges--;
          setGrasshopperCharges(g.grasshopperCharges);
          g.lastStandActive = true;
          g.lastStandTimer = 180; // 3 seconds
          g.lastStandCooldown = 30; // 0.5s delay
          setIsLastStandActive(true);
          sounds.playPowerUp();
          g.screenShake = 10;
          return 1; // Set to 1 and activate
        }

        // Silver Stag Beetle Revival removed

        if (prev <= 1) {
          gameOver();
          return 0;
        }
        sounds.playHit();
        g.screenShake = 20;
        g.isInvulnerable = 120;
        createExplosion(g.player.x + g.player.width/2, g.player.y + g.player.height/2, '#ff4444');
        g.powerLevel = Math.max(1, g.powerLevel - 1);
        if (g.player.type === 'CICADA') {
          g.player.speed = g.powerLevel === 3 ? 7 : 4;
        }
        setPowerLevel(g.powerLevel);
        return prev - 1;
      });
    };

    const createExplosion = (x: number, y: number, color: string) => {
      const g = gameRef.current;
      const count = g.particles.length > 150 ? 8 : 20; 
      const colors = [color, '#ffffff', '#ffeb3b', '#ff5722', '#f44336'];
      
      // Add a shockwave
      g.particles.push({
        x, y,
        width: 0, height: 0,
        vx: 0, vy: 0,
        life: 1,
        color: '#ffffff',
        type: 'SHOCKWAVE'
      });

      for (let i = 0; i < count; i++) {
        const pColor = colors[Math.floor(Math.random() * colors.length)];
        g.particles.push({
          x, y,
          width: Math.random() * 4 + 2, 
          height: Math.random() * 4 + 2,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 1,
          color: pColor,
          type: 'DOT'
        });
      }
    };

    const checkCollision = (a: Entity, b: Entity) => {
      return a.x < b.x + b.width &&
             a.x + a.width > b.x &&
             a.y < b.y + b.height &&
             a.y + a.height > b.y;
    };

    const spawnEnemy = () => {
      const g = gameRef.current;
      const stage = g.stage;
      const type = Math.random() < 0.2 ? 'MOSQUITO' : 
                   Math.random() < 0.1 ? 'SPIDER' : 
                   Math.random() < 0.1 ? 'CHARGER' :
                   Math.random() < 0.05 ? 'SPITTER' : 'FLY';
      
      let health = 1 + Math.floor(stage / 2);
      if (type === 'MOSQUITO') health = 2 + Math.floor(stage / 2);
      if (type === 'SPIDER') health = 4 + Math.floor(stage / 2);
      if (type === 'CHARGER') health = 3 + Math.floor(stage / 2);
      if (type === 'SPITTER') health = 2 + Math.floor(stage / 2);

      const x = Math.random() * (CANVAS_WIDTH - ENEMY_SIZE);
      g.enemies.push({
        x, y: -ENEMY_SIZE,
        width: ENEMY_SIZE, height: ENEMY_SIZE,
        speed: (1.5 + Math.random() * 2) * (1 + stage * 0.1),
        type,
        health,
        maxHealth: health,
        color: type === 'FLY' ? '#8bc34a' : type === 'MOSQUITO' ? '#ff5722' : type === 'SPIDER' ? '#9c27b0' : type === 'CHARGER' ? '#f44336' : type === 'SPITTER' ? '#00bcd4' : '#ffffff'
      });
    };

    const spawnItem = (x: number, y: number) => {
      const g = gameRef.current;
      const type = Math.random() < 0.15 ? 'HEAL' : 'POWER_UP';
      g.items.push({
        x, y,
        width: 25, height: 25,
        type,
        speed: 2
      });
    };

    const shoot = () => {
      const g = gameRef.current;
      const p = g.player;
      const power = g.powerLevel;
      sounds.playShoot(p.type);

      if (p.type === 'BEETLE') {
        const count = power === 1 ? 1 : power === 2 ? 2 : 3;
        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * 15;
          g.bullets.push({
            x: p.x + p.width / 2 - BULLET_SIZE / 2 + offset,
            y: p.y,
            width: BULLET_SIZE, height: BULLET_SIZE * 2,
            speed: 12,
            damage: 1,
            color: '#4ade80'
          });
        }
      } else if (p.type === 'HERCULES') {
        const count = 3 + Math.floor(power / 2);
        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * 15;
          g.bullets.push({
            x: p.x + p.width / 2 - BULLET_SIZE / 2 + offset,
            y: p.y,
            width: BULLET_SIZE * 1.5, height: BULLET_SIZE * 3,
            speed: 12,
            damage: 4,
            color: '#94a3b8'
          });
        }
        // Homing Missiles for Hercules at Max Level (Level 3)
        if (power >= 3 && g.frameCount % 40 === 0) {
          const side = (g.frameCount / 40) % 2 === 0 ? -1 : 1;
          g.bullets.push({
            x: p.x + p.width / 2 + side * 25,
            y: p.y + 10,
            width: 8,
            height: 12,
            speed: 10,
            vx: side * 4,
            vy: -2,
            homing: true,
            damage: 3.0,
            color: '#94a3b8'
          });
        }
      } else if (p.type === 'BUTTERFLY') {
        const count = power === 1 ? 2 : power === 2 ? 4 : 6;
        for (let i = 0; i < count; i++) {
          const angle = (i - (count - 1) / 2) * 0.15;
          g.bullets.push({
            x: p.x + p.width / 2 - BULLET_SIZE / 2,
            y: p.y,
            width: BULLET_SIZE, height: BULLET_SIZE,
            speed: 10,
            vx: Math.sin(angle) * 10,
            vy: -Math.cos(angle) * 10,
            damage: 0.7,
            color: '#f472b6'
          });
        }
      } else if (p.type === 'LADYBUG') {
        const count = power === 1 ? 1 : power === 2 ? 2 : 3;
        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * 20;
          g.bullets.push({
            x: p.x + p.width / 2 - BULLET_SIZE + offset,
            y: p.y,
            width: BULLET_SIZE * 2, height: BULLET_SIZE * 2,
            speed: 8,
            damage: 2,
            color: '#f87171'
          });
        }
      } else if (p.type === 'GOLDEN_HERCULES') {
        const count = power === 1 ? 3 : power === 2 ? 5 : 7;
        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * 10;
          g.bullets.push({
            x: p.x + p.width / 2 - BULLET_SIZE / 2 + offset,
            y: p.y,
            width: BULLET_SIZE, height: BULLET_SIZE * 3,
            speed: 15,
            damage: 1.5,
            color: '#fbbf24'
          });
        }
      } else if (p.type === 'CICADA') {
        const count = power === 1 ? 2 : power === 2 ? 3 : 4;
        for (let i = 0; i < count; i++) {
          const angle = (i - (count - 1) / 2) * 0.3;
          g.bullets.push({
            x: p.x + p.width / 2 - BULLET_SIZE / 2,
            y: p.y,
            width: BULLET_SIZE, height: BULLET_SIZE,
            speed: 9,
            vx: Math.sin(angle) * 9,
            vy: -Math.cos(angle) * 9,
            curve: (i % 2 === 0 ? 1 : -1) * 0.05,
            damage: 1.2,
            color: '#60a5fa'
          });
        }
      } else if (p.type === 'MANTIS') {
        const count = power === 1 ? 1 : power === 2 ? 2 : 2;
        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * 30;
          g.bullets.push({
            x: p.x + p.width / 2 - BULLET_SIZE / 2 + offset,
            y: p.y,
            width: BULLET_SIZE, height: BULLET_SIZE * 4,
            speed: 14,
            damage: 3,
            color: '#a3e635'
          });
        }
      } else if (p.type === 'SILVER_STAG_BEETLE') {
        const count = power === 1 ? 2 : power === 2 ? 4 : 8;
        const homing = power >= 3;
        
        // Main ship bullets
        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * 12;
          g.bullets.push({
            x: p.x + p.width / 2 - BULLET_SIZE / 2 + offset,
            y: p.y,
            width: BULLET_SIZE, height: BULLET_SIZE * 2,
            speed: 11,
            damage: 1.5,
            homing: homing,
            color: '#cbd5e1'
          });
        }

        // Clones at max level
        if (power >= 3) {
          const cloneOffsets = [-40, 40];
          cloneOffsets.forEach(ox => {
            for (let j = 0; j < 2; j++) {
              const innerOffset = (j - 0.5) * 10;
              g.bullets.push({
                x: p.x + p.width / 2 - BULLET_SIZE / 2 + ox + innerOffset,
                y: p.y + 20,
                width: BULLET_SIZE, height: BULLET_SIZE * 2,
                speed: 11,
                damage: 0.8,
                homing: true,
                color: '#cbd5e1'
              });
            }
          });

          // Homing Missiles at max level
          if (g.frameCount % 30 === 0) {
            for (let i = 0; i < 4; i++) {
              const side = i < 2 ? -1 : 1;
              const innerOffset = (i % 2) * 20;
              g.bullets.push({
                x: p.x + p.width / 2 + side * (60 + innerOffset),
                y: p.y + 30,
                width: 10, height: 16,
                speed: 5,
                vx: side * (1 + (i % 2)),
                vy: 0,
                damage: 3.0,
                homing: true,
                homingStrength: 0.2,
                color: '#94a3b8',
                isMissile: true
              });
            }
            sounds.playShoot('SILVER_STAG_BEETLE');
          }
        }
      } else if (p.type === 'DRAGONFLY') {
        const count = power === 1 ? 1 : power === 2 ? 2 : 3;
        const homingStrength = g.dragonflyActive ? 0.15 : 0.05;
        
        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * 12;
          g.bullets.push({
            x: p.x + p.width / 2 - BULLET_SIZE / 2 + offset,
            y: p.y,
            width: BULLET_SIZE * 0.8, height: BULLET_SIZE * 1.5,
            speed: 13,
            damage: 0.6,
            homing: true,
            homingStrength: homingStrength,
            color: '#ef4444'
          });
        }
      }
    };

    const bossShoot = (boss: Enemy) => {
      const g = gameRef.current;
      const stage = g.stage;
      
      if (stage === 1) {
        // Circular pattern
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          g.bossBullets.push({
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height / 2,
            width: 12, height: 12,
            speed: 4,
            vx: Math.cos(angle) * 4,
            vy: Math.sin(angle) * 4,
            damage: 1,
            color: '#ff00ff'
          });
        }
      } else if (stage === 2) {
        // Targeted spread
        const dx = g.player.x - (boss.x + boss.width / 2);
        const dy = g.player.y - (boss.y + boss.height / 2);
        const angle = Math.atan2(dy, dx);
        for (let i = -2; i <= 2; i++) {
          const a = angle + i * 0.2;
          g.bossBullets.push({
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height / 2,
            width: 12, height: 12,
            speed: 5,
            vx: Math.cos(a) * 5,
            vy: Math.sin(a) * 5,
            damage: 1,
            color: '#00ffff'
          });
        }
      } else if (stage === 7) {
        // Hidden Boss: Rapid fire + Spiral
        const time = g.frameCount * 0.15;
        for (let i = 0; i < 5; i++) {
          const angle = time + (i / 5) * Math.PI * 2;
          g.bossBullets.push({
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height / 2,
            width: 15, height: 15,
            speed: 6,
            vx: Math.cos(angle) * 6,
            vy: Math.sin(angle) * 6,
            damage: 1.5,
            color: '#ff4444'
          });
        }
        if (g.frameCount % 60 === 0) {
          // Targeted burst
          const dx = g.player.x - (boss.x + boss.width / 2);
          const dy = g.player.y - (boss.y + boss.height / 2);
          const angle = Math.atan2(dy, dx);
          for (let i = -3; i <= 3; i++) {
            const a = angle + i * 0.1;
            g.bossBullets.push({
              x: boss.x + boss.width / 2,
              y: boss.y + boss.height / 2,
              width: 12, height: 12,
              speed: 8,
              vx: Math.cos(a) * 8,
              vy: Math.sin(a) * 8,
              damage: 1,
              color: '#ffffff'
            });
          }
        }
      } else {
        const time = g.frameCount * 0.1;
        for (let i = 0; i < 3; i++) {
          const angle = time + (i / 3) * Math.PI * 2;
          g.bossBullets.push({
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height / 2,
            width: 12, height: 12,
            speed: 4,
            vx: Math.cos(angle) * 4,
            vy: Math.sin(angle) * 4,
            damage: 1,
            color: '#ffff00'
          });
        }
      }
    };


    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  return (
    <div className="fixed inset-0 bg-[#0a150a] text-white font-sans flex flex-col items-center justify-center overflow-hidden touch-none">
      {/* Game Area */}
      <div className="relative flex-1 w-full max-w-[500px] flex flex-col items-center justify-center overflow-hidden">
        {/* Game Screen Frame */}
        <div className="relative w-full aspect-[9/16] max-h-full border-x-2 border-[#2d4a2d] shadow-2xl overflow-hidden bg-[#1a2e1a] flex flex-col">
          <div className="relative flex-1 w-full overflow-hidden">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-full object-contain"
            />
          </div>

          {/* HUD */}
        {gameState === 'PLAYING' && (
          <>
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none">
              <div className="flex flex-col gap-1">
                <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  {score.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/70 font-bold tracking-widest uppercase">Stage {stage}</div>
                    {/* Progress Bar */}
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#4ade80] transition-all duration-300"
                          style={{ width: `${Math.min(100, (gameRef.current.enemiesKilledInStage / (30 + stage * 20)) * 100)}%` }}
                        />
                      </div>
                      <Zap className={`w-2 h-2 ${gameRef.current.enemiesKilledInStage >= (30 + stage * 20) ? 'text-red-500 fill-red-500 animate-pulse' : 'text-white/20'}`} />
                    </div>
                  </div>
                  <div className="text-xs opacity-50 uppercase tracking-widest">High: {highScore.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-0.5 sm:gap-1">
                  {Array.from({ length: Math.max(lives, selectedCharacter === 'SILVER_STAG_BEETLE' ? 4 : 3) }).map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-4 h-4 sm:w-6 sm:h-6 transition-colors duration-300 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-800/50'}`}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: selectedCharacter === 'GOLDEN_HERCULES' ? 4 : 3 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-1 sm:w-4 sm:h-1 rounded-full ${i < powerLevel ? 'bg-[#4ade80]' : 'bg-gray-700'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bomb Button */}
            {selectedCharacter === 'GOLDEN_HERCULES' && (
              <div className="absolute bottom-10 left-10 z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    useBomb();
                  }}
                  disabled={bombs <= 0}
                  className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 transition-all active:scale-90 ${
                    bombs > 0 
                      ? "bg-yellow-500/40 border-yellow-400 text-white shadow-[0_0_15px_rgba(234,179,8,0.5)]" 
                      : "bg-gray-500/20 border-gray-400 text-gray-400 opacity-50"
                  }`}
                >
                  <Zap size={32} fill={bombs > 0 ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold mt-1 tracking-tighter">BOMB: {bombs}</span>
                </button>
              </div>
            )}

            {/* Shield Button */}
            {selectedCharacter === 'BEETLE' && (
              <div className="absolute bottom-10 left-10 z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    useShield();
                  }}
                  disabled={shields <= 0 || isShieldActive}
                  className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 transition-all active:scale-90 ${
                    isShieldActive 
                      ? "bg-sky-400 border-sky-200 text-white animate-pulse shadow-[0_0_20px_rgba(56,189,248,0.8)]"
                      : shields > 0 
                        ? "bg-sky-600/40 border-sky-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.5)]" 
                        : "bg-gray-500/20 border-gray-400 text-gray-400 opacity-50"
                  }`}
                >
                  <Shield size={32} fill={shields > 0 || isShieldActive ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold mt-1 tracking-tighter">
                    {isShieldActive ? "ACTIVE" : `SHIELD: ${shields}`}
                  </span>
                </button>
              </div>
            )}

            {/* Butterfly Skill Button */}
            {selectedCharacter === 'BUTTERFLY' && (
              <div className="absolute bottom-10 left-10 z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    useButterflySkill();
                  }}
                  disabled={butterflyCharges <= 0 || isButterflyActive}
                  className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 transition-all active:scale-90 ${
                    isButterflyActive 
                      ? "bg-purple-400 border-purple-200 text-white animate-pulse shadow-[0_0_20px_rgba(192,132,252,0.8)]"
                      : butterflyCharges > 0 
                        ? "bg-purple-600/40 border-purple-400 text-white shadow-[0_0_15px_rgba(192,132,252,0.5)]" 
                        : "bg-gray-500/20 border-gray-400 text-gray-400 opacity-50"
                  }`}
                >
                  <MessageCircle size={32} fill={butterflyCharges > 0 || isButterflyActive ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold mt-1 tracking-tighter">
                    {isButterflyActive ? "CLONE" : `SKILL: ${butterflyCharges}`}
                  </span>
                </button>
              </div>
            )}

            {/* Ladybug Skill Button */}
            {selectedCharacter === 'LADYBUG' && (
              <div className="absolute bottom-10 left-10 z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    useLadybugSkill();
                  }}
                  disabled={ladybugCharges <= 0 || isLadybugActive}
                  className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 transition-all active:scale-90 ${
                    isLadybugActive 
                      ? "bg-red-400 border-red-200 text-white animate-pulse shadow-[0_0_20px_rgba(248,113,113,0.8)]"
                      : ladybugCharges > 0 
                        ? "bg-red-600/40 border-red-400 text-white shadow-[0_0_15px_rgba(248,113,113,0.5)]" 
                        : "bg-gray-500/20 border-gray-400 text-gray-400 opacity-50"
                  }`}
                >
                  <Zap size={32} fill={ladybugCharges > 0 || isLadybugActive ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold mt-1 tracking-tighter">
                    {isLadybugActive ? "BEAM" : `SKILL: ${ladybugCharges}`}
                  </span>
                </button>
              </div>
            )}

            {/* Cicada Skill Button */}
            {selectedCharacter === 'CICADA' && (
              <div className="absolute bottom-10 left-10 z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    useCicadaSkill();
                  }}
                  disabled={cicadaCharges <= 0 || isCicadaActive}
                  className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 transition-all active:scale-90 ${
                    isCicadaActive 
                      ? "bg-amber-400 border-amber-200 text-white animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.8)]"
                      : cicadaCharges > 0 
                        ? "bg-amber-600/40 border-amber-400 text-white shadow-[0_0_15px_rgba(251,191,36,0.5)]" 
                        : "bg-gray-500/20 border-gray-400 text-gray-400 opacity-50"
                  }`}
                >
                  <Volume2 size={32} fill={cicadaCharges > 0 || isCicadaActive ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold mt-1 tracking-tighter">
                    {isCicadaActive ? "鳴く" : `SKILL: ${cicadaCharges}`}
                  </span>
                </button>
              </div>
            )}

            {/* Mantis Skill Button */}
            {selectedCharacter === 'MANTIS' && (
              <div className="absolute bottom-10 left-10 z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    useMantisSkill();
                  }}
                  disabled={mantisCharges <= 0 || isXSlashActive}
                  className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 transition-all active:scale-90 ${
                    isXSlashActive 
                      ? "bg-green-400 border-green-200 text-white animate-pulse shadow-[0_0_20px_rgba(74,222,128,0.8)]"
                      : mantisCharges > 0 
                        ? "bg-green-600/40 border-green-400 text-white shadow-[0_0_15px_rgba(74,222,128,0.5)]" 
                        : "bg-gray-500/20 border-gray-400 text-gray-400 opacity-50"
                  }`}
                >
                  <Sword size={32} fill={mantisCharges > 0 || isXSlashActive ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold mt-1 tracking-tighter">
                    {isXSlashActive ? "Xスラッシュ" : `Xスラッシュ: ${mantisCharges}`}
                  </span>
                </button>
              </div>
            )}

            {/* Grasshopper Skill HUD (Automatic) */}
            {selectedCharacter === 'GRASSHOPPER' && (
              <div className="absolute bottom-10 left-10 z-50">
                <div
                  className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 transition-all ${
                    isLastStandActive 
                      ? "bg-yellow-400 border-yellow-200 text-white animate-pulse shadow-[0_0_20px_rgba(250,204,21,0.8)]"
                      : grasshopperCharges > 0 
                        ? "bg-green-600/40 border-green-400 text-white shadow-[0_0_15px_rgba(74,222,128,0.5)]" 
                        : "bg-gray-500/20 border-gray-400 text-gray-400 opacity-50"
                  }`}
                >
                  <Zap size={32} fill={grasshopperCharges > 0 || isLastStandActive ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold mt-1 tracking-tighter">
                    {isLastStandActive ? "ACTIVE" : `AUTO: ${grasshopperCharges}`}
                  </span>
                </div>
              </div>
            )}

            {/* Stag Beetle Skill Button */}
            {selectedCharacter === 'STAG_BEETLE' && (
              <div className="absolute bottom-10 left-10 z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    useStagBeetleSkill();
                  }}
                  disabled={stagBeetleCharges <= 0 || isTimeStopActive}
                  className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 transition-all active:scale-90 ${
                    isTimeStopActive 
                      ? "bg-blue-400 border-blue-200 text-white animate-pulse shadow-[0_0_20px_rgba(96,165,250,0.8)]"
                      : stagBeetleCharges > 0 
                        ? "bg-blue-600/40 border-blue-400 text-white shadow-[0_0_15px_rgba(96,165,250,0.5)]" 
                        : "bg-gray-500/20 border-gray-400 text-gray-400 opacity-50"
                  }`}
                >
                  <Clock size={32} fill={stagBeetleCharges > 0 || isTimeStopActive ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold mt-1 tracking-tighter">
                    {isTimeStopActive ? "STOP" : `SKILL: ${stagBeetleCharges}`}
                  </span>
                </button>
              </div>
            )}

            {/* Hercules Skill Button */}
            {selectedCharacter === 'HERCULES' && (
              <div className="absolute bottom-10 left-10 z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    useHerculesSkill();
                  }}
                  disabled={herculesCharges <= 0}
                  className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 transition-all active:scale-90 ${
                    herculesCharges > 0 
                      ? "bg-slate-600/40 border-slate-400 text-white shadow-[0_0_15px_rgba(148,163,184,0.5)]" 
                      : "bg-gray-500/20 border-gray-400 text-gray-400 opacity-50"
                  }`}
                >
                  <Zap size={32} fill={herculesCharges > 0 ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold mt-1 tracking-tighter">
                    {`SKILL: ${herculesCharges}`}
                  </span>
                </button>
              </div>
            )}

            {/* Dragonfly Skill Button */}
            {selectedCharacter === 'DRAGONFLY' && (
              <div className="absolute bottom-10 left-10 z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    useDragonflySkill();
                  }}
                  disabled={dragonflyCharges <= 0 || dragonflyActive}
                  className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 transition-all active:scale-90 ${
                    dragonflyActive 
                      ? "bg-cyan-400 border-cyan-200 text-white animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.8)]"
                      : dragonflyCharges > 0 
                        ? "bg-cyan-600/40 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]" 
                        : "bg-gray-500/20 border-gray-400 text-gray-400 opacity-50"
                  }`}
                >
                  <Eye size={32} fill={dragonflyCharges > 0 || dragonflyActive ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold mt-1 tracking-tighter">
                    {dragonflyActive ? "FOCUS" : `SKILL: ${dragonflyCharges}`}
                  </span>
                </button>
              </div>
            )}

            {/* Silver Stag Beetle Skill Button */}
            {selectedCharacter === 'SILVER_STAG_BEETLE' && (
              <div className="absolute bottom-10 left-10 z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    useReflectShield();
                  }}
                  disabled={silverStagCharges <= 0 || bigBeamCooldown > 0}
                  className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 transition-all active:scale-90 ${
                    isBigBeamActive 
                      ? "bg-slate-300 border-slate-100 text-slate-800 animate-pulse shadow-[0_0_20px_rgba(203,213,225,0.8)]"
                      : silverStagCharges > 0 && bigBeamCooldown <= 0
                        ? "bg-slate-600/40 border-slate-400 text-white shadow-[0_0_15px_rgba(203,213,225,0.5)]" 
                        : "bg-gray-500/20 border-gray-400 text-gray-400 opacity-50"
                  }`}
                >
                  <Zap size={32} fill={silverStagCharges > 0 || isBigBeamActive ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold mt-1 tracking-tighter">
                    {isBigBeamActive ? "BEAM" : bigBeamCooldown > 0 ? `WAIT ${Math.ceil(bigBeamCooldown/60)}s` : `SKILL: ${silverStagCharges}`}
                  </span>
                </button>
              </div>
            )}

            {/* Pause/Resume Button */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(!isPaused);
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all active:scale-90 ${
                  isPaused 
                    ? "border-[#4ade80] bg-[#4ade80] text-black shadow-[0_0_20px_rgba(74,222,128,0.6)]" 
                    : "border-[#4ade80]/20 bg-black/20 text-[#4ade80]/40 hover:bg-black/40 hover:text-[#4ade80]"
                }`}
              >
                {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
              </button>
            </div>
          </>
        )}
        </div>

        <>
          {isPaused && gameState === 'PLAYING' && (
            <div
              className="absolute top-20 left-0 right-0 flex justify-center z-[60] pointer-events-none"
            >
              <div className="bg-black/40 backdrop-blur-sm border border-[#4ade80]/30 px-6 py-2 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <h2 className="text-xl font-black italic uppercase text-[#4ade80] tracking-[0.2em]">PAUSED</h2>
              </div>
            </div>
          )}

          {gameState === 'START' && (
            <div
              className="absolute inset-0 bg-black/80 flex flex-col items-center justify-start text-center p-4 overflow-y-auto scrollbar-hide"
            >
              <h1
                className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter mb-1 text-[#4ade80] mt-2"
              >
                Insect Swarm
              </h1>
              <p className="text-[8px] sm:text-[10px] opacity-70 mb-2 max-w-xs">
                Defend the forest floor from the invasive swarm.
              </p>
              {/* Character Selection */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mb-3 w-full max-w-md px-2">
                {(['BEETLE', 'BUTTERFLY', 'LADYBUG', 'GOLDEN_HERCULES', 'CICADA', 'MANTIS', 'GRASSHOPPER', 'STAG_BEETLE', 'HERCULES', 'SILVER_STAG_BEETLE', 'DRAGONFLY'] as PlayerCharacter[]).map((char) => {
                  const isLocked = (char === 'GOLDEN_HERCULES' && !isGoldenHerculesUnlocked) || (char === 'HERCULES' && !isHerculesUnlocked);
                  const charBest = characterHighScores[char] || 0;
                  
                  return (
                    <button
                      key={char}
                      onClick={() => !isLocked && setSelectedCharacter(char)}
                      disabled={isLocked}
                      className={`relative p-1 rounded-xl border-2 transition-all flex flex-col items-center gap-0.5 ${
                        selectedCharacter === char 
                          ? 'border-[#4ade80] bg-[#4ade80]/20 scale-105' 
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      } ${isLocked ? 'opacity-30 grayscale cursor-not-allowed' : ''} ${char === 'GOLDEN_HERCULES' && !isLocked ? 'border-yellow-500 bg-yellow-500/10' : ''}`}
                    >
                      <div className="w-7 h-7 flex items-center justify-center relative">
                        {char === 'BEETLE' && <div className="w-4 h-6 bg-[#3d1f14] rounded-full relative"><div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-[#2a150d]" /></div>}
                        {char === 'BUTTERFLY' && <div className="w-6 h-4 bg-[#c084fc] rounded-full relative"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-4 bg-[#111] rounded-full" /></div>}
                        {char === 'LADYBUG' && <div className="w-6 h-6 bg-[#ef4444] rounded-full relative border-2 border-black"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-black" /></div>}
                        {char === 'GOLDEN_HERCULES' && <div className="w-6 h-8 bg-[#facc15] rounded-full relative shadow-[0_0_10px_#facc15]"><div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-[#fbbf24] rounded-full" /></div>}
                        {char === 'CICADA' && (
                          <div className="w-6 h-8 bg-[#854d0e] rounded-full relative overflow-visible">
                            <div className="absolute -top-1 -left-2 w-4 h-6 bg-white/20 border border-white/30 rounded-full rotate-[30deg]" />
                            <div className="absolute -top-1 -right-2 w-4 h-6 bg-white/20 border border-white/30 rounded-full -rotate-[30deg]" />
                            <div className="absolute top-1 left-0 w-2 h-2 bg-red-500 rounded-full border border-black/20" />
                            <div className="absolute top-1 right-0 w-2 h-2 bg-red-500 rounded-full border border-black/20" />
                          </div>
                        )}
                        {char === 'MANTIS' && <div className="w-3 h-8 bg-[#22c55e] rounded-full relative"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-2 bg-[#22c55e] rounded-t-full" /></div>}
                        {char === 'GRASSHOPPER' && (
                          <div className="w-3 h-8 bg-[#4ade80] rounded-full relative overflow-visible">
                            <div className="absolute -top-3 -left-1 w-2 h-4 border-l border-t border-[#166534] rounded-tl-full" />
                            <div className="absolute -top-3 -right-1 w-2 h-4 border-r border-t border-[#166534] rounded-tr-full" />
                            <div className="absolute top-2 -left-2 w-2 h-5 border-l-2 border-t-2 border-[#166534] rounded-tl-lg" />
                            <div className="absolute top-2 -right-2 w-2 h-5 border-r-2 border-t-2 border-[#166534] rounded-tr-lg" />
                          </div>
                        )}
                        {char === 'STAG_BEETLE' && (
                          <div className="w-5 h-7 bg-[#2a150d] rounded-full relative">
                            <div className="absolute -top-2 left-0 w-2 h-4 border-l-2 border-t-2 border-[#1a0d08] rounded-tl-lg" />
                            <div className="absolute -top-2 right-0 w-2 h-4 border-r-2 border-t-2 border-[#1a0d08] rounded-tr-lg" />
                          </div>
                        )}
                        {char === 'HERCULES' && (
                          <div className="w-6 h-8 flex items-center justify-center relative">
                            <div className="w-2 h-6 bg-[#94a3b8] rounded-full relative" />
                            <div className="absolute top-2 -left-2 w-4 h-4 bg-[#64748b] rounded-bl-full" />
                            <div className="absolute top-2 -right-2 w-4 h-4 bg-[#64748b] rounded-br-full" />
                          </div>
                        )}
                        {char === 'SILVER_STAG_BEETLE' && (
                          <div className="w-5 h-7 bg-[#94a3b8] rounded-full relative">
                            <div className="absolute -top-2 left-0 w-2 h-4 border-l-2 border-t-2 border-[#64748b] rounded-tl-lg" />
                            <div className="absolute -top-2 right-0 w-2 h-4 border-r-2 border-t-2 border-[#64748b] rounded-tr-lg" />
                          </div>
                        )}
                        {char === 'DRAGONFLY' && (
                          <div className="w-2 h-7 bg-red-500 rounded-full relative">
                            <div className="absolute top-1 -left-3 w-6 h-2 bg-red-200/40 rounded-full" />
                            <div className="absolute top-1 -right-3 w-6 h-2 bg-red-200/40 rounded-full" />
                            <div className="absolute top-3 -left-2 w-5 h-2 bg-red-200/40 rounded-full" />
                            <div className="absolute top-3 -right-2 w-5 h-2 bg-red-200/40 rounded-full" />
                          </div>
                        )}
                        {isLocked && <Lock className="absolute inset-0 m-auto w-4 h-4 text-white/50" />}
                      </div>
                      <span className={`text-[6px] font-bold tracking-widest uppercase truncate w-full ${char === 'GOLDEN_HERCULES' ? 'text-yellow-400' : 'opacity-80'}`}>
                        {isLocked ? '???' : char === 'BEETLE' ? 'Beetle' : char === 'BUTTERFLY' ? 'Butterfly' : char === 'LADYBUG' ? 'Ladybug' : char === 'GOLDEN_HERCULES' ? 'Golden' : char === 'CICADA' ? 'Cicada' : char === 'MANTIS' ? 'Mantis' : char === 'GRASSHOPPER' ? 'Grass' : char === 'STAG_BEETLE' ? 'Stag' : char === 'SILVER_STAG_BEETLE' ? 'Silver' : char === 'HERCULES' ? 'Hercules' : 'Tonbo'}
                      </span>
                      {charBest > 0 && (
                        <div className="text-[5px] text-[#4ade80] font-bold">BEST: {charBest.toLocaleString()}</div>
                      )}
                      <div className="flex flex-col items-center gap-0.5 opacity-60">
                        <div className="flex gap-0.5">
                          <span className="text-[4px] uppercase">Spd</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className={`w-1 h-0.5 rounded-full ${i <= (char === 'BUTTERFLY' ? 3 : char === 'GOLDEN_HERCULES' ? 4 : char === 'MANTIS' ? 3 : char === 'BEETLE' ? 2 : char === 'CICADA' ? 1 : char === 'GRASSHOPPER' ? 4 : char === 'HERCULES' ? 3 : char === 'SILVER_STAG_BEETLE' ? 2 : char === 'DRAGONFLY' ? 4 : 2) ? 'bg-white' : 'bg-white/20'} ${i === 4 && char !== 'GOLDEN_HERCULES' && char !== 'GRASSHOPPER' && char !== 'DRAGONFLY' ? 'hidden' : ''}`} />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          <span className="text-[4px] uppercase">Pwr</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className={`w-1 h-0.5 rounded-full ${i <= (char === 'GOLDEN_HERCULES' ? 4 : char === 'LADYBUG' ? 3 : char === 'BEETLE' ? 2 : char === 'CICADA' ? 1 : char === 'GRASSHOPPER' ? 1 : char === 'HERCULES' ? 3 : char === 'SILVER_STAG_BEETLE' ? 2 : 2) ? 'bg-white' : 'bg-white/20'} ${i === 4 && char !== 'GOLDEN_HERCULES' ? 'hidden' : ''}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {selectedCharacter === char && (
                        <div className={`absolute -bottom-1 w-1 h-1 rounded-full ${char === 'GOLDEN_HERCULES' ? 'bg-yellow-400' : 'bg-[#4ade80]'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Character Info Panel */}
              <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-3 mb-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-[#4ade80] font-black italic uppercase tracking-widest text-sm">
                    {selectedCharacter === 'BEETLE' ? 'Beetle' : 
                     selectedCharacter === 'BUTTERFLY' ? 'Butterfly' : 
                     selectedCharacter === 'LADYBUG' ? 'Ladybug' : 
                     selectedCharacter === 'GOLDEN_HERCULES' ? 'Golden Hercules' : 
                     selectedCharacter === 'CICADA' ? 'Cicada' : 
                     selectedCharacter === 'MANTIS' ? 'Mantis' : 
                     selectedCharacter === 'GRASSHOPPER' ? 'Grasshopper' : 
                     selectedCharacter === 'STAG_BEETLE' ? 'Stag Beetle' : 
                     selectedCharacter === 'HERCULES' ? 'Hercules' : 
                     selectedCharacter === 'SILVER_STAG_BEETLE' ? 'Silver Stag Beetle' : 'Dragonfly'}
                  </h3>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] opacity-40 uppercase tracking-widest">HP</span>
                      <span className="text-xs font-bold">{
                        selectedCharacter === 'SILVER_STAG_BEETLE' ? '4' : 
                        (selectedCharacter === 'CICADA' || selectedCharacter === 'GRASSHOPPER') ? '2' : '3'
                      }</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] opacity-40 uppercase tracking-widest">Speed</span>
                      <span className="text-xs font-bold">{
                        selectedCharacter === 'DRAGONFLY' ? 'MAX' :
                        selectedCharacter === 'GRASSHOPPER' ? 'VERY HIGH' :
                        selectedCharacter === 'GOLDEN_HERCULES' ? 'HIGH' : 'NORMAL'
                      }</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-white/70 leading-relaxed text-left">
                  {selectedCharacter === 'BEETLE' && "Standard balance. Can use shields to block hits."}
                  {selectedCharacter === 'BUTTERFLY' && "High speed. Can create clones to multiply firepower."}
                  {selectedCharacter === 'LADYBUG' && "Powerful beam attack. High attack power."}
                  {selectedCharacter === 'GOLDEN_HERCULES' && "Heavy armor and bombs. High survival and area damage."}
                  {selectedCharacter === 'CICADA' && "Low HP but powerful sonic waves. Speed increases at max power."}
                  {selectedCharacter === 'MANTIS' && "Sharp scythe attacks. Special X-Slash skill."}
                  {selectedCharacter === 'GRASSHOPPER' && "Extreme speed. Auto-revive skill (Last Stand)."}
                  {selectedCharacter === 'STAG_BEETLE' && "Time manipulation. Can stop time for enemies."}
                  {selectedCharacter === 'HERCULES' && "Heavy weight. Powerful screen-clearing shockwave."}
                  {selectedCharacter === 'SILVER_STAG_BEETLE' && "Big Beam (1/3 Screen). Extra Life (4 HP). Max Power: 8-way shot + Homing Missiles."}
                  {selectedCharacter === 'DRAGONFLY' && "Fastest speed. Focus Mode slows down time and enhances homing shots."}
                </p>
              </div>

              <button
                onClick={startGame}
                className="group relative flex items-center gap-3 bg-[#4ade80] text-black px-6 py-2.5 rounded-full font-bold text-base hover:scale-105 transition-transform shrink-0"
              >
                <Play className="w-4 h-4 fill-black" />
                START MISSION
                <div className="absolute -inset-1 bg-[#4ade80] opacity-20 blur-lg group-hover:opacity-40 transition-opacity rounded-full" />
              </button>

              <div className="mt-4 flex gap-4 shrink-0">
                <button
                  onClick={() => {
                    const shareUrl = window.location.href;
                    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('昆虫大戦 Insect Swarm で遊ぼう！')}`;
                    window.open(lineUrl, '_blank');
                  }}
                  className="flex items-center gap-2 bg-[#06C755] text-white px-4 py-2 rounded-full text-[10px] font-bold hover:scale-105 transition-transform"
                >
                  <MessageCircle className="w-3 h-3 fill-white" />
                  LINEでシェア
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('URLをコピーしました！');
                  }}
                  className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-[10px] font-bold hover:bg-white/20 transition-all border border-white/10"
                >
                  URLコピー
                </button>
              </div>
              <div className="mt-6 mb-8 grid grid-cols-3 gap-4 text-[8px] uppercase tracking-[0.2em] opacity-40 shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center">←</div>
                  Move
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center">↑</div>
                  Dodge
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center">→</div>
                  Attack
                </div>
              </div>
            </div>
          )}

          {gameState === 'STAGE_CLEAR' && (
            <div
              className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-6 z-50"
            >
              <h2 className="text-3xl font-black italic text-[#4ade80] mb-2 uppercase tracking-tighter">Mission Accomplished</h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-xs mb-6">
                <div className="text-[10px] opacity-40 uppercase tracking-[0.2em] mb-4">Stage {stage-1} Complete</div>
                <div className="flex justify-between items-center mb-2">
                  <span className="opacity-60 uppercase text-xs tracking-widest">Stage Score</span>
                  <span className="font-bold text-xl">{stageScores[stage-2]?.toLocaleString() || score.toLocaleString()}</span>
                </div>
                <div className="h-px bg-white/10 my-4" />
                <div className="text-[10px] opacity-40 uppercase tracking-[0.2em]">Total Score: {score.toLocaleString()}</div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-[#4ade80] border-t-transparent rounded-full animate-spin mb-2" />
                <div className="text-[#4ade80] font-bold tracking-widest animate-pulse uppercase text-sm">
                  Preparing Next Mission...
                </div>
              </div>
            </div>
          )}

          {gameState === 'VICTORY' && (
            <div
              className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-8 z-50"
            >
              <div>
                <Trophy className="w-20 h-20 text-yellow-500 mb-4" />
              </div>
              <h2 className="text-4xl font-black italic uppercase text-[#4ade80] mb-2">Mission Accomplished</h2>
              <p className="text-sm opacity-70 mb-8">You have defeated the Giant Mantis and saved the forest!</p>
              <div className="mb-8">
                <div className="text-sm opacity-50 uppercase tracking-widest mb-1">Final Score</div>
                <div className="text-5xl font-bold text-white">{score.toLocaleString()}</div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={startGame}
                  className="flex items-center justify-center gap-3 bg-[#4ade80] text-black px-8 py-4 rounded-full font-bold text-xl hover:scale-105 transition-transform"
                >
                  <RotateCcw className="w-6 h-6" />
                  PLAY AGAIN
                </button>
                <button
                  onClick={backToSelect}
                  className="flex items-center justify-center gap-3 bg-white/10 text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-white/20 transition-colors"
                >
                  <LayoutGrid className="w-6 h-6" />
                  CHARACTER SELECT
                </button>
                <a
                  href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent('https://ais-pre-cewbgp644rmxj2dykf7bhi-145649203008.asia-northeast1.run.app')}&text=${encodeURIComponent(`昆虫大戦 Insect Swarm をクリアしたよ！スコア: ${score.toLocaleString()}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#06C755] text-white px-8 py-3 rounded-full text-sm font-bold hover:scale-105 transition-transform"
                >
                  <MessageCircle className="w-5 h-5 fill-white" />
                  LINEで友達に送る
                </a>
              </div>
            </div>
          )}

          {gameState === 'GAMEOVER' && (
            <div
              className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-8 z-50"
            >
              <h2 className="text-6xl font-black italic uppercase text-red-500 mb-2">Defeated</h2>
              <div className="mb-8">
                <div className="text-sm opacity-50 uppercase tracking-widest mb-1">Final Score</div>
                <div className="text-5xl font-bold text-white">{score.toLocaleString()}</div>
              </div>

              {score >= highScore && score > 0 && (
                <div
                  className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 px-4 py-2 rounded-lg mb-8 flex items-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-yellow-500" />
                  NEW HIGH SCORE!
                </div>
              )}

              <div className="flex flex-col gap-3 w-full max-w-[280px]">
                <button
                  onClick={continueGame}
                  className="flex items-center justify-center gap-3 bg-[#4ade80] text-black px-8 py-4 rounded-full font-bold text-xl hover:scale-105 transition-transform"
                >
                  <Play className="w-6 h-6 fill-black" />
                  CONTINUE
                </button>
                <button
                  onClick={backToStart}
                  className="flex items-center justify-center gap-3 bg-white/10 border border-white/20 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  CHAR SELECT
                </button>
                <button
                  onClick={() => {
                    const shareUrl = window.location.href;
                    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`昆虫大戦 Insect Swarm で敗北... スコア: ${score.toLocaleString()}。君なら勝てるか？`)}`;
                    window.open(lineUrl, '_blank');
                  }}
                  className="flex items-center justify-center gap-2 bg-[#06C755] text-white px-8 py-3 rounded-full text-sm font-bold hover:scale-105 transition-transform mt-2"
                >
                  <MessageCircle className="w-5 h-5 fill-white" />
                  LINEで友達に送る
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('URLをコピーしました！');
                  }}
                  className="flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-2 rounded-full text-[10px] font-bold hover:bg-white/20 transition-all border border-white/10 mt-2"
                >
                  URLコピー
                </button>
              </div>
            </div>
          )}
        </>
      </div>

      {/* Footer info */}
      <div className="mt-6 text-[10px] uppercase tracking-[0.3em] opacity-30 flex items-center gap-4">
        <span>Beetle Unit 01</span>
        <div className="w-1 h-1 bg-white rounded-full" />
        <span>Forest Defense Protocol</span>
      </div>
    </div>
  );
}
