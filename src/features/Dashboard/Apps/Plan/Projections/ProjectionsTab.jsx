import React from "react";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";
import planStyles from "../plan.module.css";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";

const ProjectionsTab = ({ smallApp }) => {
  const { data } = useFinancialData();

  return (
    <div className={planStyles.planContentWrapper}>
      <Section
        header={
          <div className={sectionStyles.sectionHeaderRow}>
            <EditableTableHeader
              title="Financial Projections"
              editMode={false}
              editable={false}
            />
          </div>
        }
      >
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-xl)",
            color: "var(--text-secondary)",
          }}
        >
          <h3>Coming Soon</h3>
          <p>
            Financial projections and scenario planning will be available here.
          </p>
          <p>
            This will include net worth projections, goal completion timelines,
            and retirement planning scenarios based on your current budget,
            accounts, and goals.
          </p>
        </div>
      </Section>
    </div>
  );
};

export default ProjectionsTab;
