"use client";

import { type InputHTMLAttributes } from "react";

type ServicePriceInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "type"
>;

export function ServicePriceInput(props: ServicePriceInputProps) {
  return (
    <input
      {...props}
      name="servicePrice"
      type="number"
      onInput={(event) => {
        const input = event.currentTarget;
        input.value = input.value.replace(/^0+(?=\d)/, "");
      }}
    />
  );
}
