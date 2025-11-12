"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShowPage() {
  const params = useParams();
  const router = useRouter();
  const showId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load the show and redirect to main page with the show loaded
    const loadAndRedirect = async () => {
      try {
        // Store the show ID in sessionStorage for the main page to pick up
        if (typeof window !== "undefined") {
          sessionStorage.setItem("production-flow.library-load.v1", showId);
        }
        
        // Redirect to main page which will load the show
        router.push("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load show");
        setIsLoading(false);
      }
    };

    void loadAndRedirect();
  }, [showId, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-foreground">
        <div className="text-center space-y-4">
          <p className="text-red-400">Failed to load show</p>
          <p className="text-sm text-foreground/60">{error}</p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-foreground">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-foreground/70">Loading show...</p>
      </div>
    </div>
  );
}

