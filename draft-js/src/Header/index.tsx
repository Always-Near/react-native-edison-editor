import React, { useState } from "react";
import Tokenizing from "../InputTokenizing";
import Input from "../Input";

type Props = {
  to: Contact[];
  cc: Contact[];
  bcc: Contact[];
  from: Contact[];
  subject: string;
  suggestions?: ContactWithAvatar[];
  onSugTextChange: (text: string) => void;
  onToChange: (contactList: Contact[]) => void;
  onCcChange: (contactList: Contact[]) => void;
  onBccChange: (contactList: Contact[]) => void;
  onSubjectChange: (subject: string) => void;
};

export default function Header({
  to,
  cc,
  bcc,
  from,
  subject,
  suggestions,
  onToChange,
  onCcChange,
  onBccChange,
  onSubjectChange,
  onSugTextChange,
}: Props) {
  const [ccBccVisible, setCcBccVisible] = useState(false);
  const showCcBcc = ccBccVisible || cc.length || bcc.length;

  const renderCcBccIcon = () => {
    return (
      <div
        className="compose-header-ccbcc-icon"
        onClick={() => setCcBccVisible(true)}
      >
        Cc Bcc
      </div>
    );
  };

  return (
    <div className="compose-header">
      <Tokenizing
        title="To:"
        contactList={to}
        onSugTextChange={onSugTextChange}
        onContactChange={onToChange}
        icon={showCcBcc ? null : renderCcBccIcon()}
        suggestions={suggestions}
      />
      {showCcBcc ? (
        <>
          <Tokenizing
            title="Cc:"
            contactList={cc}
            onSugTextChange={onSugTextChange}
            onContactChange={onCcChange}
            suggestions={suggestions}
          />
          <Tokenizing
            title="Bcc:"
            contactList={bcc}
            onSugTextChange={onSugTextChange}
            onContactChange={onBccChange}
            suggestions={suggestions}
          />
        </>
      ) : null}
      <Tokenizing title="From:" contactList={from} readOnly />
      <Input title="Subject:" value={subject} onValueChange={onSubjectChange} />
    </div>
  );
}
