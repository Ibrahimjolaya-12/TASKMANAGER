import { HttpError, asyncHandler } from '../utils/error.js';
import { uploadBuffer, destroyAsset } from '../config/cloudinary.js';
import { logActivity } from '../utils/activity.js';

const isModerator = (role) => ['Owner', 'Admin'].includes(role);

/** POST /tasks/:id/attachments (multipart field: file) */
export const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(422, 'No file provided (multipart field "file")');
  
  // Ensure req.task exists (handled by param middleware)
  if (!req.task) throw new HttpError(404, 'Task not found');
  
  if (req.task.attachments.length >= 20) {
    throw new HttpError(422, 'Attachment limit reached (max 20 per task)');
  }

  const uploaded = await uploadBuffer(req.file.buffer, `pm-saas/${req.task._id}`, req.file.originalname);

  const attachment = {
    url: uploaded.url,
    publicId: uploaded.publicId,
    filename: req.file.originalname,
    mime: uploaded.mime || req.file.mimetype,
    bytes: uploaded.bytes,
    uploadedBy: req.user._id,
  };

  req.task.attachments.push(attachment);
  logActivity(req.task, req.user._id, 'attachment_added', { to: req.file.originalname });
  await req.task.save();

  res.status(201).json({ success: true, task: req.task });
});

/** DELETE /tasks/:id/attachments/:attachmentId — uploader or workspace Admin+ */
export const deleteAttachment = asyncHandler(async (req, res) => {
  if (!req.task) throw new HttpError(404, 'Task not found');

  const attachment = req.task.attachments.id(req.params.attachmentId);
  if (!attachment) throw new HttpError(404, 'Attachment not found');

  const userRole = req.effectiveRole || 'Viewer';
  const canDelete = (attachment.uploadedBy && attachment.uploadedBy.equals(req.user._id)) || isModerator(userRole);
  
  if (!canDelete) {
    throw new HttpError(403, 'Only the uploader or a workspace admin can remove this file');
  }

  if (attachment.publicId) {
    await destroyAsset(attachment.publicId).catch(() => {
      // Asset already gone from Cloudinary — safely continue to remove reference
    });
  }

  req.task.attachments.pull(attachment);
  logActivity(req.task, req.user._id, 'attachment_removed', { from: attachment.filename });
  await req.task.save();

  res.json({ success: true, task: req.task });
});