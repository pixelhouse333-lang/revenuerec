import React from "react";
import { useContract } from "../context/ContractContext.jsx";
import { CheckIcon, CloseIcon } from "./icons.jsx";

export function useField(id) {
  const { state, dispatch } = useContract();
  const value = state.contract[id];
  const pending = state.pendingFieldIds.includes(id);
  const onChange = (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    dispatch({ type: "SET_FIELD", field: id, value: val });
  };
  const onConfirm = () => dispatch({ type: "CONFIRM_FIELD", field: id });
  const onReject = () => dispatch({ type: "REJECT_FIELD", field: id });
  return { value, onChange, pending, onConfirm, onReject };
}

function fieldClass(pending, extra) {
  return ["field", pending ? "field-pending" : "", extra || ""].filter(Boolean).join(" ");
}

function FieldLabel({ label, pending, onConfirm, onReject }) {
  return (
    <span className="field-label-row">
      <span>{label}</span>
      {pending && (
        <span className="field-review-actions">
          <button
            type="button"
            className="field-review-btn field-review-confirm"
            onClick={onConfirm}
            aria-label="Confirm imported value"
            title="Confirm imported value"
          >
            <CheckIcon />
          </button>
          <button
            type="button"
            className="field-review-btn field-review-reject"
            onClick={onReject}
            aria-label="Reject imported value"
            title="Reject imported value"
          >
            <CloseIcon />
          </button>
        </span>
      )}
    </span>
  );
}

export function TextField({ id, label, mono, ...props }) {
  const { value, onChange, pending, onConfirm, onReject } = useField(id);
  return (
    <label className={fieldClass(pending)}>
      <FieldLabel label={label} pending={pending} onConfirm={onConfirm} onReject={onReject} />
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
  const { value, onChange, pending, onConfirm, onReject } = useField(id);
  return (
    <label className={fieldClass(pending)}>
      <FieldLabel label={label} pending={pending} onConfirm={onConfirm} onReject={onReject} />
      <input type="number" id={id} value={value ?? ""} onChange={onChange} onBlur={onBlur} {...props} />
      {caption ? <span className="field-caption">{caption}</span> : null}
    </label>
  );
}

export function DateField({ id, label, ...props }) {
  const { value, onChange, pending, onConfirm, onReject } = useField(id);
  return (
    <label className={fieldClass(pending)}>
      <FieldLabel label={label} pending={pending} onConfirm={onConfirm} onReject={onReject} />
      <input type="date" id={id} value={value ?? ""} onChange={onChange} {...props} />
    </label>
  );
}

export function SelectField({ id, label, options, ...props }) {
  const { value, onChange, pending, onConfirm, onReject } = useField(id);
  return (
    <label className={fieldClass(pending)}>
      <FieldLabel label={label} pending={pending} onConfirm={onConfirm} onReject={onReject} />
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
  const { value, onChange, pending, onConfirm, onReject } = useField(id);
  return (
    <label className={fieldClass(pending)}>
      <FieldLabel label={label} pending={pending} onConfirm={onConfirm} onReject={onReject} />
      <textarea id={id} value={value ?? ""} onChange={onChange} {...props} />
    </label>
  );
}

export function CheckboxField({ id, label, ...props }) {
  const { value, onChange, pending, onConfirm, onReject } = useField(id);
  return (
    <label className={fieldClass(pending, "checkbox-field")}>
      <input type="checkbox" id={id} checked={!!value} onChange={onChange} {...props} />
      <FieldLabel label={label} pending={pending} onConfirm={onConfirm} onReject={onReject} />
    </label>
  );
}
