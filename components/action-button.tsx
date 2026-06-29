"use client";

import { Loader2 } from "lucide-react";
import {
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useState,
} from "react";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loadingLabel?: ReactNode;
  onAction: () => void | Promise<void>;
};

export function ActionButton({
  children,
  loadingLabel = "Loading...",
  disabled,
  onAction,
  className,
  ...props
}: ActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    props.onClick?.(event);

    if (event.defaultPrevented || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      await onAction();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      {...props}
      type="button"
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={className}
      onClick={handleClick}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
