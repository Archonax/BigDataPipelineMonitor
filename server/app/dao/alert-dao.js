const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    ruleId: { type: String, required: true },
    runId: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, default: 'high' }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);