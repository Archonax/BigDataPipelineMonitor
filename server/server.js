const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 8000;

// Middleware pro zpracování JSON dat a povolení přístupu z frontendu
app.use(express.json());
app.use(cors());

// Připojení k lokální MongoDB databázi
mongoose.connect('mongodb://127.0.0.1:27017/pipeline-monitor')
  .then(() => console.log('Připojeno k MongoDB!'))
  .catch((err) => console.error('Chyba připojení k databázi:', err));

// Základní testovací endpoint
app.get('/', (req, res) => {
    res.send('Backend Big Data Pipeline Monitor běží!');
});
// Načtení business logiky
const pipelineAbl = require('./app/abl/pipeline-abl');

// Založení datasetu
app.post('/datasets', async (req, res) => {
    try {
        const dataset = await pipelineAbl.createDataset(req.body);
        res.status(201).json(dataset);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Založení pravidla pro alert
app.post('/alert-rules', async (req, res) => {
    try {
        const rule = await pipelineAbl.createAlertRule(req.body);
        res.status(201).json(rule);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
app.get('/runs/:id/steps', async (req, res) => {
    try { res.status(200).json(await pipelineAbl.getRunSteps(req.params.id)); } 
    catch (error) { res.status(500).json({ error: error.message }); }
});
// Získání seznamu pravidel
app.get('/alert-rules', async (req, res) => {
    try {
        const rules = await pipelineAbl.listAlertRules();
        res.status(200).json(rules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Založení pipeline
app.post('/pipelines', async (req, res) => {
    try {
        const pipeline = await pipelineAbl.createPipeline(req.body);
        res.status(201).json(pipeline);
    } catch (error) {
        // Zde se zachytí naše doménové pravidlo, pokud dataset neexistuje
        res.status(400).json({ error: error.message }); 
    }
});

// GET /datasets (Seznam datasetů)
app.get('/datasets', async (req, res) => {
    try {
        const datasets = await pipelineAbl.listDatasets();
        res.status(200).json(datasets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /datasets/:id
app.get('/datasets/:id', async (req, res) => {
    try {
        const dataset = await pipelineAbl.getDataset(req.params.id);
        if (!dataset) return res.status(404).json({ error: 'Dataset nenalezen' });
        res.status(200).json(dataset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /pipelines/:id
app.get('/pipelines/:id', async (req, res) => {
    try {
        const pipeline = await pipelineAbl.getPipeline(req.params.id);
        if (!pipeline) return res.status(404).json({ error: 'Pipeline nenalezena' });
        res.status(200).json(pipeline);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /runs/:id
app.get('/runs/:id', async (req, res) => {
    try {
        const run = await pipelineAbl.getRun(req.params.id);
        if (!run) return res.status(404).json({ error: 'Běh nenalezen' });
        res.status(200).json(run);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /alerts/:id
app.get('/alerts/:id', async (req, res) => {
    try {
        const alert = await pipelineAbl.getAlert(req.params.id);
        if (!alert) return res.status(404).json({ error: 'Alert nenalezen' });
        res.status(200).json(alert);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /alert-rules/:id
app.get('/alert-rules/:id', async (req, res) => {
    try {
        const rule = await pipelineAbl.getAlertRule(req.params.id);
        if (!rule) return res.status(404).json({ error: 'Pravidlo nenalezeno' });
        res.status(200).json(rule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /alert-rules/:id 
app.patch('/alert-rules/:id', async (req, res) => {
    try {
        const rule = await pipelineAbl.updateAlertRule(req.params.id, req.body);
        if (!rule) return res.status(404).json({ error: 'Pravidlo nenalezeno' });
        res.status(200).json(rule);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /alert-rules/:id 
app.delete('/alert-rules/:id', async (req, res) => {
    try {
        await pipelineAbl.deleteAlertRule(req.params.id);
        res.status(204).send(); // 204 "No Content" (úspěšně smazáno)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Získání seznamu pipeline
app.get('/pipelines', async (req, res) => {
    try {
        const pipelines = await pipelineAbl.listPipelines();
        res.status(200).json(pipelines);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Získání seznamu všech běhů
app.get('/runs', async (req, res) => {
    try {
        const runs = await pipelineAbl.listRuns();
        res.status(200).json(runs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Spuštění konkrétní pipeline (vytvoří JobRun)
app.post('/pipelines/:id/run', async (req, res) => {
    try {
        // req.params.id bere ID přímo z URL adresy
        const run = await pipelineAbl.runPipeline(req.params.id); 
        res.status(201).json(run);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Změna stavu běhu (simulace dokončení/chyby z frontendu)
app.patch('/runs/:id', async (req, res) => {
    try {
        const { status, errorMessage } = req.body;
        const run = await pipelineAbl.updateRunStatus(req.params.id, status, errorMessage);
        res.status(200).json(run);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Získání seznamu alertů
app.get('/alerts', async (req, res) => {
    try {
        const alerts = await pipelineAbl.listAlerts();
        res.status(200).json(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Získání verzí pro konkrétní pipeline
app.get('/pipelines/:id/versions', async (req, res) => {
    try { res.status(200).json(await pipelineAbl.getPipelineVersions(req.params.id)); }
    catch (error) { res.status(500).json({ error: error.message }); }
});

// Vytvoření nové verze (např. při změně SQL dotazu)
app.post('/pipelines/:id/versions', async (req, res) => {
    try { res.status(201).json(await pipelineAbl.createPipelineVersion(req.params.id, req.body)); }
    catch (error) { res.status(400).json({ error: error.message }); }
});
// Změna stavu konkrétního KROKU
app.patch('/runs/:runId/steps/:stepId', async (req, res) => {
    try {
        const { status, errorMessage } = req.body;
        const run = await pipelineAbl.updateStepStatus(req.params.runId, req.params.stepId, status, errorMessage);
        res.status(200).json(run);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Změna aktivní verze (přepnutí)
app.patch('/pipelines/:id/versions/:versionId/activate', async (req, res) => {
    try { res.status(200).json(await pipelineAbl.setActiveVersion(req.params.id, req.params.versionId)); }
    catch (error) { res.status(400).json({ error: error.message }); }
});
// Spuštění serveru
app.listen(PORT, () => {
    console.log(`Server naslouchá na portu http://localhost:${PORT}`);
});