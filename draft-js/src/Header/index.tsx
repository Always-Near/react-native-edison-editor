import React, { useState } from "react";
import Tokenizing from "../InputTokenizing";
import Input from "../Input";

type Props = {
  to: Contact[];
  cc: Contact[];
  bcc: Contact[];
  from: Contact[];
  subject: string;
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
  onToChange,
  onCcChange,
  onBccChange,
  onSubjectChange,
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
        onContactChange={onToChange}
        icon={showCcBcc ? null : renderCcBccIcon()}
      />
      {showCcBcc ? (
        <>
          <Tokenizing
            title="Cc:"
            contactList={cc}
            onContactChange={onCcChange}
          />
          <Tokenizing
            title="Bcc:"
            contactList={bcc}
            onContactChange={onBccChange}
          />
        </>
      ) : null}
      <Tokenizing title="From:" contactList={from} readOnly />
      <Input title="Subject:" value={subject} onValueChange={onSubjectChange} />
    </div>
  );
}
