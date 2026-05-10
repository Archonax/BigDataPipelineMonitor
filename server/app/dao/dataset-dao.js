const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    owner: { type: String, default: "analytics-team" },
    schemaVersion: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Dataset', datasetSchema);