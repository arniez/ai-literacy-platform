const { query, insertAndGetId, withTransaction } = require('../config/db-universal');
const { createAiStudentIntegrationService } = require('../services/aiStudentIntegrationService');

const service = createAiStudentIntegrationService({ query, insertAndGetId, withTransaction });

function sendError(res, error) {
  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  if (statusCode >= 500) console.error('AI student integration request error:', error);
  return res.status(statusCode).json({ success: false, message: statusCode >= 500 ? 'Server error' : error.message });
}

exports.listLessons = async (req, res) => {
  try {
    const data = await service.listLessons(req.query.version);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) { return sendError(res, error); }
};

exports.importCatalog = async (req, res) => {
  try {
    const data = await service.importCatalog();
    return res.status(200).json({ success: true, data });
  } catch (error) { return sendError(res, error); }
};

exports.setPublication = async (req, res) => {
  try {
    const data = await service.setPublication(req.params.id, req.body?.isPublished);
    return res.status(200).json({ success: true, data });
  } catch (error) { return sendError(res, error); }
};
