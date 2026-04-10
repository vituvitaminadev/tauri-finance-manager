import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type Status = "pending" | "ready" | "error";

interface Props {
  children: React.ReactNode;
}

export function ServerReadyGate({ children }: Props) {
  const [status, setStatus] = useState<Status>("pending");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    invoke("wait_for_server")
      .then(() => setStatus("ready"))
      .catch((e: unknown) => {
        setError(String(e));
        setStatus("error");
      });
  }, []);

  if (status === "pending") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
          <p className="text-gray-600">Starting Finance Manager...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Failed to start server</p>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
