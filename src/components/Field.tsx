import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  /** Dica curta abaixo do rótulo explicando o que informar. */
  hint?: string;
  /** Prefixo/sufixo visual dentro do input (ex.: "R$", "%"). */
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  inputMode?: 'decimal' | 'numeric';
  /** Conteúdo auxiliar à direita do rótulo (ex.: conversão automática). */
  aside?: ReactNode;
}

/**
 * Campo de formulário reutilizável: rótulo claro, dica curta e suporte a
 * prefixo/sufixo (R$, %). Mantém a aparência consistente em todo o formulário.
 */
export default function Field({
  label,
  hint,
  prefix,
  suffix,
  value,
  onChange,
  placeholder,
  required,
  inputMode = 'decimal',
  aside,
}: FieldProps) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-agro-800">
          {label}
          {required && <span className="ml-0.5 text-agro-500">*</span>}
        </span>
        {aside}
      </div>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-agro-400">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode={inputMode}
          className={`field-input ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-9' : ''}`}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-agro-400">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs leading-snug text-agro-500">{hint}</p>}
    </label>
  );
}
