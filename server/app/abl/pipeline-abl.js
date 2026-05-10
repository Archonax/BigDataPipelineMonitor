const Pipeline = require('../dao/pipeline-dao');
const Dataset = require('../dao/dataset-dao');
const JobRun = require('../dao/jobrun-dao'); 
const Alert = require('../dao/alert-dao');   
const AlertRule = require('../dao/alertrule-dao');
const JobRunStep = require('../dao/jobrunstep-dao');
const PipelineVersion = require('../dao/pipelineversion-dao');

async function createDataset(dtoIn) {
    const dataset = new Dataset(dtoIn);
    await dataset.save();
    return dataset;
}

async function createPipeline(dtoIn) {
    const dataset = await Dataset.findById(dtoIn.datasetId);
    if (!dataset) throw new Error('Validace selhala: Zadaný dataset neexistuje!');
    
    const pipeline = new Pipeline(dtoIn);
    await pipeline.save();

    // Vygenerování první aktivní verze
    const version = new PipelineVersion({
        pipelineId: pipeline._id,
        version: 1,
        active: true,
        config: { engine: "spark", query: "SELECT * FROM " + dataset.name }
    });
    await version.save();

    return pipeline;
}

async function listPipelines() {
    return await Pipeline.find();
}

// Funkce pro spuštění pipeline
async function runPipeline(pipelineId) {
    const pipeline = await Pipeline.findById(pipelineId);
    if (!pipeline) throw new Error('Pipeline neexistuje!');
    if (!pipeline.active) throw new Error('Nelze spustit neaktivní pipeline!');

    // Hledáme jedinou aktivní verzi
    const activeVersion = await PipelineVersion.findOne({ pipelineId: pipeline._id, active: true });
    if (!activeVersion) throw new Error('Pipeline nemá žádnou aktivní verzi!');

    const run = new JobRun({
        pipelineId: pipeline._id,
        pipelineVersion: activeVersion.version, // Přiřadíme číslo aktivní verze
        status: 'running'
    });
    await run.save();

    const steps = ['extract', 'transform', 'load'];
    for (const stepName of steps) {
        await new JobRunStep({
            runId: run._id,
            name: stepName,
            status: stepName === 'extract' ? 'running' : 'pending' 
        }).save();
    }
    return run;
}

async function getPipelineVersions(pipelineId) {
    return await PipelineVersion.find({ pipelineId }).sort({ version: -1 });
}

async function createPipelineVersion(pipelineId, config) {
    // Najdeme nejvyšší stávající verzi a přidáme +1
    const versions = await PipelineVersion.find({ pipelineId }).sort({ version: -1 });
    const nextVersion = versions.length > 0 ? versions[0].version + 1 : 1;

    const newVersion = new PipelineVersion({
        pipelineId,
        version: nextVersion,
        active: false, // Nová verze je standardně neaktivní
        config
    });
    await newVersion.save();
    return newVersion;
}
// Pomocná funkce pro bezpečné vyhodnocení podmínky alertu
function evaluateCondition(conditionStr, run) {
    if (!conditionStr) return false;
    
    // Odstraníme mezery a převedeme na malá písmena pro snazší porovnání
    const cond = conditionStr.replace(/\s+/g, '').toLowerCase();

    // 1. Podmínka: status == failed / success
    if (cond.includes('status==failed') || cond.includes('status=="failed"')) {
        return run.status === 'failed';
    }
    if (cond.includes('status==success') || cond.includes('status=="success"')) {
        return run.status === 'success';
    }

    // 2. Podmínka: runtime > Xm (např. runtime > 10m) 
    if (cond.includes('runtime>')) {
        const match = cond.match(/runtime>(\d+)m/);
        if (match) {
            const thresholdMinutes = parseInt(match[1], 10);
            // Výpočet skutečného času běhu v minutách
            const runtimeMs = run.finishedAt.getTime() - run.startedAt.getTime();
            const runtimeMinutes = runtimeMs / 60000;
            return runtimeMinutes > thresholdMinutes;
        }
    }

    return false; // Pokud podmínce nerozumíme, alert raději nevyvoláme
}
async function setActiveVersion(pipelineId, versionId) {
    // Pouze jedna verze může být aktivní
    // Nejprve deaktivujeme všechny verze dané pipeline
    await PipelineVersion.updateMany({ pipelineId }, { $set: { active: false } });
    // Poté aktivujeme tu vybranou
    return await PipelineVersion.findByIdAndUpdate(versionId, { active: true }, { new: true });
}

