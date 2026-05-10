const mongoose = require('mongoose');

const alertRuleSchema = new mongoose.Schema({
    pipelineId: { type: String, required: true },
    name: { type: String, required: true },
    condition: { type: String, required: true }, // např. "runtime > 10m"
    enabled: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('AlertRule', alertRuleSchema);