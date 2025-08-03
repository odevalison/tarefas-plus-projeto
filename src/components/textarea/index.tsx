"use client";
import type { HTMLProps } from "react";

interface TextareaProps extends HTMLProps<HTMLTextAreaElement> {
  border?: boolean;
}

export function Textarea({ border = false, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`h-36 w-full resize-none rounded-md bg-white p-3 outline-none ${border && "border border-zinc-400"}`}
    />
  );
}
