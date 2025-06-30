import React, { useState } from "react";

const PlanEditor = ({ plan, onSave, onCancel }) => {
  const [editedPlan, setEditedPlan] = useState(plan);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedPlan((prevPlan) => ({
      ...prevPlan,
      [name]: value,
    }));
  };

  const handleMilestoneChange = (index, field, value) => {
    const newMilestones = [...editedPlan.milestones];
    newMilestones[index] = {
      ...newMilestones[index],
      [field]: value,
    };
    setEditedPlan((prevPlan) => ({
      ...prevPlan,
      milestones: newMilestones,
    }));
  };

  const handleAddMilestone = () => {
    const newMilestone = {
      id: `milestone-${Date.now()}`,
      name: "",
      targetAmount: 0,
      linkedSource: { type: "manual", id: null },
    };
    setEditedPlan((prevPlan) => ({
      ...prevPlan,
      milestones: [...prevPlan.milestones, newMilestone],
    }));
  };

  const handleRemoveMilestone = (index) => {
    const newMilestones = [...editedPlan.milestones];
    newMilestones.splice(index, 1);
    setEditedPlan((prevPlan) => ({
      ...prevPlan,
      milestones: newMilestones,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedPlan);
  };

  return (
    <div className="plan-editor">
      <h2>{plan.id ? "Edit Plan" : "Create Plan"}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Plan Name</label>
          <input
            type="text"
            name="name"
            value={editedPlan.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Description</label>
          <textarea
            name="description"
            value={editedPlan.description}
            onChange={handleChange}
          />
        </div>

        <h3>Milestones</h3>
        {editedPlan.milestones.map((milestone, index) => (
          <div key={milestone.id} className="milestone-editor">
            <input
              type="text"
              placeholder="Milestone Name"
              value={milestone.name}
              onChange={(e) =>
                handleMilestoneChange(index, "name", e.target.value)
              }
              required
            />
            <input
              type="number"
              placeholder="Target Amount"
              value={milestone.targetAmount}
              onChange={(e) =>
                handleMilestoneChange(
                  index,
                  "targetAmount",
                  parseFloat(e.target.value)
                )
              }
              required
            />
            <button type="button" onClick={() => handleRemoveMilestone(index)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={handleAddMilestone}>
          Add Milestone
        </button>

        <div>
          <button type="submit">Save Plan</button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlanEditor;
