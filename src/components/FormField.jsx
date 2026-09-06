import React from "react";
import { useContract } from "../context/ContractContext.jsx";

export function useField(id) {
  const { state, dispatch } = useContract();
  const value = state.contract[id];
  const pending = state.pendingFieldIds.includes(id);
  const onChange = (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    dispatch({ type: "SET_FIELD", field: id, value: val });
  };
  return { value, onChange, pending };
}

function fieldClass(pending, extra) {
  return ["field", pending ? "field-pending" : "", extra || ""].filter(Boolean).join(" ");
}

export function TextField({ id, label, mono, ...props }) {
  const { value, onChange, pending } = useField(id);
  return (
    <label className={fieldClass(pending)}>
      <span>{label}</span>
      <input
        type="text"
        id={id}
        className={mono ? "mono-field" : undefined}
        value={value ?? ""}
        onChange={onChange}
        {...props}
      />
    </label>
  );
}

export function NumberField({ id, label, caption, onBlur, ...props }) {
  const { value, onChange, pending } = useField(id);
  return (
    <label className={fieldClass(pending)}>
      <span>{label}</span>
      <input type="number" id={id} value={value ?? ""} onChange={onChange} onBlur={onBlur} {...props} />
      {caption ? <span className="field-caption">{caption}</span> : null}
    </label>
  );
}

export function DateField({ id, label, ...props }) {
  const { value, onChange, pending } = useField(id);
  return (
    <label className={fieldClass(pending)}>
      <span>{label}</span>
      <input type="date" id={id} value={value ?? ""} onChange={onChange} {...props} />
    </label>
  );
}

export function SelectField({ id, label, options, ...props }) {
  const { value, onChange, pending } = useField(id);
  return (
    <label className={fieldClass(pending)}>
      <span>{label}</span>
      <select id={id} value={value ?? ""} onChange={onChange} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextAreaField({ id, label, ...props }) {
  const { value, onChange, pending } = useField(id);
  return (
    <label className={fieldClass(pending)}>
      <span>{label}</span>
      <textarea id={id} value={value ?? ""} onChange={onChange} {...props} />
    </label>
  );
}

export function CheckboxField({ id, label, ...props }) {
  const { value, onChange, pending } = useField(id);
  return (
    <label className={fieldClass(pending, "checkbox-field")}>
      <input type="checkbox" id={id} checked={!!value} onChange={onChange} {...props} />
      <span>{label}</span>
    </label>
  );
}
