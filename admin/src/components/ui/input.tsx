import React from "react";
import { cn } from "./cn";

export const Label = ({ htmlFor, children, className }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("text-sm font-semibold tracking-wide", className)}
    >
      {children}
    </label>
  );
};

const Input = ({ className, ...props }) => {
  return (
    <input
      {...props}
      className={cn(
        "border px-4 py-1 border-gray-500 rounded-md max-w-lg",
        className,
      )}
    />
  );
};

export default Input;
