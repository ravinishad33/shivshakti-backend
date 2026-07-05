const Site = require('../models/siteModel');

/**
 * @desc    1. Admin Creates/Adds a New Construction Site
 * @route   POST /api/sites
 */
const addSite = async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name || !location) {
      return res.status(400).json({ message: 'Site name and location fields are required.' });
    }

    const newSite = await Site.create({ name, location });
    return res.status(201).json({ message: 'Construction site registered successfully', site: newSite });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to initialize construction site path.' });
  }
};

/**
 * @desc    2. Get All Registered Construction Sites
 * @route   GET /api/sites
 */
const getAllSites = async (req, res) => {
  try {
    const sites = await Site.find({}).sort({ createdAt: -1 });
    return res.status(200).json(sites);
  } catch (error) {
    return res.status(500).json({ message: 'Error pulling site registry sheets.' });
  }
};

/**
 * @desc    3. Admin Updates an Existing Site Profile
 * @route   PUT /api/sites/:id
 */
const updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, status } = req.body;

    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({ message: 'Target construction site profile not found.' });
    }

    if (name) site.name = name;
    if (location) site.location = location;
    if (status) site.status = status;

    await site.save();
    return res.status(200).json({ message: 'Site parameters synchronized cleanly', site });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to patch site logging matrices.' });
  }
};

/**
 * @desc    4. Admin Removes/Purges a Site Document
 * @route   DELETE /api/sites/:id
 */
const deleteSite = async (req, res) => {
  try {
    const { id } = req.params;
    const site = await Site.findById(id);
    
    if (!site) {
      return res.status(404).json({ message: 'Target site not found.' });
    }

    await site.deleteOne();
    return res.status(200).json({ message: `Site entries dropped successfully.` });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove structural site document mapping.' });
  }
};

module.exports = { addSite, getAllSites, updateSite, deleteSite };