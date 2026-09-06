import mongoose from 'mongoose';

const ROLES = ['Admin', 'Member', 'Viewer'];

const projectMemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ROLES, required: true },
  },
  { timestamps: true, _id: false }
);

const ICONS = ['folder', 'rocket', 'briefcase', 'bug', 'sparkles', 'target', 'layers', 'package', 'globe', 'zap'];

const projectSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: [true, 'Project name is required'], trim: true, maxlength: 100 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    color: { type: String, default: '#6366f1', match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex value'] },
    icon: { type: String, default: 'folder', enum: ICONS },
    // Project roles narrow workspace roles; empty array means workspace-level inheritance.
    members: { type: [projectMemberSchema], default: [] },
    archived: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

projectSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

projectSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export { ROLES, ICONS };
export default mongoose.model('Project', projectSchema);