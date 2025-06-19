import React from "react";
import { Pencil, X } from "lucide-react";
import styles from "../Section/Section.module.css";

const EditableTableHeader = ({
  title,
  editMode,
  onEnterEdit,
  onCancelEdit,
  editable = true,
  ...props
}) => {
  const rightControl = editable ? (
    editMode ? (
      <button
        className={styles.editButton}
        onClick={onCancelEdit}
        title="Cancel Edit"
        aria-label="Cancel editing"
      >
        <X size={18} />
      </button>
    ) : (
      <button
        className={styles.editButton}
        onClick={onEnterEdit}
        title="Edit Table"
        aria-label="Edit table"
      >
        <Pencil size={18} />
      </button>
    )
  ) : null;

  return (
    <div className={styles.sectionHeaderLeft}>
      <h3 className={styles.sectionHeaderTitle}>{title}</h3>
      {rightControl}
    </div>
  );
};

export default EditableTableHeader;
