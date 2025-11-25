"use client";

import { use } from "react";
import { extractShowId } from "@/lib/slug";
import { Console } from "../page";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ConsoleWithIdPage({ params }: Props) {
  const { id: slugOrId } = use(params);
  const showId = extractShowId(slugOrId);
  
  return <Console initialShowId={showId} />;
}

