import React from "react";

type Props = {
  title: string;
  value: string;
  onValueChange: (value: string) => void;
};

export default function Input(props: Props) {
  const { title, value, onValueChange } = props;
  return (
    <div className="header-item-box">
      <div className="header-item-title">{title}</div>
      <div className="header-item-content">
        <input
          className="tokenizing-text-input"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
        />
      </div>
    </div>
  );
}
