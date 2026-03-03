"use client";

import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";

export type BotMood = "active" | "searching" | "review" | "idle";

export interface MissionBotState {
  id: string;
  name: string;
  station: {
    key: string;
    x: number;
    y: number;
  };
  mood: BotMood;
  note: string;
}

export interface MissionStation {
  key: string;
  label: string;
  x: number;
  y: number;
}

interface MissionCanvasProps {
  stations: MissionStation[];
  bots: MissionBotState[];
}

const TILE_WIDTH = 140;
const TILE_HEIGHT = 70;
const STAGE_WIDTH = 780;
const STAGE_HEIGHT = 520;

export function MissionCanvas({ stations, bots }: MissionCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    const mountNode = containerRef.current;
    if (!mountNode) return;

    const setup = async () => {
      const app = new PIXI.Application();
      await app.init({
        width: STAGE_WIDTH,
        height: STAGE_HEIGHT,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
      });

      if (disposed) {
        app.destroy(true, { children: true, texture: true });
        return;
      }

      mountNode.innerHTML = "";
      mountNode.appendChild(app.canvas);
      appRef.current = app;
      setReady(true);
    };

    setup();

    return () => {
      disposed = true;
      mountNode.innerHTML = "";
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const app = appRef.current;
    if (!app || !ready) return;
    renderScene(app, stations, bots);
  }, [stations, bots, ready]);

  return <div ref={containerRef} className="mission-canvas" />;
}

function renderScene(app: PIXI.Application, stations: MissionStation[], bots: MissionBotState[]) {
  app.stage.removeChildren();
  const scene = new PIXI.Container();
  scene.x = STAGE_WIDTH / 2;
  scene.y = 160;
  app.stage.addChild(scene);

  drawBackdrop(scene);

  stations.forEach((station) => {
    const point = toIso(station.x, station.y);
    const tile = drawDeskTile(station.label);
    tile.x = point.x;
    tile.y = point.y;
    scene.addChild(tile);
  });

  bots.forEach((bot) => {
    const point = toIso(bot.station.x, bot.station.y - 0.2);
    const sprite = drawBotSprite(bot);
    sprite.x = point.x;
    sprite.y = point.y - 40;
    scene.addChild(sprite);
  });
}

function drawBackdrop(container: PIXI.Container) {
  const plate = new PIXI.Graphics();
  plate.beginFill(0x101324, 0.95);
  plate.lineStyle(2, 0xffffff, 0.05);
  plate.drawRoundedRect(-340, -60, 680, 360, 36);
  plate.endFill();
  container.addChild(plate);
}

function drawDeskTile(label: string) {
  const desk = new PIXI.Container();
  const tile = new PIXI.Graphics();
  tile.beginFill(0x192040, 0.9);
  tile.lineStyle(2, 0xffffff, 0.06);
  tile.moveTo(0, 0);
  tile.lineTo(TILE_WIDTH / 2, TILE_HEIGHT / 2);
  tile.lineTo(0, TILE_HEIGHT);
  tile.lineTo(-TILE_WIDTH / 2, TILE_HEIGHT / 2);
  tile.closePath();
  tile.endFill();
  desk.addChild(tile);

  const text = new PIXI.Text(label, {
    fontFamily: "Geist Mono, monospace",
    fontSize: 11,
    fill: 0xbec4ff,
    letterSpacing: 2,
  });
  text.anchor.set(0.5);
  text.y = TILE_HEIGHT / 2;
  desk.addChild(text);

  return desk;
}

function drawBotSprite(bot: MissionBotState) {
  const container = new PIXI.Container();
  const color = moodHex(bot.mood);

  const body = new PIXI.Graphics();
  body.beginFill(0x151931, 0.95);
  body.lineStyle(2, color, 1);
  body.drawRoundedRect(-28, -38, 56, 76, 18);
  body.endFill();
  container.addChild(body);

  const visor = new PIXI.Graphics();
  visor.beginFill(0x6ca8ff, 0.25);
  visor.lineStyle(2, 0xffffff, 0.4);
  visor.drawRoundedRect(-16, -12, 32, 24, 8);
  visor.endFill();
  container.addChild(visor);

  const name = new PIXI.Text(bot.name.toUpperCase(), {
    fontFamily: "Geist Mono, monospace",
    fontSize: 10,
    fill: 0xffffff,
    letterSpacing: 2,
  });
  name.anchor.set(0.5);
  name.y = -48;
  container.addChild(name);

  const note = new PIXI.Text(bot.note, {
    fontFamily: "Geist, sans-serif",
    fontSize: 11,
    fill: 0xdfe2ff,
    align: "center",
    wordWrap: true,
    wordWrapWidth: 120,
  });
  note.anchor.set(0.5, 0);
  note.y = 42;
  container.addChild(note);

  return container;
}

function toIso(gridX: number, gridY: number) {
  const isoX = (gridX - gridY) * (TILE_WIDTH / 2);
  const isoY = (gridX + gridY) * (TILE_HEIGHT / 2);
  return { x: isoX, y: isoY };
}

function moodHex(mood: BotMood) {
  switch (mood) {
    case "active":
      return 0x8fee9c;
    case "searching":
      return 0x71a8ff;
    case "review":
      return 0xf6d46d;
    default:
      return 0xcaa9ff;
  }
}
