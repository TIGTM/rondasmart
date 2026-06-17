import * as React from "react";
import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-blue-600/20 transition focus:ring-4", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-blue-600/20 transition focus:ring-4", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none ring-blue-600/20 transition focus:ring-4", props.className)} />;
}
