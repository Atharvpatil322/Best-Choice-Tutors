/**
 * Tutor Bank Details Controller
 * GET returns masked data only. PUT upserts with validation; sensitive fields are encrypted at rest.
 */

import Tutor from '../models/Tutor.js';
import {
  createOrUpdateBankDetails,
  getBankDetailsForTutor,
} from '../services/tutorBankDetailsService.js';

/**
 * GET /api/tutor/bank-details
 * Returns bank details for the authenticated tutor. Sensitive fields are masked only (e.g. ****1234).
 */
export const getBankDetails = async (req, res, next) => {
  try {
    if (req.user.role !== 'Tutor') {
      return res.status(403).json({
        message: 'This endpoint is only accessible to Tutors',
      });
    }

    const tutor = await Tutor.findOne({ userId: req.user._id }).lean();
    if (!tutor) {
      return res.status(404).json({
        message: 'Tutor profile not found',
      });
    }

    const bankDetails = await getBankDetailsForTutor(tutor._id);
    if (!bankDetails) {
      return res.status(404).json({
        message: 'No bank details on file. Add bank details to be eligible for withdrawals.',
      });
    }

    res.json(bankDetails);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tutor/bank-details
 * Create or update bank details. Request body: accountHolderName, bankName, accountNumber,
 * sortCode (UK) or ifscCode (India), country. Sensitive fields are encrypted; response is masked only.
 */
export const upsertBankDetails = async (req, res, next) => {
  try {
    if (req.user.role !== 'Tutor') {
      return res.status(403).json({
        message: 'This endpoint is only accessible to Tutors',
      });
    }

    const tutor = await Tutor.findOne({ userId: req.user._id }).lean();
    if (!tutor) {
      return res.status(404).json({
        message: 'Tutor profile not found',
      });
    }

    const {
      accountHolderName,
      bankName,
      accountNumber,
      sortCode,
      ifscCode,
      country,
    } = req.body;

    // sortCodeOrIfsc: prefer sortCode for UK, ifscCode for India, else either
    const sortCodeOrIfsc =
      (country && String(country).toUpperCase() === 'GB') || String(country).toUpperCase() === 'UK'
        ? sortCode
        : (country && String(country).toUpperCase() === 'IN')
          ? ifscCode
          : sortCode || ifscCode;

    await createOrUpdateBankDetails(tutor._id, {
      accountHolderName,
      bankName,
      accountNumber,
      sortCodeOrIfsc,
      country,
    });

    const bankDetails = await getBankDetailsForTutor(tutor._id);
    res.status(200).json(bankDetails);
  } catch (error) {
    next(error);
  }
};
