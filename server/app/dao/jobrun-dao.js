const mongoose = require('mongoose');

const jobRunSchema = new mongoose.Schema({
    pipelineId: { type: String, required: true },
    pipelineVersion: { type: Number },
    status: { type: String, enum: ['pending', 'running', 'success', 'failed'], default: 'running' },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    recordsProcessed: { type: Number, default: 0 },
    errorMessage: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('JobRun', jobRunSchema);