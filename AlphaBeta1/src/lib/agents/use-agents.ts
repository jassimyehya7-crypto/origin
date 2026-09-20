"use client";

/**
 * OffresLocal — Agent System React Hook
 * Provides access to the autonomous agent system
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  initAgentSystem,
  stopAgentSystem,
  getSystemStatus,
  getTribunalCases,
  getRedTeamResults,
  getHealthHistory,
  getMessages,
  getAllAgents,
  tryReserve,
  cancelReservation,
  getStockStatus,
  initStock,
  runTribunal,
  type AgentReport,
  type TribunalCase,
  type RedTeamTest,
  type HealthCheck,
  type AgentMessage,
} from "./orchestrator";

export interface UseAgentsReturn {
  /** System status */
  status: ReturnType<typeof getSystemStatus>;
  /** Tribunal cases (debates) */
  tribunalCases: TribunalCase[];
  /** Red team test results */
  redTeamResults: RedTeamTest[];
  /** Health check history */
  healthChecks: HealthCheck[];
  /** Agent messages */
  messages: AgentMessage[];
  /** All agents */
  agents: ReturnType<typeof getAllAgents>;
  /** Whether the system is running */
  running: boolean;
  /** Reserve stock for an offer */
  reserve: (offerId: string, userId: string) => { success: boolean; lockId: string | null; remaining: number; reason?: string };
  /** Cancel a reservation */
  cancel: (offerId: string, lockId: string) => boolean;
  /** Get stock status */
  stock: (offerId: string) => ReturnType<typeof getStockStatus>;
  /** Manually trigger tribunal */
  triggerTribunal: () => TribunalCase | null;
}

export function useAgents(): UseAgentsReturn {
  const [status, setStatus] = useState(getSystemStatus());
  const [tribunalCases, setTribunalCases] = useState<TribunalCase[]>([]);
  const [redTeamResults, setRedTeamResults] = useState<RedTeamTest[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [agents, setAgents] = useState(getAllAgents());
  const [running, setRunning] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    initAgentSystem();
    setRunning(true);

    // Poll status every 5s
    const interval = setInterval(() => {
      setStatus(getSystemStatus());
      setTribunalCases(getTribunalCases());
      setRedTeamResults(getRedTeamResults());
      setHealthChecks(getHealthHistory());
      setMessages(getMessages(50));
      setAgents(getAllAgents());
    }, 5000);

    return () => {
      clearInterval(interval);
      stopAgentSystem();
    };
  }, []);

  const reserve = useCallback((offerId: string, userId: string) => {
    return tryReserve(offerId, userId);
  }, []);

  const cancel = useCallback((offerId: string, lockId: string) => {
    return cancelReservation(offerId, lockId);
  }, []);

  const stock = useCallback((offerId: string) => {
    return getStockStatus(offerId);
  }, []);

  const triggerTribunal = useCallback(() => {
    return runTribunal();
  }, []);

  return {
    status,
    tribunalCases,
    redTeamResults,
    healthChecks,
    messages,
    agents,
    running,
    reserve,
    cancel,
    stock,
    triggerTribunal,
  };
}
