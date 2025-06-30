import React, { useState, useMemo } from "react";
import { useFinancialData } from "../../../../../contexts/FinancialDataContext";
import Section from "../../../../../components/ui/Section/Section";
import Button from "../../../../../components/ui/Button/Button";
import { calculatePlanProgress } from "../../../../../utils/planCalculations";
import {
  formatCurrency,
  formatPercentage,
} from "../../../../../utils/formatting";
import PlanEditor from "../components/PlanEditor";
import styles from "./RoadmapsTab.module.css";
import { DEMO_PLANS } from "../../../../../utils/constants";

const RoadmapsTab = () => {
  const { data, saveData, resetPlansToDemo, clearPlans } = useFinancialData();
  const { plans, goals, accounts } = data || {};
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const allRoadmaps = useMemo(() => {
    return (plans || []).map((plan) => ({
      ...plan,
      progress: calculatePlanProgress(plan, goals || [], accounts || []),
    }));
  }, [plans, goals, accounts]);

  const selectedRoadmap = useMemo(() => {
    if (!selectedPlanId && allRoadmaps.length > 0) {
      setSelectedPlanId(allRoadmaps[0].id);
      return allRoadmaps[0];
    }
    return allRoadmaps.find((roadmap) => roadmap.id === selectedPlanId);
  }, [selectedPlanId, allRoadmaps]);

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setShowPlanEditor(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setShowPlanEditor(true);
  };

  const handleClosePlanEditor = () => {
    setShowPlanEditor(false);
    setEditingPlan(null);
  };

  const handleSavePlan = (planData) => {
    const updatedPlans = plans || [];

    if (editingPlan && editingPlan.id) {
      const planIndex = updatedPlans.findIndex((p) => p.id === editingPlan.id);
      if (planIndex !== -1) {
        updatedPlans[planIndex] = { ...planData };
      }
    } else {
      const newPlan = {
        ...planData,
        id: `plan-${Date.now()}`,
      };
      updatedPlans.push(newPlan);
    }

    saveData({ ...data, plans: updatedPlans });
    setShowPlanEditor(false);
    setEditingPlan(null);
  };

  const handleDeletePlan = (planId) => {
    if (window.confirm("Are you sure you want to delete this roadmap?")) {
      const updatedPlans = (plans || []).filter((p) => p.id !== planId);
      saveData({ ...data, plans: updatedPlans });

      if (selectedPlanId === planId) {
        const remainingPlans = updatedPlans;
        if (remainingPlans.length > 0) {
          setSelectedPlanId(remainingPlans[0].id);
        } else {
          setSelectedPlanId(null);
        }
      }
    }
  };

  if (showPlanEditor) {
    return (
      <PlanEditor
        plan={editingPlan}
        onSave={handleSavePlan}
        onCancel={handleClosePlanEditor}
      />
    );
  }

  return (
    <div className={styles.roadmapsTab}>
      <Section title="Financial Roadmaps">
        <div className={styles.roadmapControls}>
          {allRoadmaps.length > 0 && (
            <div className={styles.roadmapSelector}>
              <label htmlFor="roadmap-select" className={styles.selectorLabel}>
                Current Roadmap:
              </label>
              <select
                id="roadmap-select"
                value={selectedPlanId || ""}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className={styles.roadmapSelect}
              >
                {allRoadmaps.map((roadmap) => (
                  <option key={roadmap.id} value={roadmap.id}>
                    {roadmap.name}
                    {roadmap.progress
                      ? ` (${formatPercentage(roadmap.progress)})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.actionButtons}>
            <Button onClick={handleCreatePlan} variant="primary" size="small">
              Create New Roadmap
            </Button>
            {selectedRoadmap && (
              <>
                <Button
                  onClick={() => handleEditPlan(selectedRoadmap)}
                  variant="secondary"
                  size="small"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDeletePlan(selectedRoadmap.id)}
                  variant="danger"
                  size="small"
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {selectedRoadmap ? (
          <div className={styles.roadmapContent}>
            <div className={styles.userPlanDisplay}>
              <div className={styles.planHeader}>
                <h3>{selectedRoadmap.name}</h3>
                <p>{selectedRoadmap.description}</p>
                {selectedRoadmap.progress !== undefined && (
                  <div className={styles.progressIndicator}>
                    <span>
                      Progress: {formatPercentage(selectedRoadmap.progress)}
                    </span>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width: `${Math.min(100, selectedRoadmap.progress)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {selectedRoadmap.milestones &&
                selectedRoadmap.milestones.length > 0 && (
                  <div className={styles.milestonesSection}>
                    <h4>Milestones</h4>
                    <div className={styles.milestonesList}>
                      {selectedRoadmap.milestones.map((milestone) => {
                        let currentValue = 0;
                        let isComplete = false;

                        if (milestone.linkedSource?.type === "goal") {
                          const goal = (goals || []).find(
                            (g) => g.id === milestone.linkedSource.id
                          );
                          currentValue = goal?.currentAmount || 0;
                          isComplete = currentValue >= milestone.targetAmount;
                        } else if (milestone.linkedSource?.type === "account") {
                          const account = (accounts || []).find(
                            (a) => a.id === milestone.linkedSource.id
                          );
                          if (account?.category === "Debt") {
                            currentValue = Math.max(
                              0,
                              milestone.targetAmount - Math.abs(account.value)
                            );
                            isComplete = Math.abs(account.value) <= 0;
                          } else {
                            currentValue = account?.value || 0;
                            isComplete = currentValue >= milestone.targetAmount;
                          }
                        }

                        const progress =
                          milestone.targetAmount > 0
                            ? (currentValue / milestone.targetAmount) * 100
                            : 0;

                        return (
                          <div
                            key={milestone.id}
                            className={`${styles.milestoneItem} ${
                              isComplete ? styles.complete : ""
                            }`}
                          >
                            <div className={styles.milestoneHeader}>
                              <h5>{milestone.name}</h5>
                              <span className={styles.milestoneStatus}>
                                {isComplete
                                  ? "✓"
                                  : `${formatPercentage(progress)}`}
                              </span>
                            </div>
                            <div className={styles.milestoneDetails}>
                              <span>
                                {formatCurrency(currentValue)} /{" "}
                                {formatCurrency(milestone.targetAmount)}
                              </span>
                            </div>
                            <div className={styles.milestoneProgress}>
                              <div
                                className={styles.milestoneProgressFill}
                                style={{
                                  width: `${Math.min(100, progress)}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3>No Roadmaps Found</h3>
            <p>Create your first financial roadmap to get started!</p>
            <p>Or reset to demo data to see an example.</p>
          </div>
        )}

        {/* Control Panel - positioned like Goals tab */}
        <div className={styles.controlPanel}>
          <Button onClick={resetPlansToDemo} variant="warning" size="small">
            Reset to Demo
          </Button>
          <Button onClick={clearPlans} variant="danger" size="small">
            Clear All
          </Button>
        </div>
      </Section>
    </div>
  );
};

export default RoadmapsTab;
