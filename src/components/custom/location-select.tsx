"use client";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

type LocationSelectProps = {
  id: string;
  label: string;
  /** Selected id, or null when nothing is chosen. */
  value: number | null;
  options: { id: number; name: string }[];
  onChange: (id: string) => void;
  /** Options are still being fetched. */
  loading: boolean;
  /** Not selectable yet (e.g. no country chosen for the state list). */
  disabled?: boolean;
  placeholder: string;
  loadingPlaceholder: string;
  error?: string;
};

/**
 * A dropdown whose options arrive from the server.
 *
 * While they load it shows a spinner instead of a blank box. The select is
 * keyed on `loading` so it remounts once the options exist: a saved value set
 * before its option is in the list otherwise leaves the trigger empty.
 */
export function LocationSelect({
  id,
  label,
  value,
  options,
  onChange,
  loading,
  disabled = false,
  placeholder,
  loadingPlaceholder,
  error,
}: LocationSelectProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        key={loading ? "loading" : "ready"}
        // An empty value makes Radix show the placeholder (and its spinner).
        value={loading ? "" : (value?.toString() ?? "")}
        onValueChange={onChange}
        disabled={loading || disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue
            placeholder={
              loading ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  {loadingPlaceholder}
                </span>
              ) : (
                placeholder
              )
            }
          />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={String(option.id)}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
