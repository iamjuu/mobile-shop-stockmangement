"use client";

import { Loader2 } from "lucide-react";
import {
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel?: ReactNode;
};

export function PendingSubmitButton({
  children,
  pendingLabel = "Saving...",
  className,
  disabled,
  onClick,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const [isClicked, setIsClicked] = useState(false);
  const hasPendingStartedRef = useRef(false);
  const clickTimerRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const isBusy = pending || isClicked;

  useEffect(() => {
    if (pending) {
      hasPendingStartedRef.current = true;
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      return;
    }

    if (hasPendingStartedRef.current) {
      hasPendingStartedRef.current = false;
      window.setTimeout(() => {
        setIsClicked(false);
      }, 0);
    }
  }, [pending]);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        window.clearTimeout(clickTimerRef.current);
      }

      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    const form = event.currentTarget.form;

    if (form && !form.checkValidity()) {
      return;
    }

    clickTimerRef.current = window.setTimeout(() => {
      setIsClicked(true);

      fallbackTimerRef.current = window.setTimeout(() => {
        if (!hasPendingStartedRef.current) {
          setIsClicked(false);
        }
      }, 3000);
    }, 0);
  }

  return (
    <button
      {...props}
      type="submit"
      disabled={isBusy || disabled}
      className={className}
      aria-busy={isBusy}
      onClick={handleClick}
    >
      {isBusy ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
