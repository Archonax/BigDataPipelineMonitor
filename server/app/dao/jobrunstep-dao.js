const mongoose = require('mongoose');

const jobRunStepSchema = new mongoose.Schema({
    runId: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['pending', 'running', 'success', 'failed'], default: 'running' },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('JobRunStep', jobRunStepSchema);