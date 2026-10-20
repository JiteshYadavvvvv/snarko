"use client";

import { useState } from "react";
import { AchievementsScreen } from "@/components/games/ridge-runner/achievements-screen";
import { GameplayScreen } from "@/components/games/ridge-runner/gameplay-screen";
import { Garage } from "@/components/games/ridge-runner/garage";
import { MainMenu } from "@/components/games/ridge-runner/main-menu";
import {
  loadSave,
  persistSave,
  purchaseUpgrade,
  purchaseVehicle,
  selectVehicle,
} from "@/components/games/ridge-runner/engine/progression";
import { DEFAULT_STAGE_ID } from "@/components/games/ridge-runner/engine/stages";
import { WorldMap } from "@/components/games/ridge-runner/world-map";
import type {
  SaveData,
  UpgradeCategory,
} from "@/components/games/ridge-runner/engine/types";

type Screen = "menu" | "world-map" | "garage" | "game" | "achievements";

function formatDistance(value: number): string {
  return `${value}m`;
}

export function RidgeRunnerGame() {
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [screen, setScreen] = useState<Screen>("menu");
  const [activeStageId, setActiveStageId] = useState<string>(DEFAULT_STAGE_ID);

  function updateSave(next: SaveData) {
    setSave(next);
  }

  function handlePurchaseVehicle(vehicleId: string) {
    setSave((previous) => {
      const next = purchaseVehicle(previous, vehicleId);
      persistSave(next);
      return next;
    });
  }

  function handleSelectVehicle(vehicleId: string) {
    setSave((previous) => {
      const next = selectVehicle(previous, vehicleId);
      persistSave(next);
      return next;
    });
  }

  function handlePurchaseUpgrade(category: UpgradeCategory) {
    setSave((previous) => {
      const next = purchaseUpgrade(
        previous,
        previous.selectedVehicleId,
        category,
      );
      persistSave(next);
      return next;
    });
  }

  return (
    <div className="theme-dark bg-background border-border rounded-xl border p-4 sm:p-6">
      {screen === "menu" && (
        <MainMenu
          save={save}
          onPlay={() => setScreen("world-map")}
          onOpenGarage={() => setScreen("garage")}
          onOpenAchievements={() => setScreen("achievements")}
        />
      )}

      {screen === "achievements" && (
        <AchievementsScreen save={save} onBack={() => setScreen("menu")} />
      )}

      {screen === "world-map" && (
        <WorldMap
          save={save}
          onSelectStage={(stageId) => {
            setActiveStageId(stageId);
            setScreen("garage");
          }}
          onBack={() => setScreen("menu")}
        />
      )}

      {screen === "garage" && (
        <Garage
          save={save}
          bestDistanceLabel={formatDistance(
            save.stageBestDistance[activeStageId] ?? 0,
          )}
          onSelectVehicle={handleSelectVehicle}
          onPurchaseVehicle={handlePurchaseVehicle}
          onPurchaseUpgrade={handlePurchaseUpgrade}
          onBack={() => setScreen("world-map")}
          onDrive={() => setScreen("game")}
        />
      )}

      {screen === "game" && (
        <GameplayScreen
          stageId={activeStageId}
          vehicleId={save.selectedVehicleId}
          save={save}
          onSaveChange={updateSave}
          onExitToGarage={() => setScreen("garage")}
          onExitToWorldMap={() => setScreen("world-map")}
          onNextStage={(nextStageId) => {
            setActiveStageId(nextStageId);
            setScreen("garage");
          }}
        />
      )}
    </div>
  );
}
