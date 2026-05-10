const mongoose = require('mongoose');

const pipelineVersionSchema = new mongoose.Schema({
    pipelineId: { type: String, required: true },
    version: { type: Number, required: true },
    active: { type: Boolean, default: false }, // Nový atribut podle doménového pravidla
    config: {
        engine: { type: String, default: 'spark' },
        query: { type: String }
    }
}, { timestamps: true });

module.exports = mongoose.model('PipelineVersion', pipelineVersionSchema);