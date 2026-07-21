"use client";

import { useState, useEffect } from "react";
import "../styles/movement-illustration.css";

export interface MovementPhase {
  id: number;
  phaseName: string;
  imageUrl: string;
  order: number;
}

export interface Movement {
  id: string;
  name: string;
  focus: string;
  description: string;
  cue: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  phases: MovementPhase[];
}

interface MovementIllustrationProps {
  movement: Movement;
  autoPlay?: boolean;
  size?: "small" | "medium" | "large";
}

export default function MovementIllustration({
  movement,
  autoPlay = true,
  size = "medium",
}: MovementIllustrationProps) {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  const currentPhase = movement.phases[currentPhaseIndex];
  const totalPhases = movement.phases.length;

  // Auto-cycle through phases
  useEffect(() => {
    if (!isPlaying || totalPhases <= 1) return;

    const interval = setInterval(() => {
      setCurrentPhaseIndex((prev) => (prev + 1) % totalPhases);
    }, 800); // 800ms per phase

    return () => clearInterval(interval);
  }, [isPlaying, totalPhases]);

  const handlePrevious = () => {
    setCurrentPhaseIndex((prev) => (prev - 1 + totalPhases) % totalPhases);
    setIsPlaying(false);
  };

  const handleNext = () => {
    setCurrentPhaseIndex((prev) => (prev + 1) % totalPhases);
    setIsPlaying(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "difficulty-beginner";
      case "Intermediate":
        return "difficulty-intermediate";
      case "Advanced":
        return "difficulty-advanced";
      default:
        return "difficulty-beginner";
    }
  };

  return (
    <div className={`movement-illustration ${size}`}>
      {/* Header with movement info */}
      <div className="movement-header">
        <div className="movement-title-block">
          <h3 className="movement-name">{movement.name}</h3>
          <p className="movement-focus">{movement.focus}</p>
          <span className={`difficulty-badge ${getDifficultyColor(movement.difficulty)}`}>
            {movement.difficulty}
          </span>
        </div>
        <div className="movement-cue">
          <span className="cue-label">Cue</span>
          <p className="cue-text">"{movement.cue}"</p>
        </div>
      </div>

      {/* Illustration viewer */}
      <div className="illustration-viewer">
        <div className="phase-container">
          {currentPhase && (
            <>
              <img
                src={currentPhase.imageUrl}
                alt={currentPhase.phaseName}
                className="phase-image"
                loading="lazy"
              />
              <div className="phase-label">{currentPhase.phaseName}</div>
            </>
          )}
        </div>

        {/* Phase indicators and controls */}
        {totalPhases > 1 && (
          <div className="phase-controls">
            <button
              className="control-button prev"
              onClick={handlePrevious}
              aria-label="Previous phase"
            >
              ←
            </button>

            <div className="phase-indicators">
              {movement.phases.map((_, index) => (
                <button
                  key={index}
                  className={`phase-dot ${index === currentPhaseIndex ? "active" : ""}`}
                  onClick={() => {
                    setCurrentPhaseIndex(index);
                    setIsPlaying(false);
                  }}
                  aria-label={`Go to phase ${index + 1}`}
                  aria-current={index === currentPhaseIndex ? "true" : "false"}
                />
              ))}
            </div>

            <button
              className="control-button next"
              onClick={handleNext}
              aria-label="Next phase"
            >
              →
            </button>
          </div>
        )}

        {/* Play/pause button */}
        {totalPhases > 1 && (
          <button
            className={`play-button ${isPlaying ? "playing" : "paused"}`}
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "Pause animation" : "Play animation"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
        )}
      </div>

      {/* Description */}
      <div className="movement-description">
        <p>{movement.description}</p>
      </div>
    </div>
  );
}
