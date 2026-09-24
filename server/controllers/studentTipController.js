const {
  query,
  insertAndGetId,
  withTransaction
} = require('../config/db-universal');
const { createStudentTipService } = require('../services/studentTipService');

const service = createStudentTipService({ query, insertAndGetId, withTransaction });

function sendError(res, error) {
  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  if (statusCode >= 500) console.error('Student tip request error:', error);
  return res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? 'Server error' : error.message
  });
}

exports.create = async (req, res) => {
  try {
    const data = await service.createSuggestion(req.user.id, req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getMine = async (req, res) => {
  try {
    const data = await service.listMine(req.user.id);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getPublished = async (req, res) => {
  try {
    const data = await service.listPublished();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getReviewQueue = async (req, res) => {
  try {
    const data = await service.listReview({ status: req.query.status, search: req.query.search });
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.review = async (req, res) => {
  try {
    const data = await service.reviewSuggestion({
      ...req.body,
      suggestionId: req.params.id,
      reviewerId: req.user.id
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};
