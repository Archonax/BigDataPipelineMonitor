const mongoose = require('mongoose');

// Definice struktury dat pro Pipeline
const pipelineSchema = new mongoose.Schema({
    datasetId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    schedule: { type: String },
    active: { type: Boolean, default: true },
    schemaVersion: { type: Number, default: 1 }
}, { timestamps: true }); // Automaticky přidá createdAt a updatedAt

const Pipeline = mongoose.model('Pipeline', pipelineSchema);

module.exports = Pipeline;