const Client = require('../models/client.model');

// Create a new client
const createClient = async (req, res) => {
    try {
        const { name, type, since, pendingItems, lastFiling, complianceBreakdown, recentActivity, upcomingDeadlines, billing, paymentCycles, aiFeedback, alerts } = req.body;
        const client = new Client({
            name,
            type,
            since,
            pendingItems,
            lastFiling,
            complianceBreakdown,
            recentActivity,
            upcomingDeadlines,
            billing,
            paymentCycles,
            aiFeedback,
            alerts
        });
        await client.save();
        return res.status(201).json({ message: 'Client created', client });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create client', error: error.message });
    }
};

// Get all clients
const getAllClients = async (req, res) => {
    try {
        const clients = await Client.find();
        return res.status(200).json({ clients });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch clients', error: error.message });
    }
};

// Get a single client by ID
const getClient = async (req, res) => {
    try {
        const { id } = req.params;
        const client = await Client.findById(id);
        if (!client) return res.status(404).json({ message: 'Client not found' });
        return res.status(200).json({ client });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch client', error: error.message });
    }
};

module.exports = {
    createClient,
    getAllClients,
    getClient
};