async function updateRunStatus(runId, finalStatus, errorMessage = null) {
    const run = await JobRun.findById(runId);
    if (!run) throw new Error('Běh neexistuje!');

    run.status = finalStatus;
    run.finishedAt = new Date();
    if (finalStatus === 'failed') {
        run.errorMessage = errorMessage;
    }
    
    await JobRunStep.updateMany(
        { runId: run._id, status: { $in: ['running', 'pending'] } },
        { $set: { status: finalStatus, finishedAt: new Date() } }
    );
    await run.save();

    // KONTROLA ALERTŮ 
    const activeRules = await AlertRule.find({ pipelineId: run.pipelineId, enabled: true });
    
    for (const rule of activeRules) {
        if (evaluateCondition(rule.condition, run)) {
            // Unikátní zpráva pro každé vyhodnocené pravidlo
            let alertMsg = `[${rule.name}] Podmínka: ${rule.condition}`;
            if (run.status === 'failed' && run.errorMessage) {
                alertMsg += ` | Detail: ${run.errorMessage}`;
            }
                
            await new Alert({
                ruleId: rule._id,
                runId: run._id,
                message: alertMsg
            }).save();
        }
    }
    
    return run;
}

async function updateStepStatus(runId, stepId, finalStatus, errorMessage = null) {
    const run = await JobRun.findById(runId);
    if (!run) throw new Error('Běh neexistuje!');

    const steps = await JobRunStep.find({ runId }).sort({ _id: 1 });
    const stepIndex = steps.findIndex(s => s._id.toString() === stepId);
    if (stepIndex === -1) throw new Error('Krok neexistuje!');

    const currentStep = steps[stepIndex];
    currentStep.status = finalStatus;
    currentStep.finishedAt = new Date();
    await currentStep.save();

    let runFinished = false; // Značka, jestli celý běh právě skončil

    if (finalStatus === 'success') {
        if (stepIndex + 1 < steps.length) {
            const nextStep = steps[stepIndex + 1];
            nextStep.status = 'running';
            await nextStep.save();
        } else {
            run.status = 'success';
            run.finishedAt = new Date();
            await run.save();
            runFinished = true;
        }
    } else if (finalStatus === 'failed') {
        for (let i = stepIndex + 1; i < steps.length; i++) {
            steps[i].status = 'failed';
            steps[i].finishedAt = new Date();
            await steps[i].save();
        }
        
        run.status = 'failed';
        run.errorMessage = errorMessage || `Chyba v kroku: ${currentStep.name.toUpperCase()}`;
        run.finishedAt = new Date();
        await run.save();
        runFinished = true;
    }

    // KONTROLA ALERTŮ 2
    if (runFinished) {
        const activeRules = await AlertRule.find({ pipelineId: run.pipelineId, enabled: true });
        for (const rule of activeRules) {
            if (evaluateCondition(rule.condition, run)) {
                // Unikátní zpráva pro každé vyhodnocené pravidlo
                let alertMsg = `[${rule.name}] Podmínka: ${rule.condition}`;
                if (run.status === 'failed' && run.errorMessage) {
                    alertMsg += ` | Detail: ${run.errorMessage}`;
                }

                await new Alert({
                    ruleId: rule._id,
                    runId: run._id,
                    message: alertMsg
                }).save();
            }
        }
    }

    return run;
}
async function listRuns() {
    return await JobRun.find().sort({ startedAt: -1 });
}

async function listAlerts() {
    return await Alert.find().sort({ createdAt: -1 });
}
async function createAlertRule(dtoIn) {
    const rule = new AlertRule(dtoIn);
    await rule.save();
    return rule;
}
// --- FUNKCE PRO ZÍSKÁNÍ DETAILŮ A SEZNAMŮ ---

async function listDatasets() {
    return await Dataset.find();
}

async function getDataset(id) {
    return await Dataset.findById(id);
}

async function getPipeline(id) {
    return await Pipeline.findById(id);
}

async function getRun(id) {
    return await JobRun.findById(id);
}

async function getAlert(id) {
    return await Alert.findById(id);
}

async function getAlertRule(id) {
    return await AlertRule.findById(id);
}

async function updateAlertRule(id, dtoIn) {
    return await AlertRule.findByIdAndUpdate(id, dtoIn, { new: true });
}

async function deleteAlertRule(id) {
    return await AlertRule.findByIdAndDelete(id);
}
async function listAlertRules() {
    return await AlertRule.find();
}
async function getRunSteps(runId) {
    return await JobRunStep.find({ runId });
}
module.exports = {
    createDataset,
    createPipeline,
    listPipelines,
    runPipeline,
    updateRunStatus,
    listRuns,
    listAlerts,
    createAlertRule,
    listAlertRules,
    getRunSteps,
    listDatasets,
    getDataset,
    getPipeline,
    getRun,
    getAlert,
    getAlertRule,
    updateAlertRule,
    deleteAlertRule,
    getPipelineVersions,
    createPipelineVersion,
    setActiveVersion,
    updateStepStatus
};