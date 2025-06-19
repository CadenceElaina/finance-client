import React from "react";
import Section from "../../../../../components/ui/Section/Section";
import EditableTableHeader from "../../../../../components/ui/Table/EditableTableHeader";
import planStyles from "../plan.module.css";
import sectionStyles from "../../../../../components/ui/Section/Section.module.css";

const ProjectionsTab = ({ smallApp }) => {
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
          <h3>Net Worth Projections</h3>
          <p>
            See how your net worth will grow over time based on your current
            financial situation and goals.
          </p>
          <br />
          <h3>Cash Flow Analysis</h3>
          <p>
            Analyze your monthly cash flow and identify opportunities for
            improvement.
          </p>
          <br />
          <h3>Goal Progress Forecasting</h3>
          <p>
            Track your progress toward financial goals and adjust your strategy
            as needed.
          </p>
          <br />
          <p>
            <strong>Coming soon...</strong>
          </p>
        </div>
      </Section>
    </div>
  );
};

export default ProjectionsTab;
